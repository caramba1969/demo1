import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Run locally:   npx playwright test
 * Run headed:    npx playwright test --headed
 * UI mode:       npx playwright test --ui
 *
 * The base URL defaults to http://localhost:3000.
 * Set PLAYWRIGHT_BASE_URL env var to override (e.g. staging URL in CI).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment when wider browser coverage is needed:
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit",  use: { ...devices["Desktop Safari"] } },
    // { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],

  // Start the dev server automatically when running tests locally.
  // In CI the app is started separately before Playwright runs.
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
