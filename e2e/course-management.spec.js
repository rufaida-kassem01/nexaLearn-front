import { test, expect } from "@playwright/test";

const uniq = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const EDUCATOR = { email: "educator@test.com", password: "Test1234!" };

const loginAsEducator = async (page) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', EDUCATOR.email);
  await page.fill('input[name="password"]', EDUCATOR.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/educator", { timeout: 15000 });
};

const setQuillContent = (page, html) =>
  page.evaluate((h) => {
    const el = document.querySelector(".ql-editor");
    if (el) el.innerHTML = h;
  }, html);

test.describe("Course Management", () => {
  test("educator creates a course with modules and lessons", async ({ page }) => {
    const courseTitle = `Test Course ${uniq()}`;

    await loginAsEducator(page);

    // Navigate to Add Course via sidebar
    await page.goto("/educator/add-course");
    await page.waitForSelector('input[placeholder="Type here"]');

    // Fill course form
    await page.fill('input[placeholder="Type here"]', courseTitle);
    await page.fill('input[placeholder="A short subtitle"]', "E2E test subtitle");
    await setQuillContent(page, "<p>E2E test description</p>");
    await page.fill('input[placeholder="en"]', "en");

    // Add a chapter (handles prompt dialog)
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe("Enter Chapter Name:");
      dialog.accept("Chapter 1");
    });
    await page.locator("text=+ Add Chapter").click();

    // Wait for chapter to appear
    await expect(page.locator("text=Chapter 1")).toBeVisible();

    // Add a lecture to the chapter
    await page.locator("text=+ Add Lecture").click();

    // Fill lecture popup
    await page.waitForSelector("text=Add Lecture");
    await page.locator(".fixed input[type=text]").first().fill("Lecture 1");
    await page.locator(".fixed input[type=number]").first().fill("10");
    await page.locator(".fixed input[type=text]").nth(1).fill("https://example.com/video.mp4");
    await page.locator("button:has-text('Add')").click();

    // Verify lecture is listed
    await expect(page.locator("text=Lecture 1")).toBeVisible();

    // Submit the form
    await page.locator('button[type="submit"]:has-text("ADD")').click();

    // Wait for success toast
    await expect(page.locator("text=Course created successfully!")).toBeVisible({ timeout: 20000 });
  });

  test("course appears in MyCourses", async ({ page }) => {
    const courseTitle = `List Check ${uniq()}`;

    await loginAsEducator(page);

    // Create a course first
    await page.goto("/educator/add-course");
    await page.waitForSelector('input[placeholder="Type here"]');
    await page.fill('input[placeholder="Type here"]', courseTitle);
    await page.fill('input[placeholder="A short subtitle"]', "List test");
    await setQuillContent(page, "<p>Description</p>");
    await page.fill('input[placeholder="en"]', "en");

    page.once("dialog", (dialog) => dialog.accept("Chapter A"));
    await page.locator("text=+ Add Chapter").click();
    await page.waitForSelector("text=Chapter A");

    await page.locator('button[type="submit"]:has-text("ADD")').click();
    await expect(page.locator("text=Course created successfully!")).toBeVisible({ timeout: 20000 });

    // Navigate to My Courses
    await page.goto("/educator/my-courses");
    await page.waitForSelector("text=My Courses");

    // The course should appear in the table
    await expect(page.locator(`td:has-text("${courseTitle}")`)).toBeVisible({ timeout: 10000 });
  });

  test("editing a course saves changes", async ({ page }) => {
    const originalTitle = `Edit Test ${uniq()}`;
    const updatedTitle = `${originalTitle} (updated)`;

    await loginAsEducator(page);

    // Create a course to edit
    await page.goto("/educator/add-course");
    await page.waitForSelector('input[placeholder="Type here"]');
    await page.fill('input[placeholder="Type here"]', originalTitle);
    await page.fill('input[placeholder="A short subtitle"]', "Original subtitle");
    await setQuillContent(page, "<p>Original description</p>");
    await page.fill('input[placeholder="en"]', "en");

    page.once("dialog", (dialog) => dialog.accept("Chapter Edit"));
    await page.locator("text=+ Add Chapter").click();
    await page.waitForSelector("text=Chapter Edit");

    await page.locator('button[type="submit"]:has-text("ADD")').click();
    await expect(page.locator("text=Course created successfully!")).toBeVisible({ timeout: 20000 });

    // Navigate to My Courses
    await page.goto("/educator/my-courses");
    await page.waitForSelector("text=My Courses");

    // Find the course row and click Edit
    const courseRow = page.locator(`tr:has(td:text("${originalTitle}"))`);
    await expect(courseRow).toBeVisible({ timeout: 10000 });
    await courseRow.locator('button:has-text("Edit")').click();

    // Wait for edit page to load (the course title input should be pre-filled)
    await page.waitForURL(/\/educator\/edit-course\//, { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Type here"]');

    // Update the title
    await page.fill('input[placeholder="Type here"]', updatedTitle);

    // Save changes
    await page.locator('button[type="submit"]:has-text("SAVE CHANGES")').click();

    // Wait for success toast and redirect
    await expect(page.locator("text=Course updated successfully!")).toBeVisible({ timeout: 20000 });
    await page.waitForURL("/educator/my-courses", { timeout: 10000 });

    // Verify the updated title appears
    await expect(page.locator(`td:has-text("${updatedTitle}")`)).toBeVisible({ timeout: 10000 });
  });

  test("publishing a course changes status", async ({ page }) => {
    const courseTitle = `Publish Test ${uniq()}`;

    await loginAsEducator(page);

    // Create a course
    await page.goto("/educator/add-course");
    await page.waitForSelector('input[placeholder="Type here"]');
    await page.fill('input[placeholder="Type here"]', courseTitle);
    await page.fill('input[placeholder="A short subtitle"]', "Publish test");
    await setQuillContent(page, "<p>Description</p>");
    await page.fill('input[placeholder="en"]', "en");

    page.once("dialog", (dialog) => dialog.accept("Chapter P"));
    await page.locator("text=+ Add Chapter").click();
    await page.waitForSelector("text=Chapter P");

    await page.locator('button[type="submit"]:has-text("ADD")').click();
    await expect(page.locator("text=Course created successfully!")).toBeVisible({ timeout: 20000 });

    // Go to My Courses
    await page.goto("/educator/my-courses");
    await page.waitForSelector("text=My Courses");

    // Find the course
    const courseRow = page.locator(`tr:has(td:text("${courseTitle}"))`);
    await expect(courseRow).toBeVisible({ timeout: 10000 });

    // Click Publish
    const publishBtn = courseRow.locator('button:has-text("Publish")');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Wait for the status badge to show PUBLISHED
    await expect(courseRow.locator("text=PUBLISHED")).toBeVisible({ timeout: 10000 });
  });

  test("deleting a course removes it", async ({ page }) => {
    const courseTitle = `Delete Test ${uniq()}`;

    await loginAsEducator(page);

    // Create a course
    await page.goto("/educator/add-course");
    await page.waitForSelector('input[placeholder="Type here"]');
    await page.fill('input[placeholder="Type here"]', courseTitle);
    await page.fill('input[placeholder="A short subtitle"]', "Delete test");
    await setQuillContent(page, "<p>Description</p>");
    await page.fill('input[placeholder="en"]', "en");

    page.once("dialog", (dialog) => dialog.accept("Chapter D"));
    await page.locator("text=+ Add Chapter").click();
    await page.waitForSelector("text=Chapter D");

    await page.locator('button[type="submit"]:has-text("ADD")').click();
    await expect(page.locator("text=Course created successfully!")).toBeVisible({ timeout: 20000 });

    // Go to My Courses
    await page.goto("/educator/my-courses");
    await page.waitForSelector("text=My Courses");

    // Find the course and click Delete
    const courseRow = page.locator(`tr:has(td:text("${courseTitle}"))`);
    await expect(courseRow).toBeVisible({ timeout: 10000 });
    await courseRow.locator('button:has-text("Delete")').click();

    // Confirm the delete dialog
    await expect(page.locator("text=Delete Course")).toBeVisible();
    await page.locator('button:has-text("Delete")').last().click();

    // Wait for the course to disappear from the table
    await expect(page.locator(`td:has-text("${courseTitle}")`)).not.toBeVisible({ timeout: 15000 });
  });
});
