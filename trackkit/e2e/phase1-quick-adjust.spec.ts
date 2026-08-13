import { test, expect } from "@playwright/test";
import { addProductViaInventoryTab, waitForAppReady, mockAuthSession } from "./helpers";

test.beforeEach(async ({ context, page }) => {
  await mockAuthSession(page, context);
  await page.goto("/");
  await waitForAppReady(page);
});

test.describe("Quick Stock Adjustment (User Story 2)", () => {
  test("tapping +1 increments quantity", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Tin" });

    await page.getByRole("button", { name: "Increase Milk by 1" }).click();
    await expect(page.getByText("6", { exact: true })).toBeVisible();
  });

  test("tapping -1 decrements quantity", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Tin" });

    await page.getByRole("button", { name: "Decrease Milk by 1" }).click();
    await expect(page.getByText("4", { exact: true })).toBeVisible();
  });

  test("quantity cannot go negative — the -1 button disables at 0", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 1, unit: "Tin" });

    const decreaseButton = page.getByRole("button", { name: "Decrease Milk by 1" });
    await decreaseButton.click();
    await expect(page.getByText("0", { exact: true })).toBeVisible();
    await expect(decreaseButton).toBeDisabled();

    // Clicking a disabled button is a no-op, but confirm the underlying
    // state genuinely can't go negative even if something did dispatch it.
    await decreaseButton.click({ force: true }).catch(() => {});
    await expect(page.getByText("0", { exact: true })).toBeVisible();
  });

  test("adjustments persist across a reload", async ({ page }) => {
    await addProductViaInventoryTab(page, { name: "Milk", quantity: 5, unit: "Tin" });
    await page.getByRole("button", { name: "Increase Milk by 1" }).click();
    await expect(page.getByText("6", { exact: true })).toBeVisible();

    await page.reload();
    await waitForAppReady(page);
    await page.getByRole("button", { name: "Inventory", exact: true }).click();

    await expect(page.getByText("6", { exact: true })).toBeVisible();
  });
});
