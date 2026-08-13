import { expect, type Page } from "@playwright/test";

/** Waits for the app shell to finish booting (SQLite/IndexedDB init). */
export async function waitForAppReady(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading your local inventory"),
    { timeout: 15_000 },
  );
}

export async function gotoTab(page: Page, tab: "Dashboard" | "Inventory" | "Settings") {
  await page.getByRole("button", { name: tab, exact: true }).click();
}

export interface ProductInput {
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  threshold?: number;
  price?: number;
}

/** Opens the given "+ Add Product" trigger, fills the form, and saves. Assumes the form is already open. */
export async function fillProductForm(page: Page, product: ProductInput) {
  await page.fill('input[placeholder="e.g. Noodles"]', product.name);
  if (product.category) {
    await page.selectOption("select >> nth=0", product.category);
  }
  await page.locator('input[type="number"]').nth(0).fill(String(product.quantity));
  if (product.unit) {
    await page.selectOption("select >> nth=1", product.unit);
  }
  if (product.threshold != null) {
    await page.locator('input[type="number"]').nth(1).fill(String(product.threshold));
  }
  if (product.price != null) {
    await page.locator('input[type="number"]').nth(2).fill(String(product.price));
  }
}

/** Full flow: Inventory tab → "+ Add Product" → fill → Save → wait for the card. */
export async function addProductViaInventoryTab(page: Page, product: ProductInput) {
  await gotoTab(page, "Inventory");
  await page.getByRole("button", { name: "Add Product", exact: false }).first().click();
  await fillProductForm(page, product);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(product.name.toUpperCase(), { exact: false })).toBeVisible({
    timeout: 5_000,
  });
}
