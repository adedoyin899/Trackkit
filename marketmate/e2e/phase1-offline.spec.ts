import { test, expect } from "@playwright/test";
import { addProductViaInventoryTab, gotoTab, waitForAppReady } from "./helpers";

test.describe("Offline Mode (offline-first service worker, Prompt 3)", () => {
  test("app works fully offline after one prior online visit, and changes made offline survive reconnecting", async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    // 1. First visit online — registers the service worker and populates
    // its cache. A hand-rolled SW (no next-pwa/Workbox — see process.md)
    // can't precache content-hashed chunks ahead of time, so offline only
    // works from the *second* visit on; this is why the test explicitly
    // does one real online visit first rather than starting offline.
    await page.goto("/");
    await waitForAppReady(page);
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return Boolean(reg?.active && reg.active.state === "activated" && navigator.serviceWorker.controller);
      },
      { timeout: 15_000 },
    );

    await addProductViaInventoryTab(page, { name: "Rice", quantity: 5, unit: "Carton" });

    // 2. Go offline, then reload — this is the actual "disable network,
    // does the app still load" check.
    await context.setOffline(true);
    await page.reload();
    await waitForAppReady(page);

    await expect(page.getByText("Offline mode", { exact: false })).toBeVisible({ timeout: 10_000 });

    // 3. Can still view/edit products while offline — SQLite/IndexedDB
    // never touches the network to begin with.
    await gotoTab(page, "Inventory");
    await expect(page.getByText("RICE", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Increase Rice by 1" }).click();
    await expect(page.getByText("6", { exact: true })).toBeVisible();

    // 4. Add an entirely new product while fully offline.
    await addProductViaInventoryTab(page, { name: "Beans", quantity: 3, unit: "Bag" });

    // 5. Back online — offline indicator clears, no console errors thrown
    // by the reconnect itself (Phase 1 has no sync layer to fail).
    await context.setOffline(false);
    await expect(page.getByText("Offline mode", { exact: false })).toBeHidden({ timeout: 5_000 });

    // 6. Reload once more online — confirm everything done offline persisted.
    await page.reload();
    await waitForAppReady(page);
    await gotoTab(page, "Inventory");
    await expect(page.getByText("RICE", { exact: false })).toBeVisible();
    await expect(page.getByText("6", { exact: true })).toBeVisible();
    await expect(page.getByText("BEANS", { exact: false })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
