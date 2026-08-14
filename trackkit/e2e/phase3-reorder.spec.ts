import { test, expect } from "@playwright/test";
import { waitForAppReady, gotoTab, addProductViaInventoryTab } from "./helpers";

test.describe("Phase 3: Reorder Recommendations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("no section shown when there's no sales history to project from", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 50, unit: "Carton", cost: 700, price: 800 });
    await gotoTab(page, "Dashboard");
    await expect(page.getByText("Reorder Recommendations")).not.toBeVisible();
  });

  test("a product with recent sales gets a reorder recommendation with correct math", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Carton", cost: 700, price: 800 });

    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
      await page.waitForTimeout(150);
    }

    await gotoTab(page, "Dashboard");

    await expect(page.getByText("Reorder Recommendations")).toBeVisible();
    await expect(page.getByText("MILK", { exact: false })).toBeVisible();
    await expect(page.getByText("2 Carton(s) left")).toBeVisible();
    // velocity = 3/7/day -> recommendedQty = ceil(3/7 * 14 * 1.2) = 8
    await expect(page.getByText(/Buy 8 Carton\(s\)/)).toBeVisible();
    // 8 * ₦700 cost = ₦5,600
    await expect(page.getByText("Est. cost: ₦5,600")).toBeVisible();
  });

  test("urgency filter chips narrow the list", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Carton", cost: 700, price: 800 });
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
      await page.waitForTimeout(150);
    }
    await gotoTab(page, "Dashboard");

    await expect(page.getByRole("button", { name: "Medium (1)" })).toBeVisible();
    await page.getByRole("button", { name: "High (0)" }).click();
    await expect(page.getByText("MILK", { exact: false })).not.toBeVisible();

    await page.getByRole("button", { name: /^All/ }).click();
    await expect(page.getByText("MILK", { exact: false })).toBeVisible();
  });

  test("Mark as ordered dismisses the recommendation immediately and it stays gone after reload", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Carton", cost: 700, price: 800 });
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
      await page.waitForTimeout(150);
    }
    await gotoTab(page, "Dashboard");
    await expect(page.getByText("Reorder Recommendations")).toBeVisible();

    await page.getByRole("button", { name: "Mark as ordered" }).click();
    await expect(page.getByText("Reorder Recommendations")).not.toBeVisible();

    await page.reload();
    await waitForAppReady(page);
    await gotoTab(page, "Dashboard");
    await expect(page.getByText("Reorder Recommendations")).not.toBeVisible();
  });

  test("existing Low Stock alert section still works alongside the new recommendations", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Carton", cost: 700, price: 800, threshold: 10 });
    await gotoTab(page, "Dashboard");
    await expect(page.getByText("LOW STOCK (Reorder soon!)")).toBeVisible();
  });
});
