import { test, expect } from "@playwright/test";
import { mockAuthSession } from "./helpers";

test.describe("Phase 2 Authentication Flow", () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear cookies before each test run
    await context.clearCookies();
    // Mock the session refresh API dynamically: return 200 if authenticated cookie exists, 401 otherwise
    await page.route("**/api/auth/refresh", async (route) => {
      const cookies = await context.cookies();
      const hasToken = cookies.some((c) => c.name === "token" && c.value === "mock-jwt-token");
      if (hasToken) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "mock-jwt-token",
            expiresIn: 3600,
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Session expired" }),
        });
      }
    });
  });

  test("should let unauthenticated users use the app without redirecting to login", async ({ page }) => {
    // Auth is opt-in (see app/page.tsx) — Trackkit is offline-first and every
    // tab works from local SQLite with no session at all. Signing in only
    // unlocks cloud sync; it must never be required just to open the app.
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("heading", { name: "Trackkit" })).toBeVisible();
  });

  test("should validate invalid phone numbers", async ({ page }) => {
    // Mock the OTP request API failure
    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Invalid phone number format",
          code: "INVALID_PHONE",
        }),
      });
    });

    await page.goto("/auth/login");
    await page.waitForFunction(() => navigator.serviceWorker.controller);

    await page.fill('input[type="tel"]', "123456");
    await page.click('button:has-text("Request OTP Code")');

    await expect(page.locator("text=Invalid phone number format")).toBeVisible();
  });

  test("should handle OTP request, failures, and successful verification redirect", async ({ page }) => {
    let requestOtpCalled = false;
    let verifyOtpCalled = false;

    // Intercept OTP request
    await page.route("**/api/auth/request-otp", async (route) => {
      requestOtpCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "OTP sent to +2348031234567",
          expiresIn: 600,
        }),
      });
    });

    // Intercept OTP verification
    await page.route("**/api/auth/verify-otp", async (route) => {
      verifyOtpCalled = true;
      const body = JSON.parse(route.request().postData() || "{}");
      if (body.otp === "000000") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Invalid or expired OTP",
            code: "INVALID_OTP",
            attemptsRemaining: 2,
          }),
        });
      } else if (body.otp === "123456") {
        await route.fulfill({
          status: 200,
          headers: {
            "Set-Cookie": "token=mock-jwt-token; Path=/; SameSite=Lax; Max-Age=3600",
          },
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            token: "mock-jwt-token",
            refreshToken: "mock-refresh-token",
            expiresIn: 3600,
            user: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              phoneNumber: "+2348031234567",
              shopName: null,
              createdAt: "2026-08-11T10:00:00Z",
            },
          }),
        });
      }
    });

    await page.goto("/auth/login");
    await page.waitForFunction(() => navigator.serviceWorker.controller);

    await page.fill('input[type="tel"]', "+2348031234567");
    await page.click('button:has-text("Request OTP Code")');

    expect(requestOtpCalled).toBe(true);
    await expect(page.locator("text=OTP code sent to +2348031234567")).toBeVisible();

    // Verify error code OTP
    await page.fill('input[placeholder="000000"]', "000000");
    await page.click('button:has-text("Verify Code")');
    await expect(page.locator("text=2 attempts remaining")).toBeVisible();

    // Verify correct OTP
    await page.fill('input[placeholder="000000"]', "123456");
    await page.click('button:has-text("Verify Code")');

    // Should lead to protected root dashboard
    await expect(page).toHaveURL("http://localhost:3000/");
    expect(verifyOtpCalled).toBe(true);
  });

  test("should logout successfully and stay on the app (auth is opt-in, not required)", async ({ page, context }) => {
    await mockAuthSession(page, context);

    await page.route("**/api/auth/logout", async (route) => {
      await route.fulfill({
        status: 204,
        headers: {
          "Set-Cookie": "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
      });
    });

    await page.goto("/");

    // Switch to Settings tab
    await page.click('button:has-text("Settings")');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Logging out clears the session but never navigates away — the app
    // stays usable offline-first. Settings now offers to sign back in.
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByText("Sign in to cloud backup")).toBeVisible();
  });
});
