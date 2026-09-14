import { test, expect } from "@playwright/test";

test.describe("Portal - Student Management Lifecycle", () => {
  const testStudentName = `Auto Student ${Date.now()}`;
  const rawStudentPhone = "069123456";
  const expectedFormattedPhone = "+373 691 23 456";
  const parentPhone = "+373 68 999 888";

  test("Admin can create, view, edit and delete a student with phone validation and course enrollment", async ({
    page,
  }) => {
    // Automatically accept confirm dialogs for delete action
    page.on("dialog", (dialog) => dialog.accept());

    // 1. Log in as School Admin
    await page.goto("http://localhost:3002");
    await page.fill('input[type="email"]', "admin@vibe.md");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Students page
    await page.goto("http://localhost:3002/dashboard/students");
    await expect(page.getByRole("heading", { name: "Studenți" })).toBeVisible();

    // 3. Open "Adaugă Student" drawer
    await page.getByRole("button", { name: "Adaugă Student" }).click();
    await expect(page.locator("h2")).toContainText("Adaugă Student");

    // 4. Fill in student details
    await page.fill('input[placeholder="Ex: Ion Popescu"]', testStudentName);
    await page.fill(
      'input[placeholder="Ex: +373 69 000 000 sau +40 712 345 678"]',
      rawStudentPhone,
    );
    await page.fill('input[placeholder="Ex: 12"]', "12");
    await page.fill('input[placeholder="Ex: Maria Popescu"]', "Parent Auto");
    await page.fill('input[placeholder="Ex: +373 68 000 000 sau +40 712 345 678"]', parentPhone);

    // 5. Select a course if available within the form
    const form = page.locator("form");
    const courseButton = form.locator('button:has-text("General English A1-A2")').first();
    const courseAvailable = (await courseButton.count()) > 0;
    if (courseAvailable) {
      await courseButton.click();
    }

    // 6. Submit the form
    await form.locator('button[type="submit"]:has-text("Creează Student")').click();

    // 7. Verify the drawer closes and student appears in table
    const studentRow = page.locator("tr.group", { hasText: testStudentName });
    await expect(studentRow).toBeVisible({ timeout: 10000 });

    // Verify age and formatted phone number (handled by libphonenumber-js)
    await expect(studentRow).toContainText("12 ani");
    await expect(studentRow).toContainText(expectedFormattedPhone);

    // Verify course badge if selected
    if (courseAvailable) {
      await expect(studentRow).toContainText("General English A1-A2");
    }

    // 8. Edit the student: change age to 13
    await studentRow.locator("button:has-text('Editează')").click();
    await expect(page.locator("h2")).toContainText("Editează Student");

    const ageInput = page.locator('form input[placeholder="Ex: 12"]');
    await ageInput.fill("13");
    await page.locator('form button[type="submit"]:has-text("Salvează Modificările")').click();

    // 9. Verify updated age in the table
    const updatedRow = page.locator("tr.group", { hasText: testStudentName });
    await expect(updatedRow).toContainText("13 ani");

    // 10. Clean up: delete the test student
    await updatedRow.locator("button:has-text('Șterge')").click();

    // Verify student is removed from the table
    await expect(page.locator("tr.group", { hasText: testStudentName })).not.toBeVisible();
  });
});

