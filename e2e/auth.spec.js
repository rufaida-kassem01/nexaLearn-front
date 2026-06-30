import { test, expect } from "@playwright/test";

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const TEST_USER = {
  email: "student@test.com",
  password: "Test1234!",
};

test.describe("Auth Flow", () => {
  test("register a new user and show success screen", async ({ page }) => {
    const email = `${unique()}@test.com`;

    await page.goto("/signup");
    await expect(page.locator("h1")).toHaveText("Create your account");

    await page.fill('input[name="firstName"]', "E2E");
    await page.fill('input[name="lastName"]', "Test");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "Test1234!");
    await page.fill('input[name="confirm"]', "Test1234!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Account created!")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("Welcome back");

    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("/", { timeout: 15000 });
    await expect(page.locator("text=NexaLearn").first()).toBeVisible();
  });

  test("show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@test.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(
      page.locator(".text-red-600, .text-red-500").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("token refresh failure redirects to login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Confirm refresh token was saved
    const hasToken = await page.evaluate(() =>
      !!localStorage.getItem("nexa_refresh_token"),
    );
    expect(hasToken).toBe(true);

    // Remove the refresh token to simulate an expired/stolen session
    await page.evaluate(() =>
      localStorage.removeItem("nexa_refresh_token"),
    );

    // Reload — the app will try to refresh and fail, then redirect to /login
    await page.reload();
    await page.waitForURL("/login", { timeout: 15000 });
  });

  test("logout clears session", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Click the user avatar to open the menu
    await page.locator(".w-9.h-9.rounded-full.bg-blue-600").click();
    // Click "Sign out" button
    await page.locator("button:has-text('Sign out')").click();

    // Should be redirected to /login
    await page.waitForURL("/login", { timeout: 15000 });
    await expect(page.locator("h1")).toHaveText("Welcome back");

    // Refresh token should be gone
    const hasToken = await page.evaluate(() =>
      localStorage.getItem("nexa_refresh_token"),
    );
    expect(hasToken).toBeNull();
  });
});
