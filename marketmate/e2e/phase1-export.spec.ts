import { test, expect } from "@playwright/test";
import Papa from "papaparse";
import { readFileSync } from "node:fs";
import { addProductViaInventoryTab, gotoTab, waitForAppReady } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);
});

test.describe("CSV Export (User Story 5)", () => {
  test("clicking Export downloads a CSV containing all products and the transaction history", async ({
    page,
  }) => {
    await addProductViaInventoryTab(page, {
      name: "Noodles",
      category: "FMCG",
      quantity: 7,
      unit: "Carton",
      threshold: 5,
      price: 120,
    });
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 2, unit: "Tin", threshold: 3 });

    // Log a transaction so the export has something to include beyond the
    // product snapshot.
    await page.getByRole("button", { name: "Increase Noodles by 1" }).click();
    await expect(page.getByText("8", { exact: true })).toBeVisible();

    await gotoTab(page, "Settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Data to CSV" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^marketmate-export-\d{4}-\d{2}-\d{2}\.csv$/);

    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const csv = readFileSync(filePath as string, "utf8");

    // Preamble
    expect(csv).toContain("MarketMate Inventory Export");
    expect(csv).toMatch(/Exported: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

    // Product rows (all products present, not just the most recent)
    expect(csv).toContain("Noodles");
    expect(csv).toContain("FMCG");
    expect(csv).toContain("Milk");

    // Transaction history section, with the restock we just logged
    expect(csv).toContain("Transaction History");
    expect(csv).toContain("restock");

    // Format validity: the Products table section (between the preamble and
    // the Transaction History marker) parses cleanly as CSV with the
    // expected columns and no parse errors. This is a multi-section export
    // (preamble + products table + transactions table) rather than one flat
    // table, so validate each section rather than the whole file at once.
    const productsSection = csv.split("Transaction History")[0];
    const productsTableCsv = productsSection.split("\n\n").slice(1).join("\n\n").trim();
    const parsedProducts = Papa.parse(productsTableCsv, { header: true, skipEmptyLines: true });
    expect(parsedProducts.errors).toEqual([]);
    expect(parsedProducts.meta.fields).toEqual(
      expect.arrayContaining([
        "Product Name",
        "Category",
        "Current Qty",
        "Unit",
        "Selling Price",
        "Low-Stock Threshold",
      ]),
    );
    expect(parsedProducts.data.length).toBe(2);

    const transactionsTableCsv = csv.split("Transaction History\n")[1].trim();
    const parsedTransactions = Papa.parse(transactionsTableCsv, {
      header: true,
      skipEmptyLines: true,
    });
    expect(parsedTransactions.errors).toEqual([]);
    expect(parsedTransactions.meta.fields).toEqual(
      expect.arrayContaining(["Date", "Product Name", "Type", "Quantity", "Notes"]),
    );
    expect(parsedTransactions.data.length).toBeGreaterThanOrEqual(1);
  });

  test("export works with zero products (no crash, still downloads a valid preamble)", async ({
    page,
  }) => {
    await gotoTab(page, "Settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Data to CSV" }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const csv = readFileSync(filePath as string, "utf8");
    expect(csv).toContain("MarketMate Inventory Export");
  });

  test("shop name (if set) appears in the export", async ({ page }) => {
    await gotoTab(page, "Settings");
    await page.fill('input[placeholder="e.g. Mama Ngozi Stores"]', "Mama Ngozi Stores");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Data to CSV" }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const csv = readFileSync(filePath as string, "utf8");
    expect(csv).toContain("Shop Name: Mama Ngozi Stores");
  });
});
