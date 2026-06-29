import { test, expect } from "@playwright/test";

const API = "/api";
const EDU_EMAIL = "educator@test.com";
const EDU_PW = "Test1234!";

const unwrap = (resp) => resp.json().then((j) => j.data ?? j);

test.describe("Student Learning API", () => {
  let eduToken, courseId, lessonId;
  let questionId, correctOptionId;
  let stuToken, attemptId;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  /* ── Setup: educator creates a published course with a quiz ── */

  test("Setup: login as educator", async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    expect(resp.status()).toBe(200);
    eduToken = (await unwrap(resp)).accessToken;
  });

  test("Setup: create free published course with module + lesson", async ({
    request,
  }) => {
    const c = await request.post(`${API}/courses`, {
      data: {
        instructorId: "1",
        title: `Student E2E ${ts}`,
        subtitle: "Learning flow test",
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

    const l = await request.post(
      `${API}/courses/${courseId}/modules/${moduleId}/lessons`,
      {
        data: {
          title: "L1",
          contentType: "VIDEO",
          contentUrl: "https://example.com/vid.mp4",
          durationSecs: 300,
          orderIndex: 1,
        },
        headers: { Authorization: `Bearer ${eduToken}` },
      }
    );
    expect(l.status()).toBe(201);
    lessonId = (await unwrap(l)).id;

    const pub = await request.post(`${API}/courses/${courseId}/publish`, {
      headers: { Authorization: `Bearer ${eduToken}` },
    });
    expect(pub.status()).toBe(200);
    expect((await unwrap(pub)).status).toBe("PUBLISHED");
  });

  test("Setup: create and publish a quiz", async ({ request }) => {
    const q = await request.post(
      `${API}/courses/${courseId}/lessons/${lessonId}/quiz`,
      {
        data: { title: "Quiz 1", passingScore: 50 },
        headers: { Authorization: `Bearer ${eduToken}` },
      }
    );
    expect(q.status()).toBe(201);

    const aq = await request.post(
      `${API}/courses/${courseId}/lessons/${lessonId}/quiz/questions`,
      {
        data: {
          questionText: "What is 2+2?",
          type: "MULTIPLE_CHOICE",
          points: 1,
          orderIndex: 1,
          options: [
            { optionText: "3", isCorrect: false, orderIndex: 1 },
            { optionText: "4", isCorrect: true, orderIndex: 2 },
            { optionText: "5", isCorrect: false, orderIndex: 3 },
          ],
        },
        headers: { Authorization: `Bearer ${eduToken}` },
      }
    );
    expect(aq.status()).toBe(201);
    const aqb = await unwrap(aq);
    questionId = aqb.questions[0].id;
    correctOptionId = aqb.questions[0].options.find((o) => o.isCorrect).id;

    const pq = await request.post(
      `${API}/courses/${courseId}/lessons/${lessonId}/quiz/publish`,
      {
        headers: { Authorization: `Bearer ${eduToken}` },
      }
    );
    expect(pq.status()).toBe(200);
  });

  /* ── Student exercises ── */

  test("List courses includes the published course", async ({ request }) => {
    const resp = await request.get(`${API}/courses`);
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    const items = body.items || body.data || body;
    expect(items.some((c) => c.id === courseId)).toBeTruthy();
  });

  test("Get course details returns full public info", async ({ request }) => {
    const resp = await request.get(`${API}/courses/${courseId}`);
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.title).toContain("Student E2E");
    expect(body.isFree).toBe(true);
    expect(body.status).toBe("PUBLISHED");
  });

  test("Signup a new student", async ({ request }) => {
    const uniq = `stu_e2e_${ts}`;
    const resp = await request.post(`${API}/auth/signup`, {
      data: {
        username: uniq,
        email: `${uniq}@test.com`,
        password: "StuPass123!",
        firstName: "E2E",
        lastName: "Student",
      },
    });
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.accessToken).toBeTruthy();
    stuToken = body.accessToken;
  });

  test("Enroll in free course", async ({ request }) => {
    const resp = await request.post(`${API}/courses/${courseId}/enroll`, {}, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(201);

    const check = await request.get(
      `${API}/courses/${courseId}/enrollment`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(check.status()).toBe(200);
    const cb = await unwrap(check);
    expect(cb.enrolled).toBe(true);
  });

  test("Track lesson progress", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/progress`,
      { watchedSeconds: 300, lastPosition: 300 },
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.ok()).toBe(true);
  });

  test("Get course progress", async ({ request }) => {
    const resp = await request.get(
      `${API}/courses/${courseId}/progress`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(200);
  });

  test("Start quiz attempt", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/quiz/attempt`,
      {},
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.attemptId).toBeTruthy();
    expect(body.status).toBe("IN_PROGRESS");
    expect(body.questions).toBeDefined();
    expect(body.questions.length).toBe(1);
    attemptId = body.attemptId;
  });

  test("Submit quiz attempt and get graded result", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/quiz/attempt/${attemptId}/submit`,
      {
        answers: [{ questionId, selectedOptionId: correctOptionId }],
      },
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.status).toBe("GRADED");
    expect(body.isPassed).toBe(true);
    expect(body.score).toBe(1);

    const result = await request.get(
      `${API}/lessons/${lessonId}/quiz/attempt/${attemptId}`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(result.status()).toBe(200);
    const rb = await unwrap(result);
    expect(rb.status).toBe("GRADED");
    expect(rb.score).toBe(1);
  });

  test("List my enrollments", async ({ request }) => {
    const resp = await request.get(`${API}/enrollments`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    const list = Array.isArray(body) ? body : body.items || body.data || [];
    expect(list.some((e) => e.courseId === courseId)).toBeTruthy();
  });

  test("Verify certificate — invalid code returns 404", async ({
    request,
  }) => {
    const resp = await request.get(
      `${API}/certificates/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/verify`
    );
    expect(resp.status()).toBe(404);
  });
});

test.describe("Student Learning UI", () => {
  let seedCourseTitle;
  let seedStudentToken;
  let seedCourseId;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  test("Setup: seed published course + student via API", async ({
    request,
  }) => {
    const edResp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    const t = (await unwrap(edResp)).accessToken;
    seedCourseTitle = `UI Student Course ${ts}`;

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
          username: `uistu_${ts}`,
          email: `uistu_${ts}@test.com`,
          password: "UiPass123!",
          firstName: "UI",
          lastName: "Student",
        },
      })
    );
    seedStudentToken = su.accessToken;

    await request.post(`${API}/courses/${seedCourseId}/enroll`, {}, {
      headers: { Authorization: `Bearer ${seedStudentToken}` },
    });
  });

  test("Home page shows course list", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator(`text=${seedCourseTitle}`).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Course detail page shows enrolled course info", async ({
    page,
  }) => {
    await page.goto(`/course/${seedCourseId}`);
    await expect(
      page.locator(`text=${seedCourseTitle}`).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("My Enrollments page shows the seeded enrollment", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', `uistu_${ts}@test.com`);
    await page.fill('input[name="password"]', "UiPass123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await page.goto("/my-enrollments");
    await expect(
      page.locator(`text=${seedCourseTitle}`).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
