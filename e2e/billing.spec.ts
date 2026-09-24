import { test, expect, Page } from "@playwright/test";

// Helper for authenticating via login form
async function loginAs(page: Page, email: string, pass: string) {
  await page.goto("http://localhost:3002");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

// Helper for calling tRPC mutation inside the authenticated browser context
async function trpcMutate(page: Page, procedure: string, input: any) {
  return await page.evaluate(
    async ({ proc, payload }) => {
      const res = await fetch(`/api/trpc/${proc}?batch=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "0": { json: payload } }),
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    },
    { proc: procedure, payload: input },
  );
}

// Helper for calling tRPC query inside the authenticated browser context
async function trpcQuery(page: Page, procedure: string, input?: any) {
  return await page.evaluate(
    async ({ proc, payload }) => {
      const queryParam =
        payload !== undefined
          ? encodeURIComponent(JSON.stringify({ "0": { json: payload } }))
          : encodeURIComponent(JSON.stringify({ "0": {} }));
      const res = await fetch(`/api/trpc/${proc}?batch=1&input=${queryParam}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    },
    { proc: procedure, payload: input },
  );
}

test.describe("Portal - Comprehensive Billing Lifecycle & PBAC Security", () => {
  // Test 1: Enroll student with Abonament -> Generate monthly invoice -> Verify student debt appears -> Pay in full -> Verify debt cleared
  test("Test 1: Enroll student with Abonament -> Monthly invoice -> Debt appears -> Pay in full -> Debt cleared", async ({
    page,
  }) => {
    // 1. Log in as School Admin
    await loginAs(page, "admin@vibe.md", "admin123");

    // 2. Create student for Abonament test
    const timestamp = Date.now();
    const studentName = `Student Abonament ${timestamp}`;
    const createStudentRes = await trpcMutate(page, "student.create", {
      name: studentName,
      phone: "+37369111222",
      parentName: "Parent Abonament",
      parentPhone: "+37369333444",
      age: 10,
    });
    expect(createStudentRes.ok).toBe(true);
    const studentId = createStudentRes.data[0].result.data.json.id;
    expect(studentId).toBeGreaterThan(0);

    // 3. Enroll student in group 1 with Abonament (subscription_monthly)
    const enrollRes = await trpcMutate(page, "enrollment.enrollStudent", {
      studentId,
      groupIds: [1],
      billingType: "subscription_monthly",
      customPrice: 1200,
    });
    expect(enrollRes.ok).toBe(true);

    // 4. Generate monthly recurring invoice for this student's group
    const generateRes = await trpcMutate(page, "billing.generateRecurringInvoices", {
      targetMonth: "2026-11",
      groupId: 1,
      defaultPrice: 1200,
      status: "issued",
      dueDate: "2026-11-10",
    });
    expect(generateRes.ok).toBe(true);
    const createdInvoices = generateRes.data[0].result.data.json.invoices;
    const studentInvoice = createdInvoices.find((inv: any) => inv.studentId === studentId);
    expect(studentInvoice).toBeDefined();
    expect(studentInvoice.totalAmount).toBe(1200);
    expect(studentInvoice.status).toBe("issued");

    // 5. Verify student debt appears in balance summary
    const balanceBeforePay = await trpcQuery(page, "billing.getStudentBalanceSummary", { studentId });
    expect(balanceBeforePay.ok).toBe(true);
    const balanceDataBefore = balanceBeforePay.data[0].result.data.json;
    expect(balanceDataBefore.totalInvoiced).toBe(1200);
    expect(balanceDataBefore.totalPaid).toBe(0);
    expect(balanceDataBefore.currentDebt).toBe(1200);

    // 6. Pay in full
    const payRes = await trpcMutate(page, "billing.recordPayment", {
      invoiceId: studentInvoice.id,
      amount: 1200,
      paymentDate: "2026-11-05",
      method: "card",
      receiptNumber: `REC-${timestamp}`,
      notes: "Plată integrală abonament test",
    });
    expect(payRes.ok).toBe(true);
    expect(payRes.data[0].result.data.json.invoice.status).toBe("paid");
    expect(payRes.data[0].result.data.json.invoice.paidAmount).toBe(1200);

    // 7. Verify student debt is cleared
    const balanceAfterPay = await trpcQuery(page, "billing.getStudentBalanceSummary", { studentId });
    expect(balanceAfterPay.ok).toBe(true);
    const balanceDataAfter = balanceAfterPay.data[0].result.data.json;
    expect(balanceDataAfter.totalInvoiced).toBe(1200);
    expect(balanceDataAfter.totalPaid).toBe(1200);
    expect(balanceDataAfter.currentDebt).toBe(0);

    // 8. Verify status in UI table
    await page.goto("http://localhost:3002/dashboard/invoices");
    await expect(page.getByRole("heading", { name: /Registru Factur/i })).toBeVisible({ timeout: 10000 });
    const studentRow = page.locator("tr", { hasText: studentName });
    await expect(studentRow).toBeVisible({ timeout: 10000 });
    await expect(studentRow).toContainText(/Achitat/i);
  });

  // Test 2: Enroll student with Per-Lesson -> Mark attendance as Present -> Verify per-lesson invoice is generated
  test("Test 2: Enroll student with Per-Lesson -> Mark attendance as Present -> Verify per-lesson invoice generated", async ({
    page,
  }) => {
    // 1. Log in as School Admin
    await loginAs(page, "admin@vibe.md", "admin123");

    // 2. Create student for Per-Lesson test
    const timestamp = Date.now();
    const studentName = `Student PerLesson ${timestamp}`;
    const createStudentRes = await trpcMutate(page, "student.create", {
      name: studentName,
      phone: "+37369222333",
      parentName: "Parent PerLesson",
      parentPhone: "+37369444555",
      age: 11,
    });
    expect(createStudentRes.ok).toBe(true);
    const studentId = createStudentRes.data[0].result.data.json.id;

    // 3. Enroll student in group 1 with Per-Lesson (customPrice 175)
    const enrollRes = await trpcMutate(page, "enrollment.enrollStudent", {
      studentId,
      groupIds: [1],
      billingType: "per_lesson",
      customPrice: 175,
    });
    expect(enrollRes.ok).toBe(true);

    // 4. Mark attendance as Present
    const markRes = await trpcMutate(page, "attendance.quickMark", {
      groupId: 1,
      studentId,
      date: "2026-11-04",
      status: "present",
      comment: "Prezent la lecție practică",
    });
    expect(markRes.ok).toBe(true);

    // 5. Verify per-lesson invoice is generated
    const invoicesRes = await trpcQuery(page, "billing.getInvoices", {
      studentId,
      type: "per_lesson",
    });
    expect(invoicesRes.ok).toBe(true);
    const studentInvoices = invoicesRes.data[0].result.data.json;
    expect(studentInvoices.length).toBeGreaterThanOrEqual(1);

    const perLessonInvoice = studentInvoices[0];
    expect(perLessonInvoice.totalAmount).toBe(175);
    expect(perLessonInvoice.type).toBe("per_lesson");

    // Verify invoice items link to attendance record
    const invoiceDetailRes = await trpcQuery(page, "billing.getInvoiceById", {
      id: perLessonInvoice.id,
    });
    expect(invoiceDetailRes.ok).toBe(true);
    const invoiceDetail = invoiceDetailRes.data[0].result.data.json;
    expect(invoiceDetail.items).toHaveLength(1);
    expect(invoiceDetail.items[0].unitPrice).toBe(175);
    expect(invoiceDetail.items[0].description).toContain("2026-11-04");

    // Verify in UI
    await page.goto("http://localhost:3002/dashboard/invoices");
    const studentRow = page.locator("tr", { hasText: studentName });
    await expect(studentRow).toBeVisible({ timeout: 10000 });
    await expect(studentRow).toContainText(/Per lec[țt]ie/i);
  });

  // Test 3: Issue situational invoice with custom line items -> Record partial payment -> Verify status transitions to partially_paid
  test("Test 3: Issue situational invoice with custom line items -> Record partial payment -> status partially_paid", async ({
    page,
  }) => {
    // 1. Log in as School Admin
    await loginAs(page, "admin@vibe.md", "admin123");

    // 2. Create student for Situational test
    const timestamp = Date.now();
    const studentName = `Student Situational ${timestamp}`;
    const createStudentRes = await trpcMutate(page, "student.create", {
      name: studentName,
      phone: "+37369333444",
      parentName: "Parent Situational",
      parentPhone: "+37369555666",
      age: 12,
    });
    expect(createStudentRes.ok).toBe(true);
    const studentId = createStudentRes.data[0].result.data.json.id;

    // 3. Issue situational invoice with custom line items
    const situationalRes = await trpcMutate(page, "billing.createSituationalInvoice", {
      studentId,
      title: "Examen Robotică și Ghid Practic",
      category: "exam",
      status: "issued",
      dueDate: "2026-11-20",
      items: [
        { description: "Taxă examinare certificare", quantity: 1, unitPrice: 350 },
        { description: "Kit componente suplimentare", quantity: 1, unitPrice: 250 },
      ],
    });
    expect(situationalRes.ok).toBe(true);
    const createdInvoice = situationalRes.data[0].result.data.json;
    expect(createdInvoice.totalAmount).toBe(600);
    expect(createdInvoice.status).toBe("issued");
    expect(createdInvoice.type).toBe("situational");
    expect(createdInvoice.items).toHaveLength(2);

    // 4. Record partial payment (200 out of 600)
    const paymentRes = await trpcMutate(page, "billing.recordPayment", {
      invoiceId: createdInvoice.id,
      amount: 200,
      paymentDate: "2026-11-06",
      method: "cash",
      notes: "Avans parțial examen",
    });
    expect(paymentRes.ok).toBe(true);

    // 5. Verify status transitions to partially_paid
    const updatedInvoice = paymentRes.data[0].result.data.json.invoice;
    expect(updatedInvoice.status).toBe("partially_paid");
    expect(updatedInvoice.paidAmount).toBe(200);

    const fetchDetailRes = await trpcQuery(page, "billing.getInvoiceById", {
      id: createdInvoice.id,
    });
    expect(fetchDetailRes.ok).toBe(true);
    const detailedInvoice = fetchDetailRes.data[0].result.data.json;
    expect(detailedInvoice.status).toBe("partially_paid");
    expect(detailedInvoice.paidAmount).toBe(200);
    expect(detailedInvoice.totalAmount).toBe(600);

    // Verify in UI
    await page.goto("http://localhost:3002/dashboard/invoices");
    const studentRow = page.locator("tr", { hasText: studentName });
    await expect(studentRow).toBeVisible({ timeout: 10000 });
    await expect(studentRow).toContainText(/Parțial/i);
  });

  // Test 4: Verify non-admin / teacher account cannot view /dashboard/invoices or query billing tRPC procedures
  test("Test 4: Non-admin / teacher account cannot view /dashboard/invoices or query billing tRPC procedures", async ({
    page,
  }) => {
    // 1. Log in as Teacher
    await loginAs(page, "teacher@vibe.md", "teacher123");

    // 2. Navigate to /dashboard/invoices and verify access restricted
    await page.goto("http://localhost:3002/dashboard/invoices");
    const accessDenied = page.locator('[data-testid="access-denied"]');
    await expect(accessDenied).toBeVisible({ timeout: 10000 });
    await expect(accessDenied).toContainText("Acces Restricționat");

    // Verify that table headers or student records are NOT exposed to teacher
    await expect(page.locator("th:has-text('Nr. Factură')")).not.toBeVisible();

    // 3. Verify teacher cannot query billing tRPC procedures
    const getInvoicesRes = await trpcQuery(page, "billing.getInvoices");
    expect(getInvoicesRes.data[0].error).toBeDefined();
    expect(getInvoicesRes.data[0].error.json.data.code).toBe("FORBIDDEN");

    const getBalanceRes = await trpcQuery(page, "billing.getStudentBalanceSummary", { studentId: 1 });
    expect(getBalanceRes.data[0].error).toBeDefined();
    expect(getBalanceRes.data[0].error.json.data.code).toBe("FORBIDDEN");

    // 4. Verify teacher cannot mutate billing records
    const createInvoiceRes = await trpcMutate(page, "billing.createInvoice", {
      studentId: 1,
      type: "situational",
      items: [{ description: "Test", quantity: 1, unitPrice: 100 }],
    });
    expect(createInvoiceRes.data[0].error).toBeDefined();
    expect(createInvoiceRes.data[0].error.json.data.code).toBe("FORBIDDEN");

    const recordPaymentRes = await trpcMutate(page, "billing.recordPayment", {
      invoiceId: 1,
      amount: 100,
      paymentDate: "2026-11-01",
      method: "cash",
    });
    expect(recordPaymentRes.data[0].error).toBeDefined();
    expect(recordPaymentRes.data[0].error.json.data.code).toBe("FORBIDDEN");
  });
});
