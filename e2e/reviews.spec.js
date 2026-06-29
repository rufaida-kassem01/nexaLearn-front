import { test, expect } from "@playwright/test";

const API = "/api";
const EDU_EMAIL = "educator@test.com";
const EDU_PW = "Test1234!";

const unwrap = (resp) => resp.json().then((j) => j.data ?? j);

test.describe("Reviews API", () => {
  let eduToken, stuToken, courseId;
  let reviewId;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  test("Setup: login as educator", async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    expect(resp.status()).toBe(200);
    eduToken = (await unwrap(resp)).accessToken;
  });

  test("Setup: create a published free course", async ({ request }) => {
    const c = await request.post(`${API}/courses`, {
      data: {
        instructorId: "1",
        title: `Review E2E ${ts}`,
        subtitle: "Reviews test",
        description: "E2E desc",
        language: "en",
        level: "BEGINNER",
        isFree: true,
        basePrice: 0,
      },
      headers: { Authorization: `Bearer ${eduToken}` },
    });
    expect(c.status()).toBe(201);
    courseId = (await unwrap(c)).id;

    const m = await request.post(`${API}/courses/${courseId}/modules`, {
      data: { title: "Ch1", orderIndex: 1 },
      headers: { Authorization: `Bearer ${eduToken}` },
    });
    expect(m.status()).toBe(201);
    const moduleId = (await unwrap(m)).id;

    await request.post(`${API}/courses/${courseId}/modules/${moduleId}/lessons`, {
      data: {
        title: "L1",
        contentType: "VIDEO",
        contentUrl: "https://example.com/vid.mp4",
        durationSecs: 300,
        orderIndex: 1,
      },
      headers: { Authorization: `Bearer ${eduToken}` },
    });

    const pub = await request.post(`${API}/courses/${courseId}/publish`, {
      headers: { Authorization: `Bearer ${eduToken}` },
    });
    expect(pub.status()).toBe(200);
    expect((await unwrap(pub)).status).toBe("PUBLISHED");
  });

  test("Setup: signup and enroll a student", async ({ request }) => {
    const uniq = `rev_stu_${ts}`;
    const resp = await request.post(`${API}/auth/signup`, {
      data: {
        username: uniq,
        email: `${uniq}@test.com`,
        password: "StuPass123!",
        firstName: "Rev",
        lastName: "Student",
      },
    });
    expect(resp.status()).toBe(201);
    stuToken = (await unwrap(resp)).accessToken;

    const enroll = await request.post(
      `${API}/courses/${courseId}/enroll`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );

    if (enroll.status() !== 201) {
      const check = await request.get(
        `${API}/courses/${courseId}/enrollment`,
        { headers: { Authorization: `Bearer ${stuToken}` } }
      );
      const cb = await unwrap(check);
      expect(cb.enrolled).toBe(true);
    }
  });

  test("Create a review", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/reviews`, {
      data: { rating: 5, title: "Great course", body: "Loved it" },
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.rating).toBe(5);
    expect(body.title).toBe("Great course");
    expect(body.body).toBe("Loved it");
    expect(body.userId).toBeTruthy();
    expect(body.courseId).toBe(courseId);
    expect(body.status).toBe("PUBLISHED");
    reviewId = body.id;
  });

  test("Get course reviews includes the created review", async ({ request }) => {
    const resp = await request.get(`${API}/courses/${courseId}/reviews`);
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.items).toBeDefined();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items.some((r) => r.id === reviewId)).toBeTruthy();
  });

  test("Update a review", async ({ request }) => {
    const resp = await request.patch(`${API}/reviews/${reviewId}`, {
      data: { rating: 4, body: "Updated review body" },
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.rating).toBe(4);
    expect(body.body).toBe("Updated review body");
    expect(body.editedAt).toBeTruthy();
  });

  test("Flag a review", async ({ request }) => {
    const resp = await request.post(`${API}/reviews/${reviewId}/flags`, {
      data: { reason: "USER_REPORTED" },
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.id).toBe(reviewId);
  });

  test("Delete a review", async ({ request }) => {
    const resp = await request.delete(`${API}/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(204);

    const getResp = await request.get(`${API}/courses/${courseId}/reviews`);
    const body = await unwrap(getResp);
    expect(body.items.some((r) => r.id === reviewId)).toBeFalsy();
  });

  test("Rejects a review with out-of-range rating", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/reviews`, {
      data: { rating: 6 },
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(400);
  });

  test("Rejects an unauthenticated review creation", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/reviews`, {
      data: { rating: 3 },
    });
    expect(resp.status()).toBe(401);
  });
});

test.describe("Reviews UI", () => {
  let seedCourseTitle, seedCourseId, seedStudentToken;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  test("Setup: seed course + student via API", async ({ request }) => {
    const edResp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    const t = (await unwrap(edResp)).accessToken;
    seedCourseTitle = `UI Review Course ${ts}`;

    const c = await unwrap(
      await request.post(`${API}/courses`, {
        data: {
          instructorId: "1",
          title: seedCourseTitle,
          isFree: true,
          basePrice: 0,
          language: "en",
        },
        headers: { Authorization: `Bearer ${t}` },
      })
    );
    seedCourseId = c.id;

    const m = await unwrap(
      await request.post(`${API}/courses/${seedCourseId}/modules`, {
        data: { title: "M1", orderIndex: 1 },
        headers: { Authorization: `Bearer ${t}` },
      })
    );

    await request.post(
      `${API}/courses/${seedCourseId}/modules/${m.id}/lessons`,
      {
        data: { title: "L1", contentType: "VIDEO", orderIndex: 1 },
        headers: { Authorization: `Bearer ${t}` },
      }
    );

    await request.post(`${API}/courses/${seedCourseId}/publish`, {
      headers: { Authorization: `Bearer ${t}` },
    });

    const su = await unwrap(
      await request.post(`${API}/auth/signup`, {
        data: {
          username: `uirev_${ts}`,
          email: `uirev_${ts}@test.com`,
          password: "UiPass123!",
          firstName: "UI",
          lastName: "RevStudent",
        },
      })
    );
    seedStudentToken = su.accessToken;

    await request.post(`${API}/courses/${seedCourseId}/enroll`, {
      headers: { Authorization: `Bearer ${seedStudentToken}` },
    });
  });

  test("Course detail page shows Reviews section", async ({ page }) => {
    await page.goto(`/course/${seedCourseId}`);
    await expect(
      page.locator("text=Reviews").first()
    ).toBeVisible({ timeout: 10000 });
  });
});
