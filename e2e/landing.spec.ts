import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for the landing page (unauthenticated state).
 *
 * These tests intentionally do NOT sign in — they verify the public-facing
 * experience that any unauthenticated visitor sees.
 */
test.describe("Landing page (unauthenticated)", () => {
  test("shows the hero headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Plan your/i)).toBeVisible();
  });

  test("shows Create free account CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Create free account/i })).toBeVisible();
  });

  test("navigates to sign-up page from CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Create free account/i }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("navigates to sign-in page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(page).toHaveURL(/\/auth\/sign/);
  });

  test("sign-in page renders email and password fields", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByPlaceholder(/Email address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/^Password/i)).toBeVisible();
  });

  test("sign-up page renders registration form", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByPlaceholder(/Email address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Password \(min/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Confirm password/i)).toBeVisible();
  });

  test("protected route /graph redirects unauthenticated users", async ({ page }) => {
    await page.goto("/graph");
    // Middleware redirects to /auth/signin
    await expect(page).toHaveURL(/\/auth\/sign/);
  });
});
