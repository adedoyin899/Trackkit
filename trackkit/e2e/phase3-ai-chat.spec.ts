import { test, expect } from "@playwright/test";
import { waitForAppReady, gotoTab, mockAuthSession } from "./helpers";

// The Anthropic call itself happens server-side inside app/api/ai/chat's
// route handler, invisible to Playwright's browser-level network
// interception — there's no way to mock it from here without a real
// ANTHROPIC_API_KEY. These tests instead mock the client-facing
// /api/ai/chat endpoint directly (same approach the rest of this suite
// uses for other server-dependent routes), covering the actual
// AIChat.tsx / useAIChat.ts code paths: optimistic UI, loading state,
// success/error rendering, persistence, and the auth gate. The "no
// ANTHROPIC_API_KEY configured" fallback and the real Claude round-trip
// were verified manually against the live route — see hand off/bug.md.

test.describe("Phase 3: AI Assistant", () => {
  test("unauthenticated users see a sign-in prompt instead of the chat", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await expect(page.getByText("Sign in to ask questions about your sales")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask something…" })).not.toBeVisible();
  });

  test("signed-in users see the empty state with suggested prompts", async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await expect(page.getByText("Hi! Ask me about your sales, margins, or reorder strategy.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Which products need restocking?" })).toBeVisible();
  });

  test("sending a message shows it optimistically, then the AI response", async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.route("**/api/ai/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          response: "You sold 24 tins of milk this week (3.4/day avg).",
          confidence: 0.9,
          cached: false,
        }),
      });
    });

    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await page.fill('input[placeholder="Ask something…"]', "How much milk sold this week?");
    await page.click('button[aria-label="Send message"]');

    // User message appears immediately (optimistic), before the response lands.
    await expect(page.getByText("How much milk sold this week?")).toBeVisible();
    await expect(page.getByText("You sold 24 tins of milk this week (3.4/day avg).")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("clicking a suggested prompt sends it directly", async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.route("**/api/ai/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ response: "Sugar is running low — reorder by Friday.", confidence: 0.9, cached: false }),
      });
    });

    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await page.getByRole("button", { name: "Which products need restocking?" }).click();
    await expect(page.getByText("Sugar is running low — reorder by Friday.")).toBeVisible({ timeout: 5_000 });
  });

  test("API errors show a message without crashing the chat", async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.route("**/api/ai/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ response: "Sorry, AI service unavailable. Try again.", confidence: 0, cached: false }),
      });
    });

    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await page.fill('input[placeholder="Ask something…"]', "How much milk sold?");
    await page.click('button[aria-label="Send message"]');

    await expect(page.getByText("Sorry, AI service unavailable. Try again.")).toBeVisible({ timeout: 5_000 });
    // The user's own message survives the error — chat history isn't wiped.
    await expect(page.getByText("How much milk sold?")).toBeVisible();
  });

  test("chat history persists across a reload, and Clear removes it", async ({ page, context }) => {
    await mockAuthSession(page, context);
    await page.route("**/api/ai/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ response: "Your average margin is 22%.", confidence: 0.9, cached: false }),
      });
    });

    await page.goto("/");
    await waitForAppReady(page);
    await gotoTab(page, "AI");

    await page.fill('input[placeholder="Ask something…"]', "How's my profit margin?");
    await page.click('button[aria-label="Send message"]');
    await expect(page.getByText("Your average margin is 22%.")).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await waitForAppReady(page);
    await gotoTab(page, "AI");
    await expect(page.getByText("Your average margin is 22%.")).toBeVisible();

    await page.getByRole("button", { name: "Clear chat history" }).click();
    await expect(page.getByText("Your average margin is 22%.")).not.toBeVisible();
    await expect(page.getByText("Hi! Ask me about your sales, margins, or reorder strategy.")).toBeVisible();
  });
});
