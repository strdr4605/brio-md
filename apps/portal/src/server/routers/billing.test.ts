import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { billingRouter } from "./billing";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("billingRouter - Invoices CRUD & Student Balance Calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const superUser = {
    id: "1",
    email: "super@example.com",
    name: "Super Admin",
    role: "superadmin",
    permissions: ["super"],
    courseIds: [],
    schoolId: null,
  };

  const school1Admin = {
    id: "2",
    email: "admin1@example.com",
    name: "Admin School 1",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  };

  const school2Admin = {
    id: "3",
    email: "admin2@example.com",
    name: "Admin School 2",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 2,
  };

  const sampleStudentSchool1 = {
    id: 10,
    name: "Alex Popescu",
    phone: "+37369000001",
    parentName: "Maria Popescu",
    parentPhone: "+37360000000",
    age: 14,
    schoolId: 1,
  };

  const sampleStudentSchool2 = {
    id: 20,
    name: "Dan Nistor",
    phone: "+37369000002",
    parentName: "Elena Nistor",
    parentPhone: "+37360000002",
    age: 12,
    schoolId: 2,
  };

  describe("billing.getInvoices", () => {
    it("scopes invoices to user's schoolId for non-superadmin", async () => {
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([
          {
            id: 1,
            invoiceNumber: "INV-2026-0001",
            schoolId: 1,
            studentId: 10,
            studentName: "Alex Popescu",
            totalAmount: 1200,
            paidAmount: 0,
            status: "issued",
          },
        ]),
      };
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.getInvoices({ limit: 10, offset: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe("INV-2026-0001");
      expect(result[0].schoolId).toBe(1);
    });

    it("allows superadmin to query without school restriction or with specific schoolId", async () => {
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([
          { id: 1, invoiceNumber: "INV-1", schoolId: 1 },
          { id: 2, invoiceNumber: "INV-2", schoolId: 2 },
        ]),
      };
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: superUser });
      const result = await caller.getInvoices({});

      expect(result).toHaveLength(2);
    });
  });

  describe("billing.getStudentBalanceSummary", () => {
    it("correctly computes balance, debt, and overdue counts across invoice types", async () => {
      // 1. Mock student lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool1]),
          }),
        }),
      });

      // 2. Mock invoices for student 10
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: "issued", totalAmount: 1000, paidAmount: 0, dueDate: "2099-01-01" },
            { id: 2, status: "partially_paid", totalAmount: 2000, paidAmount: 500, dueDate: "2099-01-01" },
            { id: 3, status: "overdue", totalAmount: 1500, paidAmount: 0, dueDate: "2020-01-01" },
            { id: 4, status: "paid", totalAmount: 800, paidAmount: 800, dueDate: "2020-01-01" },
            { id: 5, status: "draft", totalAmount: 500, paidAmount: 0, dueDate: "2099-01-01" },
          ]),
        }),
      });

      // 3. Mock payments for student 10
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { amount: 500 },
            { amount: 800 },
          ]),
        }),
      });

      // 4. Mock active billing plans (enrollments)
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              enrollmentId: 101,
              groupId: 1,
              groupName: "English A1",
              courseId: 1,
              courseName: "English Course",
              billingType: "subscription_monthly",
              customPrice: 1200,
              discountPercent: 10,
              status: "active",
            },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const summary = await caller.getStudentBalanceSummary({ studentId: 10 });

      expect(summary.studentId).toBe(10);
      expect(summary.studentName).toBe("Alex Popescu");
      // totalInvoiced: issued(1000) + partially_paid(2000) + overdue(1500) + paid(800) = 5300 (draft 500 excluded)
      expect(summary.totalInvoiced).toBe(5300);
      // totalPaid: 500 + 800 = 1300
      expect(summary.totalPaid).toBe(1300);
      // currentDebt: 5300 - 1300 = 4000
      expect(summary.currentDebt).toBe(4000);
      // overdueCount: only overdue(1500 with date 2020-01-01) is overdue (paid is excluded)
      expect(summary.overdueCount).toBe(1);
      // active billing plans
      expect(summary.activeBillingPlans).toHaveLength(1);
      expect(summary.activeBillingPlans[0].billingType).toBe("subscription_monthly");
      expect(summary.activeBillingPlans[0].customPrice).toBe(1200);
    });

    it("prevents admin from querying student balance from another school", async () => {
      // Mock student from school 1
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool1]),
          }),
        }),
      });

      // Admin from school 2 tries to access student in school 1
      const caller = billingRouter.createCaller({ user: school2Admin });
      await expect(caller.getStudentBalanceSummary({ studentId: 10 })).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("billing.getInvoiceById", () => {
    it("returns invoice details with items, student, group, and payment records", async () => {
      // 1. Mock invoice lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                invoiceNumber: "INV-2026-0001",
                schoolId: 1,
                studentId: 10,
                groupId: 5,
                totalAmount: 1500,
                paidAmount: 500,
                status: "partially_paid",
              },
            ]),
          }),
        }),
      });

      // 2. Mock student lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool1]),
          }),
        }),
      });

      // 3. Mock group lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 5, name: "Robotics Cohort", courseId: 2, courseName: "Robotics" },
            ]),
          }),
        }),
      });

      // 4. Mock invoice line items
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 1, description: "Monthly Course Fee", quantity: 1, unitPrice: 1500, amount: 1500 },
          ]),
        }),
      });

      // 5. Mock payments
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { id: 1, invoiceId: 1, amount: 500, paymentDate: "2026-09-20", method: "cash" },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const invoice = await caller.getInvoiceById({ id: 1 });

      expect(invoice.id).toBe(1);
      expect(invoice.student?.name).toBe("Alex Popescu");
      expect(invoice.group?.name).toBe("Robotics Cohort");
      expect(invoice.items).toHaveLength(1);
      expect(invoice.payments).toHaveLength(1);
      expect(invoice.payments[0].amount).toBe(500);
    });

    it("rejects cross-school invoice access with FORBIDDEN", async () => {
      // Mock invoice from school 2
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 99, invoiceNumber: "INV-99", schoolId: 2, studentId: 20 },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(caller.getInvoiceById({ id: 99 })).rejects.toThrow(TRPCError);
    });
  });

  describe("billing.createInvoice", () => {
    it("creates invoice and line items with computed totalAmount", async () => {
      // 1. Mock student lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool1]),
          }),
        }),
      });

      // 2. Mock invoice insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 50,
              invoiceNumber: "INV-2026-TEST",
              schoolId: 1,
              studentId: 10,
              totalAmount: 1800,
              paidAmount: 0,
              status: "draft",
            },
          ]),
        }),
      });

      // 3. Mock items insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 50, description: "Item 1", quantity: 2, unitPrice: 500, amount: 1000 },
            { id: 2, invoiceId: 50, description: "Item 2", quantity: 1, unitPrice: 800, amount: 800 },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.createInvoice({
        studentId: 10,
        type: "subscription",
        status: "draft",
        items: [
          { description: "Item 1", quantity: 2, unitPrice: 500 },
          { description: "Item 2", quantity: 1, unitPrice: 800 },
        ],
      });

      expect(result.id).toBe(50);
      expect(result.items).toHaveLength(2);
    });

    it("prevents creating invoice for student in another school", async () => {
      // Mock student from school 2
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool2]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createInvoice({
          studentId: 20,
          type: "subscription",
          items: [{ description: "Lesson", quantity: 1, unitPrice: 200 }],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("billing.recordPayment", () => {
    it("records payment and updates invoice paidAmount and status", async () => {
      // 1. Mock invoice lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                invoiceNumber: "INV-1",
                schoolId: 1,
                studentId: 10,
                totalAmount: 1000,
                paidAmount: 0,
                status: "issued",
              },
            ]),
          }),
        }),
      });

      // 2. Mock payment insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 7,
              invoiceId: 1,
              amount: 1000,
              paymentDate: "2026-09-21",
              method: "card",
            },
          ]),
        }),
      });

      // 3. Mock invoice update
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                paidAmount: 1000,
                status: "paid",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.recordPayment({
        invoiceId: 1,
        amount: 1000,
        paymentDate: "2026-09-21",
        method: "card",
      });

      expect(result.payment.amount).toBe(1000);
      expect(result.invoice.status).toBe("paid");
    });
  });
});
