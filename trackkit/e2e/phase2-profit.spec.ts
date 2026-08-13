import { test, expect } from "@playwright/test";
import { addProductViaInventoryTab, gotoTab, waitForAppReady, mockAuthSession } from "./helpers";

test.describe("Phase 2 Profit Features & Margin Analysis", () => {
  test.beforeEach(async ({ context, page }) => {
    await mockAuthSession(page, context);
  });

  test("calculates margin, displays in card, shows profitability dashboard, and updates price via modal", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // 1. Add low-margin product via Inventory Tab
    // Milk: cost 800, selling price 810 -> margin = 1.25% (rounded to 1%)
    await addProductViaInventoryTab(page, {
      name: "Milk",
      quantity: 20,
      unit: "Tin",
      price: 810,
      cost: 800,
    });

    // 2. Expand Pricing & Margins panel on the Product Card
    // (By default it's expanded, but let's click to be sure or verify its elements)
    await expect(page.getByText("Pricing & Margins", { exact: false })).toBeVisible();
    await expect(page.getByText("1% (₦10)", { exact: false })).toBeVisible();

    // 3. Navigate to Margins tab
    await gotoTab(page, "Margins");

    // 4. Verify profitability metrics and warning alerts
    await expect(page.getByText("Margin Analysis")).toBeVisible();
    await expect(page.getByText("MILK: Only 1% margin. Reprice to ₦1040+ for 30% margin?")).toBeVisible();

    // 5. Click Reprice button to open PriceUpdateModal
    await page.getByRole("button", { name: "Reprice" }).first().click();

    // Verify modal is open and has details
    await expect(page.getByRole("heading", { name: "Update Pricing" })).toBeVisible();
    await expect(page.locator("form").getByText("Milk", { exact: true })).toBeVisible();
    await expect(page.locator("form").getByText("1% (₦10)", { exact: false }).first()).toBeVisible();

    // 6. Click Suggest 30% margin button
    await page.getByRole("button", { name: "Suggest 30% margin" }).click();

    // Verify selling price input is updated to 1040
    const priceInput = page.locator('input[placeholder="Selling Price"]');
    await expect(priceInput).toHaveValue("1040");

    // 7. Save changes
    await page.getByRole("button", { name: "Save" }).click();

    // 8. Verify dashboard updates
    // Warning section should disappear or no longer list Milk
    await expect(page.getByText("MILK: Only 1% margin. Reprice to ₦1040+ for 30% margin?")).not.toBeVisible();

    // Margin in table should be 30%
    await expect(page.getByRole("table").getByText("30%")).toBeVisible();
  });
});
