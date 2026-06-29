import { test, expect } from "@playwright/test";

const API = "/api";
const EDU_EMAIL = "educator@test.com";
const EDU_PW = "Test1234!";

const unwrap = (resp) => resp.json().then((j) => j.data ?? j);

test.describe("Discussion API", () => {
  let eduToken, stuToken, courseId, lessonId;
  let threadId, postId;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  test("Setup: login as educator", async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    expect(resp.status()).toBe(200);
    eduToken = (await unwrap(resp)).accessToken;
  });

  test("Setup: create published course with module + lesson", async ({
    request,
  }) => {
    const c = await request.post(`${API}/courses`, {
      data: {
        instructorId: "1",
        title: `Disc E2E ${ts}`,
        subtitle: "Discussion test",
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

  test("Setup: signup and enroll a student", async ({ request }) => {
    const uniq = `disc_stu_${ts}`;
    const resp = await request.post(`${API}/auth/signup`, {
      data: {
        username: uniq,
        email: `${uniq}@test.com`,
        password: "StuPass123!",
        firstName: "Disc",
        lastName: "Student",
      },
    });
    expect(resp.status()).toBe(201);
    stuToken = (await unwrap(resp)).accessToken;

    const enroll = await request.post(
      `${API}/courses/${courseId}/enroll`,
      {
        headers: { Authorization: `Bearer ${stuToken}` },
      }
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

  test("Create a discussion thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions`,
      {
        data: {
          title: "Test Question",
          body: "This is the body of my question.",
        },
        headers: { Authorization: `Bearer ${stuToken}` },
      }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.title).toBe("Test Question");
    expect(body.authorId).toBeTruthy();
    expect(body.isResolved).toBe(false);
    expect(body.isPinned).toBe(false);
    expect(body.lessonId).toBe(String(lessonId));
    threadId = body.id;
  });

  test("List discussion threads for the lesson", async ({ request }) => {
    const resp = await request.get(
      `${API}/lessons/${lessonId}/discussions`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items.some((t) => t.id === threadId)).toBeTruthy();
  });

  test("Reply to a thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/posts`,
      {
        data: { body: "This is a reply." },
        headers: { Authorization: `Bearer ${stuToken}` },
      }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.body).toBe("This is a reply.");
    expect(body.threadId).toBe(threadId);
    postId = body.id;
  });

  test("Get thread detail with posts", async ({ request }) => {
    const resp = await request.get(
      `${API}/lessons/${lessonId}/discussions/${threadId}`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.thread.title).toBe("Test Question");
    expect(body.posts.items.length).toBeGreaterThanOrEqual(1);
  });

  test("Upvote a thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/upvote`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.upvoted).toBe(true);
  });

  test("Upvote a post", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/upvote`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.upvoted).toBe(true);
  });

  test("Instructor accepts a post as answer", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/accept`,
      { headers: { Authorization: `Bearer ${eduToken}` } }
    );
    expect(resp.status()).toBe(201);
    const body = await unwrap(resp);
    expect(body.isResolved).toBe(true);
    expect(body.acceptedPostId).toBe(postId);
  });

  test("Instructor pins a thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/pin`,
      { headers: { Authorization: `Bearer ${eduToken}` } }
    );
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.isPinned).toBe(true);
  });

  test("Instructor unpins a thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions/${threadId}/unpin`,
      { headers: { Authorization: `Bearer ${eduToken}` } }
    );
    expect(resp.status()).toBe(200);
    const body = await unwrap(resp);
    expect(body.isPinned).toBe(false);
  });

  test("Unauthenticated user cannot create a thread", async ({ request }) => {
    const resp = await request.post(
      `${API}/lessons/${lessonId}/discussions`,
      { data: { title: "Should fail", body: "No token" } }
    );
    expect(resp.status()).toBe(401);
  });

  test("Instructor deletes the thread", async ({ request }) => {
    const resp = await request.delete(
      `${API}/lessons/${lessonId}/discussions/${threadId}`,
      { headers: { Authorization: `Bearer ${eduToken}` } }
    );
    expect(resp.status()).toBe(204);

    const getResp = await request.get(
      `${API}/lessons/${lessonId}/discussions`,
      { headers: { Authorization: `Bearer ${stuToken}` } }
    );
    const body = await unwrap(getResp);
    expect(body.items.some((t) => t.id === threadId)).toBeFalsy();
  });
});

test.describe("Discussion UI", () => {
  let seedLessonId, seedCourseTitle, seedStudentToken;
  const ts = Date.now();

  test.describe.configure({ mode: "serial" });

  test("Setup: seed course + lesson + student via API", async ({
    request,
  }) => {
    const edResp = await request.post(`${API}/auth/login`, {
      data: { email: EDU_EMAIL, password: EDU_PW },
    });
    const t = (await unwrap(edResp)).accessToken;
    seedCourseTitle = `UI Disc Course ${ts}`;

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
    const courseId = c.id;

    const m = await unwrap(
      await request.post(`${API}/courses/${courseId}/modules`, {
        data: { title: "M1", orderIndex: 1 },
        headers: { Authorization: `Bearer ${t}` },
      })
    );

    const l = await unwrap(
      await request.post(
        `${API}/courses/${courseId}/modules/${m.id}/lessons`,
        {
          data: {
            title: "UI Disc Lesson",
            contentType: "VIDEO",
            contentUrl: "https://example.com/vid.mp4",
            durationSecs: 300,
            orderIndex: 1,
          },
          headers: { Authorization: `Bearer ${t}` },
        }
      )
    );
    seedLessonId = l.id;

    await request.post(`${API}/courses/${courseId}/publish`, {
      headers: { Authorization: `Bearer ${t}` },
    });

    const su = await unwrap(
      await request.post(`${API}/auth/signup`, {
        data: {
          username: `uidisc_${ts}`,
          email: `uidisc_${ts}@test.com`,
          password: "UiPass123!",
          firstName: "UI",
          lastName: "DiscStudent",
        },
      })
    );
    seedStudentToken = su.accessToken;

    await request.post(`${API}/courses/${courseId}/enroll`, {
      headers: { Authorization: `Bearer ${seedStudentToken}` },
    });
  });

  test("Discussion panel opens in lesson player", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', `uidisc_${ts}@test.com`);
    await page.fill('input[name="password"]', "UiPass123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await page.goto(`/course/${seedLessonId}`);
    await expect(page.locator("text=Discuss")).toBeVisible({ timeout: 10000 });
  });
});
