import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

const TARGET_VIEWPORTS = [
  { name: "android-360x800", width: 360, height: 800 },
  { name: "ios-390x844", width: 390, height: 844 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
];

const CORE_ROUTES = [
  { name: "dashboard-overview", path: "/dashboard" },
  { name: "dashboard-students", path: "/dashboard/students" },
  { name: "dashboard-invoices", path: "/dashboard/invoices" },
  { name: "dashboard-attendance", path: "/dashboard/attendance" },
  { name: "dashboard-schedule", path: "/dashboard/schedule" },
  { name: "dashboard-courses", path: "/dashboard/courses" },
  { name: "dashboard-users", path: "/dashboard/users" },
];

async function loginAsAdmin(page: Page) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', "admin@vibe.md");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe("QA Automated Pre-Flight Sweep (#251)", () => {
  const screenshotsDir = path.join(process.cwd(), "test-results", "preflight");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const vp of TARGET_VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("Crawl core routes: Zero horizontal overflow, no hydration errors or 404s", async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        const networkErrors: string[] = [];

        page.on("pageerror", (err) => {
          consoleErrors.push(`[Unhandled Page Error]: ${err.message}`);
        });

        page.on("console", (msg) => {
          if (msg.type() === "error") {
            const text = msg.text();
            if (
              text.includes("Hydration failed") ||
              text.includes("did not match") ||
              text.includes("minified React error")
            ) {
              consoleErrors.push(`[React Hydration Error]: ${text}`);
            }
          }
        });

        page.on("response", (res) => {
          const status = res.status();
          const url = res.url();
          // Flag 404 or 500 for local assets / APIs
          if ((status === 404 || status >= 500) && url.includes(BASE_URL)) {
            networkErrors.push(`[Failed HTTP ${status}]: ${url}`);
          }
        });

        // 1. Authenticate
        await loginAsAdmin(page);

        // 2. Crawl routes
        for (const route of CORE_ROUTES) {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle").catch(() => {});

          // Horizontal overflow check: document.documentElement.scrollWidth <= window.innerWidth
          const overflowInfo = await page.evaluate(() => {
            const scrollWidth = document.documentElement.scrollWidth;
            const innerWidth = window.innerWidth;
            return {
              hasOverflow: scrollWidth > innerWidth,
              scrollWidth,
              innerWidth,
            };
          });

          expect(
            overflowInfo.hasOverflow,
            `Horizontal overflow detected on ${route.path} (${vp.name}): scrollWidth ${overflowInfo.scrollWidth} > innerWidth ${overflowInfo.innerWidth}`,
          ).toBe(false);

          // Save artifact screenshot
          const screenshotPath = path.join(screenshotsDir, `${vp.name}-${route.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
        }

        // Verify no hydration or network errors occurred during crawl
        expect(consoleErrors).toEqual([]);
        expect(networkErrors).toEqual([]);
      });
    });
  }

  test("Form Smoke Run: Add and delete student with valid Moldovan phone (+373 69 123456)", async ({
    page,
  }) => {
    page.on("dialog", (dialog) => dialog.accept());

    const testStudentName = `Preflight Elev ${Date.now()}`;
    const testPhone = "+373 69 123456";

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/students`);

    // Ensure page loaded
    await expect(page.getByRole("heading", { name: /Catalog Studenți|Studenți/i })).toBeVisible({
      timeout: 15000,
    });

    // Open Drawer
    const addBtn = page
      .getByTestId("add-student-button")
      .or(page.getByRole("button", { name: /Adaugă Student/i }));
    await expect(addBtn.first()).toBeVisible({ timeout: 15000 });
    await addBtn.first().click();

    await expect(page.locator("h2")).toContainText("Adaugă Student", { timeout: 10000 });

    // Fill form with valid Moldovan phone
    await page.fill('input[placeholder="Ex: Ion Popescu"]', testStudentName);
    await page.fill('input[placeholder="Ex: +373 69 000 000"]', testPhone);
    await page.fill('input[placeholder="Ex: 12"]', "15");
    await page.fill('input[placeholder="Ex: Maria Popescu"]', "Părinte Test");
    await page.fill('input[placeholder="Ex: +373 68 000 000"]', "+373 68 987654");

    // Submit form
    await page.locator('button[type="submit"]:has-text("Creează Student")').click();

    // Verify row appeared in visible table or mobile card
    const visibleStudentRow = page
      .locator("tr.group", { hasText: testStudentName })
      .or(page.locator("a", { hasText: testStudentName }).filter({ visible: true }));
    await expect(visibleStudentRow.first()).toBeVisible({ timeout: 15000 });

    // Clean up
    const deleteBtn = page
      .locator(`tr.group:has-text("${testStudentName}") button:has-text("Șterge")`)
      .or(page.locator(`button:has-text("Șterge")`).filter({ visible: true }));
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.first().click();
    }
  });
});
