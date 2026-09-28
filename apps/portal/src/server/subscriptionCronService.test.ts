import { describe, it, expect, vi, beforeEach } from "vitest";
import { runMonthlySubscriptionCheck } from "./subscriptionCronService";

describe("subscriptionCronService - runMonthlySubscriptionCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEnrollments = [
    {
      enrollmentId: 1,
      studentId: 101,
      studentName: "Alexandru Popa",
      schoolId: 1,
      groupId: 10,
      groupName: "Robotica A",
      courseId: 5,
      courseName: "Robotica Lego",
      billingType: "subscription_monthly",
      customPrice: 1200,
      discountPercent: 10, // finalPrice: 1080
    },
    {
      enrollmentId: 2,
      studentId: 102,
      studentName: "Elena Vangheli",
      schoolId: 1,
      groupId: 10,
      groupName: "Robotica A",
      courseId: 5,
      courseName: "Robotica Lego",
      billingType: "subscription_monthly",
      customPrice: null,
      discountPercent: 0, // finalPrice: 0 (default rate)
    },
    {
      enrollmentId: 3,
      studentId: 103,
      studentName: "Mihai Eminescu",
      schoolId: 1,
      groupId: 11,
      groupName: "Python Dev",
      courseId: 6,
      courseName: "Python Junior",
      billingType: "subscription_monthly",
      customPrice: 1500,
      discountPercent: 0, // finalPrice: 1500
    },
  ];

  it("marks issued invoices whose dueDate has passed as overdue", async () => {
    const mockInvoices = [
      {
        id: 501,
        schoolId: 1,
        studentId: 101,
        groupId: 10,
        enrollmentId: 1,
        invoiceNumber: "INV-2026-09-001",
        status: "issued",
        totalAmount: 1080,
        paidAmount: 0,
        dueDate: "2026-09-10", // past date
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        groupCourseId: 5,
      },
    ];

    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 501 }]),
    });

    const mockDb: any = {
      select: vi
        .fn()
        // 1st select: active enrollments
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([mockEnrollments[0]]),
                }),
              }),
            }),
          }),
        })
        // 2nd select: existing invoices
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockInvoices),
            }),
          }),
        }),
      update: vi.fn().mockReturnValue({
        set: updateSet,
      }),
    };

    const res = await runMonthlySubscriptionCheck(mockDb, {
      targetMonth: "2026-09",
      schoolId: 1,
      markOverdue: true,
      autoCreateMissing: false,
    });

    expect(res.success).toBe(true);
    expect(res.summary.invoicesMarkedOverdue).toBe(1);
    expect(res.markedOverdueInvoiceIds).toContain(501);
    expect(res.summary.overdueCount).toBe(1);
    expect(mockDb.update).toHaveBeenCalled();
    expect(updateSet).toHaveBeenCalledWith({ status: "overdue" });
  });

  it("detects subscriptions with missing invoices for the month", async () => {
    const mockInvoices = [
      {
        id: 501,
        schoolId: 1,
        studentId: 101,
        groupId: 10,
        enrollmentId: 1,
        invoiceNumber: "INV-2026-09-001",
        status: "paid",
        totalAmount: 1080,
        paidAmount: 1080,
        dueDate: "2026-09-10",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        groupCourseId: 5,
      },
    ];

    const mockDb: any = {
      select: vi
        .fn()
        // 2 enrollments returned
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([mockEnrollments[0], mockEnrollments[1]]),
                }),
              }),
            }),
          }),
        })
        // only 1 invoice exists for student 101
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockInvoices),
            }),
          }),
        }),
    };

    const res = await runMonthlySubscriptionCheck(mockDb, {
      targetMonth: "2026-09",
      schoolId: 1,
      markOverdue: true,
      autoCreateMissing: false,
    });

    expect(res.summary.totalActiveSubscriptions).toBe(2);
    expect(res.summary.upToDateCount).toBe(1);
    expect(res.summary.missingInvoiceCount).toBe(1);

    const missingStudent = res.students.find((s) => s.studentId === 102);
    expect(missingStudent).toBeDefined();
    expect(missingStudent?.hasInvoice).toBe(false);
    expect(missingStudent?.invoiceStatus).toBe("no_invoice");
  });

  it("accurately calculates collected revenue and remaining debt", async () => {
    const mockInvoices = [
      {
        id: 501,
        schoolId: 1,
        studentId: 101,
        groupId: 10,
        enrollmentId: 1,
        invoiceNumber: "INV-2026-09-001",
        status: "paid",
        totalAmount: 1000,
        paidAmount: 1000,
        dueDate: "2026-09-10",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        groupCourseId: 5,
      },
      {
        id: 503,
        schoolId: 1,
        studentId: 103,
        groupId: 11,
        enrollmentId: 3,
        invoiceNumber: "INV-2026-09-003",
        status: "partially_paid",
        totalAmount: 1500,
        paidAmount: 500,
        dueDate: "2099-10-15", // future
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        groupCourseId: 6,
      },
    ];

    const mockDb: any = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([mockEnrollments[0], mockEnrollments[2]]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockInvoices),
            }),
          }),
        }),
    };

    const res = await runMonthlySubscriptionCheck(mockDb, {
      targetMonth: "2026-09",
      schoolId: 1,
      markOverdue: false,
    });

    expect(res.summary.upToDateCount).toBe(1);
    expect(res.summary.partiallyPaidCount).toBe(1);
    expect(res.summary.totalBilledAmount).toBe(2500);
    expect(res.summary.totalCollectedAmount).toBe(1500);
    expect(res.summary.totalOutstandingDebt).toBe(1000);
  });
});
