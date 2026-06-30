import { test, expect } from "@playwright/test";

const STUDENT = { email: "student@test.com", password: "Test1234!" };

const login = async (page) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', STUDENT.email);
  await page.fill('input[name="password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 15000 });
};

test.describe("Review Flow", () => {
  test("student creates, edits, and deletes a review", async ({ page }) => {
    await login(page);

    // Go to enrollments and enter a course to mark a lesson complete
    await page.goto("/my-enrollments");
    await page.waitForURL("/my-enrollments", { timeout: 10000 });

    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Review")');
    await expect(continueBtn.first()).toBeVisible({ timeout: 15000 });
    await continueBtn.first().click();
    await page.waitForURL(/\/player\//, { timeout: 15000 });
    await expect(page.locator("text=Course Content").first()).toBeVisible({ timeout: 15000 });

    // Mark lesson as complete to unlock review ability
    const markComplete = page.locator('button:has-text("Mark Complete")');
    await expect(markComplete).toBeVisible({ timeout: 20000 });
    await markComplete.click();
    await expect(page.locator("text=✓ Completed")).toBeVisible({ timeout: 10000 });

    const courseId = page.url().match(/\/player\/([^/]+)/)?.[1];
    expect(courseId).toBeTruthy();

    // Navigate to course details page
    await page.goto(`/course/${courseId}`);
    await page.waitForURL(/\/course\//, { timeout: 10000 });

    // Wait for Reviews section to load
    await expect(page.locator("text=Reviews").first()).toBeVisible({ timeout: 15000 });

    // --- Create a review ---
    const writeReviewBtn = page.locator('button:has-text("Write a Review")');
    await expect(writeReviewBtn).toBeVisible({ timeout: 10000 });
    await writeReviewBtn.click();

    await expect(page.locator('h4:has-text("Write Your Review")')).toBeVisible({ timeout: 5000 });

    // Click the 4th star (rating = 4)
    const reviewForm = page.locator('h4:has-text("Write Your Review")').locator("..");
    await reviewForm.locator("span.cursor-pointer").nth(3).click();

    const reviewText = "E2E test create review.";
    await page.fill('textarea[placeholder*="Share your thoughts"]', reviewText);
    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator("text=Your Review")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${reviewText}`)).toBeVisible({ timeout: 5000 });

    // --- Flag a different review if available ---
    const reportBtn = page.locator('button:has-text("Report")').first();
    const hasOtherReview = await reportBtn.isVisible().catch(() => false);
    if (hasOtherReview) {
      await reportBtn.click();

      const flagSubmit = page.locator('button:has-text("Submit")').last();
      await expect(flagSubmit).toBeVisible({ timeout: 5000 });
      await flagSubmit.click();

      await expect(page.locator("text=Reported").first()).toBeVisible({ timeout: 10000 });
    }

    // --- Edit the review ---
    await page.locator('button:has-text("Edit")').click();
    await expect(page.locator('h4:has-text("Edit Your Review")')).toBeVisible({ timeout: 5000 });

    const editForm = page.locator('h4:has-text("Edit Your Review")').locator("..");
    await editForm.locator("span.cursor-pointer").nth(4).click();

    const editedText = "E2E test edited review.";
    await page.fill('textarea[placeholder*="Update your thoughts"]', editedText);
    await page.locator('button:has-text("Save")').click();

    await expect(page.locator(`text=${editedText}`)).toBeVisible({ timeout: 5000 });

    // --- Delete the review ---
    await page.locator('button:has-text("Delete")').click();
    await page.locator('button:has-text("Confirm")').click();

    await expect(page.locator('button:has-text("Write a Review")')).toBeVisible({ timeout: 10000 });
  });
});
