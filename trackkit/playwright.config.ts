import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Safe to parallelize: each test gets its own isolated browser context
  // (fresh IndexedDB/localStorage) by default, and the app's "database" is
  // entirely client-side — the shared webServer itself is stateless.
  // Capped on CI only, for the runner's resource limits, not correctness.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build, not `next dev` — the service worker's caching
    // behavior (Prompt 3) needs a real production server to test reliably;
    // Turbopack dev's HMR interferes with it.
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
