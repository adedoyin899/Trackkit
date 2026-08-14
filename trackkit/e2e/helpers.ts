import { expect, type Page } from "@playwright/test";

/** Waits for the app shell to finish booting (SQLite/IndexedDB init). */
export async function waitForAppReady(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading your local inventory"),
    { timeout: 15_000 },
  );
}

export async function gotoTab(page: Page, tab: "Dashboard" | "Inventory" | "Margins" | "History" | "AI" | "Settings") {
  await page.getByRole("button", { name: tab, exact: true }).click();
}

export interface ProductInput {
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  threshold?: number;
  price?: number;
  cost?: number;
}

/** Opens the given "+ Add Product" trigger, fills the form, and saves. Assumes the form is already open. */
export async function fillProductForm(page: Page, product: ProductInput) {
  await page.fill('input[placeholder="e.g. Noodles"]', product.name);
  if (product.category) {
    await page.selectOption("select >> nth=0", product.category);
  }
  
  // Use label-based selectors to find inputs robustly
  await page.locator('div:has(> label:has-text("Current Qty")) >> input[type="number"]').fill(String(product.quantity));
  
  if (product.unit) {
    await page.selectOption("select >> nth=1", product.unit);
  }
  if (product.threshold != null) {
    await page.locator('div:has(> label:has-text("Low-Stock Alert")) >> input[type="number"]').fill(String(product.threshold));
  }
  if (product.cost != null) {
    await page.locator('div:has(> label:has-text("Cost per Unit")) >> input[type="number"]').fill(String(product.cost));
  }
  if (product.price != null) {
    await page.locator('div:has(> label:has-text("Selling Price")) >> input[type="number"]').fill(String(product.price));
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

import type { BrowserContext } from "@playwright/test";

/** Pre-seeds local storage with user session and sets auth token cookie to bypass redirects. */
export async function mockAuthSession(page: Page, context: BrowserContext) {
  // Intercept refresh call to return success so it doesn't wipe our mock session
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "mock-jwt-token",
        expiresIn: 3600,
      }),
    });
  });

  // Navigate to login page first to establish the localhost origin
  await page.goto("/auth/login");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "trackkit-store",
      JSON.stringify({
        state: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            phoneNumber: "+2348031234567",
            shopName: null,
            createdAt: "2026-08-11T10:00:00Z",
          },
          currentTab: "inventory",
        },
        version: 0,
      })
    );
  });
  await context.addCookies([
    {
      name: "token",
      value: "mock-jwt-token",
      domain: "localhost",
      path: "/",
    },
  ]);
}
