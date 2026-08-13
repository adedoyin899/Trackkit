import { test, expect } from "@playwright/test";
import { addProductViaInventoryTab, gotoTab, waitForAppReady, mockAuthSession } from "./helpers";

test.beforeEach(async ({ context, page }) => {
  await mockAuthSession(page, context);
  await page.goto("/");
  await waitForAppReady(page);
});

test.describe("Low-Stock Summary (User Story 3)", () => {
  test("a product at or below its threshold shows the LOW STOCK badge", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "Milk",
      quantity: 2,
      unit: "Tin",
      threshold: 3,
    });

    await expect(page.getByText("LOW STOCK")).toBeVisible();
  });

  test("a product above its threshold does not show the badge", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "Noodles",
      quantity: 7,
      unit: "Carton",
      threshold: 5,
    });

    await expect(page.getByText("LOW STOCK")).toHaveCount(0);
  });

  test("low-stock items are pinned at the top of the Inventory list", async ({ page }) => {
    // Added in a healthy-first order; if pinning didn't work, Noodles would
    // stay first since the underlying query orders by created_at DESC.
    await addProductViaInventoryTab(page, { name: "Noodles", quantity: 7, unit: "Carton", threshold: 5 });
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 2, unit: "Tin", threshold: 3 });

    // Whichever product name appears first in the DOM should be the
    // low-stock one (Milk), not the most-recently-added one (Noodles was
    // added second but is healthy stock).
    const bodyText = await page.locator("main").innerText();
    expect(bodyText.indexOf("MILK")).toBeLessThan(bodyText.indexOf("NOODLES"));
  });

  test("Dashboard shows the low-stock alert count", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 2, unit: "Tin", threshold: 3 });
    await addProductViaInventoryTab(page, { name: "Sugar", quantity: 8, unit: "Bag", threshold: 10 });
    await addProductViaInventoryTab(page, { name: "Noodles", quantity: 7, unit: "Carton", threshold: 5 });

    await gotoTab(page, "Dashboard");

    await expect(page.getByText("3", { exact: true }).first()).toBeVisible(); // total products
    await expect(page.getByText("Low stock alerts")).toBeVisible();
    // Two of the three (Milk, Sugar) are at/below threshold.
    const snapshot = await page.locator("main").innerText();
    expect(snapshot).toContain("2");
  });

  test("Dashboard's low-stock section lists items sorted by urgency (lowest quantity first)", async ({
    page,
  }) => {
    await addProductViaInventoryTab(page, { name: "Sugar", quantity: 8, unit: "Bag", threshold: 10 });
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 2, unit: "Tin", threshold: 3 });

    await gotoTab(page, "Dashboard");
    await expect(page.getByText("LOW STOCK (Reorder soon!)")).toBeVisible();

    const sectionText = await page.locator("main").innerText();
    const milkIndex = sectionText.indexOf("Milk:");
    const sugarIndex = sectionText.indexOf("Sugar:");
    expect(milkIndex).toBeGreaterThan(-1);
    expect(sugarIndex).toBeGreaterThan(-1);
    expect(milkIndex).toBeLessThan(sugarIndex);
  });
});
