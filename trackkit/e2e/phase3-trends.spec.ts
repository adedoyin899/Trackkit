import { test, expect } from "@playwright/test";
import { waitForAppReady, gotoTab, addProductViaInventoryTab } from "./helpers";

test.describe("Phase 3: Sales Trends", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("Trends tab works without signing in (pure local computation)", async ({ page }) => {
    await gotoTab(page, "Trends");
    await expect(page.getByRole("heading", { name: "Sales Trends" })).toBeVisible();
    await expect(page.getByText("No sales recorded in this period yet.")).toBeVisible();
  });

  test("logging sales shows up in the chart and summary stats", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 50, unit: "Carton", cost: 700, price: 800 });

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
      await page.waitForTimeout(150);
    }

    await gotoTab(page, "Trends");

    await expect(page.getByText("No sales recorded in this period yet.")).not.toBeVisible();
    // Revenue: 4 * 800 = 3,200
    await expect(page.getByText("₦3,200")).toBeVisible();
    // Profit: 4 * (800-700) = 400
    await expect(page.getByText("₦400")).toBeVisible();
  });

  test("product selector filters the chart to one product", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 50, unit: "Carton", cost: 700, price: 800 });
    await addProductViaInventoryTab(page, { name: "Sugar", quantity: 30, unit: "Bag", cost: 50, price: 75 });

    await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
    await page.waitForTimeout(150);

    await gotoTab(page, "Trends");
    await page.selectOption("select", { label: "MILK (Carton)" });

    await expect(page.getByRole("heading", { name: "MILK", exact: false })).toBeVisible();
  });

  test("period and metric toggles switch correctly", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 50, unit: "Carton", cost: 700, price: 800 });
    await page.getByRole("button", { name: "Decrease Milk by 1" }).click();

    await gotoTab(page, "Trends");

    await page.getByRole("button", { name: "1 Month" }).click();
    await expect(page.getByRole("button", { name: "1 Month" })).toHaveClass(/bg-ink-black/);

    await page.getByRole("button", { name: "Revenue", exact: true }).click();
    await expect(page.getByRole("button", { name: "Revenue", exact: true })).toHaveClass(/bg-ink-black/);
  });
});
