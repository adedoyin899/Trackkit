import { test, expect } from "@playwright/test";
import { addProductViaInventoryTab, gotoTab, waitForAppReady } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);
});

test.describe("Add Product (User Story 1)", () => {
  test("adds a product with all fields and it appears in the inventory list", async ({ page }) => {
    await addProductViaInventoryTab(page, {
      name: "Noodles",
      category: "FMCG",
      quantity: 7,
      unit: "Carton",
      threshold: 5,
      price: 120,
    });

    await expect(page.getByText("NOODLES", { exact: false })).toBeVisible();
    await expect(page.getByText("(Carton)")).toBeVisible();
    await expect(page.getByText("7", { exact: true }).first()).toBeVisible();
  });

  test("requires a product name — rejects an empty name and does not create a product", async ({
    page,
  }) => {
    await gotoTab(page, "Inventory");
    await page.getByRole("button", { name: "Add Product", exact: false }).first().click();

    // Leave name blank, only fill quantity, try to save.
    await page.locator('input[type="number"]').nth(0).fill("3");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Name and unit are required.")).toBeVisible();
    // Modal stays open — form wasn't submitted.
    await expect(page.getByRole("heading", { name: "Add Product" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByText("No products yet.")).toBeVisible();
  });

  test("unit is always populated via the dropdown, so it can't be submitted empty through the UI", async ({
    page,
  }) => {
    // Documents a real constraint rather than asserting something the UI
    // can't actually produce: Unit is a <select> defaulting to "Carton",
    // never an empty string, so PHASE-1-MVP.md's "unit required" validation
    // path isn't reachable through this form as built. The name-required
    // path (tested above) exercises the same validation branch instead.
    await gotoTab(page, "Inventory");
    await page.getByRole("button", { name: "Add Product", exact: false }).first().click();
    const unitSelect = page.locator("select").nth(1);
    await expect(unitSelect).toHaveValue("Carton");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("product persists after reload", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Sugar", quantity: 12, unit: "Bag" });

    await page.reload();
    await waitForAppReady(page);
    await gotoTab(page, "Inventory");

    await expect(page.getByText("SUGAR", { exact: false })).toBeVisible();
  });
});
