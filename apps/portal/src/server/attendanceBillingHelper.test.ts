import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachBillingInfoToStudents } from "./attendanceBillingHelper";

describe("attendanceBillingHelper - attachBillingInfoToStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStudents = [
    {
      studentId: 101,
      studentName: "Ion Creangă",
      enrollmentId: 1,
      billingType: "subscription_monthly",
      customPrice: 1000,
      discountPercent: 10,
    },
    {
      studentId: 102,
      studentName: "Mihai Eminescu",
      enrollmentId: 2,
      billingType: "subscription_monthly",
      customPrice: null,
      discountPercent: 0,
    },
    {
      studentId: 103,
      studentName: "Vasile Alecsandri",
      enrollmentId: 3,
      billingType: "per_lesson",
      customPrice: 150,
      discountPercent: 0,
    },
  ];

  it("accurately handles paid monthly subscription", async () => {
    const mockInvoices = [
      {
        id: 1,
        studentId: 101,
        groupId: 10,
        enrollmentId: 1,
        invoiceNumber: "INV-2026-0001",
        type: "subscription",
        status: "paid",
        totalAmount: 900,
        paidAmount: 900,
        dueDate: "2026-09-10",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockInvoices),
        }),
      }),
    };

    const result = await attachBillingInfoToStudents(
      mockDb,
      [mockStudents[0]],
      1,
      "2026-09",
      10,
      1200,
    );

    expect(result).toHaveLength(1);
    const billing = result[0].billing;
    expect(billing.billingType).toBe("subscription_monthly");
    expect(billing.finalPrice).toBe(900); // 1000 with 10% discount
    expect(billing.currentMonthStatus).toBe("paid");
    expect(billing.hasDebt).toBe(false);
    expect(billing.debtAmount).toBe(0);
    expect(billing.isOverdue).toBe(false);
  });

  it("flags student in red (hasDebt = true) when current month invoice is overdue", async () => {
    const mockInvoices = [
      {
        id: 2,
        studentId: 102,
        groupId: 10,
        enrollmentId: 2,
        invoiceNumber: "INV-2026-0002",
        type: "subscription",
        status: "overdue",
        totalAmount: 1200,
        paidAmount: 0,
        dueDate: "2026-09-05",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockInvoices),
        }),
      }),
    };

    const result = await attachBillingInfoToStudents(
      mockDb,
      [mockStudents[1]],
      1,
      "2026-09",
      10,
      1200,
    );

    expect(result).toHaveLength(1);
    const billing = result[0].billing;
    expect(billing.currentMonthStatus).toBe("unpaid");
    expect(billing.hasDebt).toBe(true);
    expect(billing.isOverdue).toBe(true);
    expect(billing.debtAmount).toBe(1200);
    expect(billing.overdueCount).toBe(1);
  });

  it("handles per_lesson student with past unpaid invoices", async () => {
    const mockInvoices = [
      {
        id: 3,
        studentId: 103,
        groupId: 10,
        enrollmentId: 3,
        invoiceNumber: "INV-2026-0003",
        type: "per_lesson",
        status: "issued",
        totalAmount: 300,
        paidAmount: 0,
        dueDate: "2026-09-20",
        periodStart: null,
        periodEnd: null,
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockInvoices),
        }),
      }),
    };

    const result = await attachBillingInfoToStudents(
      mockDb,
      [mockStudents[2]],
      1,
      "2026-09",
      10,
    );

    expect(result).toHaveLength(1);
    const billing = result[0].billing;
    expect(billing.billingType).toBe("per_lesson");
    expect(billing.hasDebt).toBe(true);
    expect(billing.debtAmount).toBe(300);
  });

  it("identifies students with no invoice yet for the current month", async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    const result = await attachBillingInfoToStudents(
      mockDb,
      [mockStudents[1]],
      1,
      "2026-09",
      10,
      1200,
    );

    expect(result).toHaveLength(1);
    const billing = result[0].billing;
    expect(billing.currentMonthStatus).toBe("no_invoice");
    expect(billing.debtAmount).toBe(0);
    expect(billing.hasDebt).toBe(false);
  });

  it("returns empty array when student list is empty", async () => {
    const mockDb: any = { select: vi.fn() };
    const result = await attachBillingInfoToStudents(mockDb, [], 1, "2026-09");
    expect(result).toEqual([]);
    expect(mockDb.select).not.toHaveBeenCalled();
  });
});
