import { test, expect } from "@playwright/test";

const STUDENT = { email: "student@test.com", password: "Test1234!" };
const EDUCATOR = { email: "educator@test.com", password: "Test1234!" };

const login = async (page, { email, password }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 15000 });
};

test.describe("Discussion Flow", () => {
  test("student creates a thread, replies, and upvotes", async ({ page }) => {
    await login(page, STUDENT);

    await page.goto("/my-enrollments");
    await page.waitForURL("/my-enrollments", { timeout: 10000 });

    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Review")');
    await expect(continueBtn.first()).toBeVisible({ timeout: 15000 });
    await continueBtn.first().click();
    await page.waitForURL(/\/player\//, { timeout: 15000 });
    await expect(page.locator("text=Course Content").first()).toBeVisible({ timeout: 15000 });

    await page.locator('button:has-text("Discuss")').click();
    await expect(page.locator("text=Discussion")).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("+ New Thread")').click();

    const threadTitle = `E2E Thread ${Date.now()}`;
    await page.fill('input[placeholder="Thread title"]', threadTitle);
    await page.fill('textarea[placeholder="What\'s on your mind? (optional)"]', "E2E thread body.");
    await page.locator('button[type="submit"]:has-text("Post")').click();

    await expect(page.locator(`h4:has-text("${threadTitle}")`)).toBeVisible({ timeout: 10000 });
    await page.locator(`h4:has-text("${threadTitle}")`).click();

    await expect(page.locator('textarea[placeholder="Write a reply…"]')).toBeVisible({ timeout: 10000 });
    await page.fill('textarea[placeholder="Write a reply…"]', "E2E reply body.");
    await page.locator('button[type="submit"]:has-text("Reply")').click();

    await expect(page.locator("text=E2E reply body.")).toBeVisible({ timeout: 10000 });

    const upvoteBtn = page.locator('button:has-text("▲")').first();
    await upvoteBtn.click();
    await expect(upvoteBtn).toBeVisible();
  });

  test("instructor accepts an answer", async ({ page }) => {
    await login(page, EDUCATOR);

    await page.goto("/educator/my-courses");
    await page.waitForURL("/educator/my-courses", { timeout: 10000 });
    await expect(page.locator("text=My Courses")).toBeVisible({ timeout: 15000 });

    const analyticsBtn = page.locator('button:has-text("Analytics")').first();
    await expect(analyticsBtn).toBeVisible({ timeout: 10000 });
    await analyticsBtn.click();
    await page.waitForURL(/\/educator\/course\/([^/]+)\/analytics/, { timeout: 10000 });

    const match = page.url().match(/\/educator\/course\/([^/]+)\/analytics/);
    expect(match).not.toBeNull();
    const courseId = match[1];

    await page.goto(`/player/${courseId}`);
    await page.waitForURL(/\/player\//, { timeout: 10000 });
    await expect(page.locator("text=Course Content").first()).toBeVisible({ timeout: 15000 });

    await page.locator('button:has-text("Discuss")').click();
    await expect(page.locator("text=Discussion")).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("+ New Thread")').click();

    const threadTitle = `E2E Instructor Thread ${Date.now()}`;
    await page.fill('input[placeholder="Thread title"]', threadTitle);
    await page.fill('textarea[placeholder="What\'s on your mind? (optional)"]', "Instructor question.");
    await page.locator('button[type="submit"]:has-text("Post")').click();

    await expect(page.locator(`h4:has-text("${threadTitle}")`)).toBeVisible({ timeout: 10000 });
    await page.locator(`h4:has-text("${threadTitle}")`).click();

    await expect(page.locator('textarea[placeholder="Write a reply…"]')).toBeVisible({ timeout: 10000 });
    await page.fill('textarea[placeholder="Write a reply…"]', "Instructor answer.");
    await page.locator('button[type="submit"]:has-text("Reply")').click();
    await expect(page.locator("text=Instructor answer.")).toBeVisible({ timeout: 10000 });

    const acceptBtn = page.locator('button:has-text("Accept")');
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.first().click();

    await expect(page.locator("text=Accepted").or(page.locator("text=Solved"))).toBeVisible({ timeout: 10000 });
  });
});
