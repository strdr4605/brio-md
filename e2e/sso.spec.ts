import { test, expect } from "@playwright/test";

test.describe("Auth.js SSO & Session Sharing", () => {
  test("1. Login at  Portal give access to Learn without required password (SSO)", async ({
    page,
    context,
  }) => {
    await page.goto("http://localhost:3002");
    await expect(page.locator("h1")).toContainText("Portal Personal");

    await page.fill('input[type="email"]', "teacher@vibe.md");
    await page.fill('input[type="password"]', "teacher123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("text=John Teacher").first()).toBeVisible();

    const learnPage = await context.newPage();
    await learnPage.goto("http://localhost:3003/courses");

    await expect(learnPage).toHaveURL(/.*\/courses/);
    await expect(learnPage.locator("h1")).toContainText("Learning Portal");
  });

  test("2. Without login direct access to  /dashboard and /courses blocked", async ({ page }) => {
    await page.goto("http://localhost:3002/dashboard");
    await expect(page).toHaveURL("http://localhost:3002/");

    await page.goto("http://localhost:3003/courses");
    await expect(page).toHaveURL("http://localhost:3003/");
  });

  test("3. Wrong password Invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.fill('input[type="email"]', "admin@brio.md");
    await page.fill('input[type="password"]', "wrongpassword999");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*error=Invalid\+credentials/);
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });
});
