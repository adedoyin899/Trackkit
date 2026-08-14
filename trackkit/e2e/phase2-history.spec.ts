import { test, expect } from "@playwright/test";
import {
  waitForAppReady,
  gotoTab,
  addProductViaInventoryTab,
  mockAuthSession,
} from "./helpers";

test.describe("Phase 2: Purchase History & Supplier Intelligence", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("T1 — can add a product and open the restock modal", async ({ page }) => {
    // Add a product
    await addProductViaInventoryTab(page, {
      name: "MILK",
      unit: "Tin",
      quantity: 10,
      cost: 800,
      price: 810,
    });

    // The +1 button should now open the RestockModal
    await page.getByRole("button", { name: "Restock MILK", exact: false }).first().click();
    await expect(page.getByText("Restock MILK", { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Lagos Dairy, Kano Wholesale")).toBeVisible();
  });

  test("T2 — quick-log restock works without entering details", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "SUGAR",
      unit: "Bag",
      quantity: 5,
      cost: 50,
      price: 75,
    });

    const initialQtyText = "5";
    await expect(page.getByText(initialQtyText).first()).toBeVisible();

    // Open modal and quick-log
    await page.getByRole("button", { name: "Restock SUGAR", exact: false }).first().click();
    await page.getByRole("button", { name: "Quick +1 (skip details)", exact: false }).click();

    // Qty should now be 6
    await expect(page.getByText("6").first()).toBeVisible({ timeout: 5_000 });
  });

  test("T3 — restock with supplier and cost shows in purchase history", async ({
    page,
  }) => {
    // Add product
    await addProductViaInventoryTab(page, {
      name: "DAIRY MILK",
      unit: "Tin",
      quantity: 10,
      cost: 800,
      price: 850,
    });

    // Restock with Lagos Dairy @ ₦800 × 20 units
    await page.getByRole("button", { name: "Restock DAIRY MILK", exact: false }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("e.g. Lagos Dairy, Kano Wholesale").fill("Lagos Dairy");
    const dialogNumberFields = dialog.locator('input[type="number"]');
    await dialogNumberFields.first().fill("20");
    await dialogNumberFields.nth(1).fill("800");
    await dialog.getByRole("button", { name: /Restock \+20/i }).click();

    // Navigate to History tab
    await gotoTab(page, "History");

    // Should show the restock entry — scoped to <p> to avoid also matching
    // the "DAIRY MILK (Tin)" <option> in the product filter <select> above.
    await expect(page.locator("p", { hasText: "DAIRY MILK" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("Lagos Dairy", { exact: false })).toBeVisible();
  });

  test("T4 — supplier filter shows only matching supplier", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "FRESH MILK",
      unit: "Tin",
      quantity: 5,
      cost: 800,
      price: 810,
    });

    // Log two restocks: one from Lagos Dairy, one from Kano
    // Lagos Dairy restock
    await page.getByRole("button", { name: "Restock FRESH MILK", exact: false }).first().click();
    await page.fill('input[placeholder="e.g. Lagos Dairy, Kano Wholesale"]', "Lagos Dairy");
    await page.getByRole("button", { name: /Quick \+1/i }).click();

    // Kano restock
    await page.getByRole("button", { name: "Restock FRESH MILK", exact: false }).first().click();
    await page.fill('input[placeholder="e.g. Lagos Dairy, Kano Wholesale"]', "Kano Wholesale");
    await page.getByRole("button", { name: /Quick \+1/i }).click();

    // Go to History tab and filter by "Kano"
    await gotoTab(page, "History");
    await page.fill('input[placeholder="Filter by supplier name"]', "Kano");
    await page.getByRole("button", { name: "Apply Filters", exact: false }).click();

    // Only Kano should show
    await expect(page.getByText("Kano Wholesale", { exact: false })).toBeVisible();
  });

  test("T5 — supplier comparison highlights cheapest and shows savings", async ({
    page,
  }) => {
    await addProductViaInventoryTab(page, {
      name: "WHOLE MILK",
      unit: "Tin",
      quantity: 20,
      cost: 800,
      price: 900,
    });

    // Log Lagos Dairy @ ₦800
    await page.getByRole("button", { name: "Restock WHOLE MILK", exact: false }).first().click();
    const dialog1 = page.getByRole("dialog");
    await dialog1.getByPlaceholder("e.g. Lagos Dairy, Kano Wholesale").fill("Lagos Dairy");
    const qtyFields = dialog1.locator('input[type="number"]');
    await qtyFields.first().fill("10");
    await qtyFields.nth(1).fill("800");
    await dialog1.getByRole("button", { name: /Restock \+10/i }).click();

    // Log Kano @ ₦790
    await page.getByRole("button", { name: "Restock WHOLE MILK", exact: false }).first().click();
    const dialog2 = page.getByRole("dialog");
    await dialog2.getByPlaceholder("e.g. Lagos Dairy, Kano Wholesale").fill("Kano Wholesale");
    const qtyFields2 = dialog2.locator('input[type="number"]');
    await qtyFields2.first().fill("15");
    await qtyFields2.nth(1).fill("790");
    await dialog2.getByRole("button", { name: /Restock \+15/i }).click();

    // Go to History, select WHOLE MILK product, switch to Suppliers view
    await gotoTab(page, "History");
    await page.selectOption("select", { label: "WHOLE MILK (Tin)" });
    await page.getByRole("button", { name: "Apply Filters", exact: false }).click();
    await page.getByRole("button", { name: "Suppliers", exact: false }).click();

    // Kano should be marked cheapest — exact match to avoid also matching
    // the "💡 Cheapest for WHOLE MILK:" summary sentence elsewhere on the page.
    await expect(page.getByText("CHEAPEST", { exact: true })).toBeVisible({
      timeout: 5_000,
    });
    // Exact match to avoid also matching the "💡 Cheapest for WHOLE MILK:
    // Kano Wholesale" summary sentence elsewhere on the page.
    await expect(page.getByText("Kano Wholesale", { exact: true })).toBeVisible();

    // Lagos should show "more expensive" notice
    await expect(page.getByText(/more expensive/i)).toBeVisible();
  });

  test("T6 — summary stats calculate correctly", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "NOODLES",
      unit: "Carton",
      quantity: 10,
      cost: 80,
      price: 120,
    });

    // Log 3 × 10 units @ ₦80
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Restock NOODLES", exact: false }).first().click();
      const dialog = page.getByRole("dialog");
      const qtyF = dialog.locator('input[type="number"]');
      await qtyF.first().fill("10");
      await qtyF.nth(1).fill("80");
      await dialog.getByRole("button", { name: /Restock \+10/i }).click();
      await page.waitForTimeout(200);
    }

    await gotoTab(page, "History");
    await page.selectOption("select", { label: "NOODLES (Carton)" });
    await page.getByRole("button", { name: "Apply Filters", exact: false }).click();

    // Total spent = 3 × 10 × 80 = ₦2,400
    await expect(page.getByText(/2,400/)).toBeVisible({ timeout: 5_000 });
    // Total units = 30
    await expect(page.getByText("30")).toBeVisible();
  });
});
