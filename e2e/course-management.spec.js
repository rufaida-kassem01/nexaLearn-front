import { test, expect } from "@playwright/test";

const API = "/api";
const EDU_EMAIL = "educator@test.com";
const EDU_PW = "Test1234!";

const unwrap = (resp) => resp.json().then((j) => j.data ?? j);

test.describe("Course Management API", () => {
  let accessToken;
  let refreshToken;
  let courseId;
  let moduleId;
  let lessonId;
  const suffix = Date.now();
  const courseTitle = `E2E Course ${suffix}`;

  test.describe.configure({ mode: "serial" });

  test("Login as educator", async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.accessToken).toBeTruthy();
    expect(body.user.roles).toContain("INSTRUCTOR");
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test("Create course", async ({ request }) => {
    const resp = await request.post(`${API}/courses`, {
      data: {
        instructorId: "1",
        title: courseTitle,
        subtitle: "E2E test subtitle",
        description: "E2E test course description",
        language: "en",
        level: "BEGINNER",
        isFree: true,
        basePrice: 0,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.id).toBeTruthy();
    expect(body.title).toBe(courseTitle);
    expect(body.status).toBe("DRAFT");
    courseId = body.id;
  });

  test("Add module to course", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/modules`, {
      data: { title: "Chapter 1", orderIndex: 1 },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.id).toBeTruthy();
    expect(body.title).toBe("Chapter 1");
    moduleId = body.id;
  });

  test("Add lesson to module", async ({ request }) => {
    const resp = await request.post(
      `${API}/courses/${courseId}/modules/${moduleId}/lessons`,
      {
        data: {
          title: "Lesson 1",
          contentType: "VIDEO",
          contentUrl: "https://example.com/video.mp4",
          durationSecs: 600,
          orderIndex: 1,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.id).toBeTruthy();
    expect(body.title).toBe("Lesson 1");
    lessonId = body.id;
  });

  test("Get course details includes module and lesson", async ({
    request,
  }) => {
    const resp = await request.get(`${API}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.title).toBe(courseTitle);
    expect(body.modules).toBeDefined();
    expect(body.modules.length).toBeGreaterThanOrEqual(1);
    const mod = body.modules.find((m) => m.id === moduleId);
    expect(mod).toBeTruthy();
    expect(mod.lessons.length).toBeGreaterThanOrEqual(1);
    expect(mod.lessons[0].title).toBe("Lesson 1");
  });

  test("Update course title", async ({ request }) => {
    const updatedTitle = `${courseTitle} (edited)`;
    const resp = await request.patch(`${API}/courses/${courseId}`, {
      data: { title: updatedTitle },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.title).toBe(updatedTitle);
  });

  test("Publish course", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.status).toBe("PUBLISHED");
  });

  test("Delete course", async ({ request }) => {
    const resp = await request.delete(`${API}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(204);

    const getResp = await request.get(`${API}/courses/${courseId}`);
    if (getResp.status() === 200) {
      const body = await unwrap(getResp);
      expect(body.isDeleted ?? body.is_deleted).toBeTruthy();
    }
  });
});

test.describe("Course Management UI", () => {
  test("Login as educator redirects to educator dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', EDU_EMAIL);
    await page.fill('input[name="password"]', EDU_PW);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/educator/, { timeout: 15000 });
  });

  test("Create course via Add Course form", async ({ page }) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const title = `UI Course ${suffix}`;

    await page.goto("/educator/add-course");

    await page.getByPlaceholder("Type here").fill(title);
    await page.getByPlaceholder("A short subtitle").fill("UI test subtitle");
    await page.getByPlaceholder("en").fill("en");

    await page.locator("#isFree").check();

    let addChapterBtn = page.getByText("+ Add Chapter");
    await expect(addChapterBtn).toBeVisible({ timeout: 5000 });

    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("prompt");
      dialog.accept("Chapter 1");
    });
    await addChapterBtn.click();

    await page.waitForTimeout(300);

    const addLectureBtn = page.getByText("+ Add Lecture");
    await expect(addLectureBtn).toBeVisible({ timeout: 5000 });
    await addLectureBtn.click();

    const popup = page.locator(".fixed.inset-0");
    await expect(popup).toBeVisible({ timeout: 3000 });

    await popup.locator('input[type="text"]').first().fill("Lesson 1");
    await popup.locator('input[type="number"]').fill("10");

    await popup.locator('button').filter({ hasText: "Add" }).click();

    await page.waitForTimeout(500);

    const submitBtn = page.getByRole("button", { name: "ADD" });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    await expect(page).toHaveURL(/\/educator\/my-courses/, { timeout: 15000 });
    await expect(page.locator("text=Course created!")).toBeVisible({
      timeout: 5000,
    });
  });
});
