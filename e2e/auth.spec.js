import { test, expect } from "@playwright/test";

const suffix = Date.now();
const TEST_USER = {
  username: `e2e_${suffix}`,
  email: `e2e_${suffix}@test.com`,
  password: "TestPass123!",
  firstName: "E2E",
  lastName: "Tester",
};
const API = "/api/auth";

const unwrap = (resp) => resp.json().then((j) => j.data ?? j);

test.describe("Auth API", () => {
  let accessToken;
  let refreshToken;

  test.describe.configure({ mode: "serial" });

  test("POST /auth/signup — registers a new user and returns tokens", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/signup`, {
      data: TEST_USER,
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user).toBeTruthy();
    expect(body.user.email).toBe(TEST_USER.email);
    expect(body.user.roles).toContain("STUDENT");
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test("POST /auth/login — accepts valid credentials and returns tokens", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.email).toBe(TEST_USER.email);
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test("POST /auth/login — rejects invalid credentials with 401", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/login`, {
      data: { email: TEST_USER.email, password: "WrongPass999!" },
    });
    expect(resp.status()).toBe(401);
  });

  test("POST /auth/refresh — exchanges refresh token for new token pair", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/refresh`, {
      data: { refreshToken },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.accessToken).not.toBe(accessToken);
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test("POST /auth/refresh — rejects invalid refresh token with 401", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/refresh`, {
      data: { refreshToken: "invalid_token_here" },
    });
    expect(resp.status()).toBe(401);
  });

  test("GET /auth/me — returns user profile with valid token", async ({
    request,
  }) => {
    const resp = await request.get(`${API}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.id).toBeTruthy();
    expect(body.email).toBe(TEST_USER.email);
    expect(body.roles).toContain("STUDENT");
  });

  test("GET /auth/me — rejects request without token", async ({ request }) => {
    const resp = await request.get(`${API}/me`);
    expect(resp.status()).toBe(401);
  });

  test("POST /auth/logout — revokes session and refresh token cannot be reused", async ({
    request,
  }) => {
    const resp = await request.post(`${API}/logout`, {
      data: { refreshToken },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);

    const reused = await request.post(`${API}/refresh`, {
      data: { refreshToken },
    });
    expect(reused.status()).toBe(401);
  });
});

test.describe("Auth UI", () => {
  test("Signup form — creates account and shows success screen", async ({
    page,
  }) => {
    const uniq = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await page.goto("/signup");
    await page.fill('input[name="firstName"]', "Alice");
    await page.fill('input[name="lastName"]', "Smith");
    await page.fill('input[name="email"]', `alice_${uniq}@test.com`);
    await page.fill('input[name="password"]', "StrongPass1!");
    await page.fill('input[name="confirm"]', "StrongPass1!");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Account created!")
    ).toBeVisible({ timeout: 15000 });
  });

  test("Login form — succeeds with valid credentials and redirects to home", async ({
    page,
  }) => {
    const uniq = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `login_${uniq}@test.com`;
    const pw = "LoginPass1!";

    const signupResp = await page.request().post(`${API}/signup`, {
      data: {
        username: `login_${uniq}`,
        email,
        password: pw,
        firstName: "Login",
        lastName: "Test",
      },
    });
    expect(signupResp.ok()).toBeTruthy();

    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 15000 });
  });

  test("Login form — shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "nonexistent@test.com");
    await page.fill('input[name="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Invalid email or password")
    ).toBeVisible({ timeout: 15000 });
  });

  test("Logout — clears session via navbar sign out", async ({
    page,
  }) => {
    const uniq = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `logout_${uniq}@test.com`;
    const pw = "LogoutPass1!";

    const signupResp = await page.request().post(`${API}/signup`, {
      data: {
        username: `logout_${uniq}`,
        email,
        password: pw,
        firstName: "Logout",
        lastName: "Test",
      },
    });
    expect(signupResp.ok()).toBeTruthy();

    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 15000 });

    await page.locator("button.rounded-full").last().click();

    await page.locator("text=Sign out").click();

    await expect(page.locator("text=Sign in")).toBeVisible({ timeout: 10000 });
  });
});
