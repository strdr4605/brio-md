import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { billingRouter } from "./billing";

vi.mock("@/lib/db", () => {
  const mockDb: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  mockDb.transaction = vi.fn(async (cb: any) => cb(mockDb));
  return { db: mockDb };
});

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

function createQueryChain(resolvedValue: any) {
  const promise = Promise.resolve(resolvedValue);
  const chain: any = Object.assign(promise, {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolvedValue),
    offset: vi.fn().mockResolvedValue(resolvedValue),
  });
  return chain;
}

const teacherUser = {
  id: "4",
  email: "teacher@example.com",
  name: "Teacher User",
  role: "teacher",
  permissions: ["teach"],
  courseIds: [1],
  schoolId: 1,
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

  describe("billing.updateInvoiceStatus", () => {
    it("updates invoice status and notes for authorized admin", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          { id: 1, schoolId: 1, status: "issued", paidAmount: 0, totalAmount: 1000, notes: null },
        ]),
      );
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              { id: 1, status: "overdue", notes: "Plată întârziată" },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.updateInvoiceStatus({
        id: 1,
        status: "overdue",
        notes: "Plată întârziată",
      });

      expect(result.status).toBe("overdue");
      expect(result.notes).toBe("Plată întârziată");
    });

    it("rejects setting status to cancelled via updateInvoiceStatus", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          { id: 1, schoolId: 1, status: "issued", paidAmount: 0, totalAmount: 1000 },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 1,
          status: "cancelled",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects setting status to paid if invoice has not been fully paid", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          { id: 1, schoolId: 1, status: "partially_paid", paidAmount: 500, totalAmount: 1000 },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 1,
          status: "paid",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects status update for cross-school invoice", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          { id: 1, schoolId: 2, status: "issued", paidAmount: 0, totalAmount: 1000 },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 1,
          status: "overdue",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("billing.recordPayment", () => {
    it("records payment and updates invoice paidAmount and status to paid for exact full payment", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
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
      );

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

      expect(db.transaction).toHaveBeenCalled();
      expect(result.payment.amount).toBe(1000);
      expect(result.invoice.status).toBe("paid");
    });

    it("correctly transitions invoice to partially_paid on partial installment", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1500,
            paidAmount: 0,
            status: "issued",
          },
        ]),
      );

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 8,
              invoiceId: 1,
              amount: 500,
              paymentDate: "2026-09-21",
              method: "cash",
            },
          ]),
        }),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                paidAmount: 500,
                status: "partially_paid",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.recordPayment({
        invoiceId: 1,
        amount: 500,
        paymentDate: "2026-09-21",
        method: "cash",
      });

      expect(result.payment.amount).toBe(500);
      expect(result.invoice.status).toBe("partially_paid");
    });

    it("correctly transitions invoice from partially_paid to paid on final installment", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1500,
            paidAmount: 500,
            status: "partially_paid",
          },
        ]),
      );

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 9,
              invoiceId: 1,
              amount: 1000,
              paymentDate: "2026-09-22",
              method: "bank_transfer",
            },
          ]),
        }),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                paidAmount: 1500,
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
        paymentDate: "2026-09-22",
        method: "bank_transfer",
      });

      expect(result.invoice.paidAmount).toBe(1500);
      expect(result.invoice.status).toBe("paid");
    });

    it("enforces overpayment safeguard when payment exceeds remaining debt", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1000,
            paidAmount: 600,
            status: "partially_paid",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-09-21",
          method: "cash",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects payment on draft invoice", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1000,
            paidAmount: 0,
            status: "draft",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-09-21",
          method: "cash",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects payment on already fully paid invoice", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1000,
            paidAmount: 1000,
            status: "paid",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 100,
          paymentDate: "2026-09-21",
          method: "card",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects payment on cancelled invoice", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            invoiceNumber: "INV-1",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1000,
            paidAmount: 0,
            status: "cancelled",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-09-21",
          method: "cash",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects payment for invoice from another school with FORBIDDEN", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 99,
            invoiceNumber: "INV-99",
            schoolId: 2,
            studentId: 20,
            totalAmount: 1000,
            paidAmount: 0,
            status: "issued",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 99,
          amount: 500,
          paymentDate: "2026-09-21",
          method: "cash",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("billing.voidPayment", () => {
    it("voids a payment, deletes record, decrements paidAmount, and recalibrates status", async () => {
      // 1. Mock payment lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 15,
            invoiceId: 1,
            studentId: 10,
            schoolId: 1,
            amount: 500,
            paymentDate: "2026-09-21",
            method: "cash",
          },
        ]),
      );

      // 2. Mock invoice lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 1,
            schoolId: 1,
            totalAmount: 1000,
            paidAmount: 1000,
            status: "paid",
            dueDate: "2099-01-01",
            notes: null,
          },
        ]),
      );

      // 3. Mock delete
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(true),
      });

      // 4. Mock invoice update
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                paidAmount: 500,
                status: "partially_paid",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.voidPayment({
        paymentId: 15,
        reason: "Introducere greșită de sumă",
      });

      expect(result.success).toBe(true);
      expect(result.voidedPaymentId).toBe(15);
      expect(result.voidedAmount).toBe(500);
      expect(result.invoice.status).toBe("partially_paid");
    });

    it("recalibrates status to issued when all payments are voided and dueDate is future", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 16,
            invoiceId: 2,
            studentId: 10,
            schoolId: 1,
            amount: 500,
          },
        ]),
      );

      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 2,
            schoolId: 1,
            totalAmount: 1000,
            paidAmount: 500,
            status: "partially_paid",
            dueDate: "2099-01-01",
          },
        ]),
      );

      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(true),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 2,
                paidAmount: 0,
                status: "issued",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.voidPayment({
        paymentId: 16,
        reason: "Anulare plată greșită",
      });

      expect(result.success).toBe(true);
      expect(result.invoice.paidAmount).toBe(0);
      expect(result.invoice.status).toBe("issued");
    });

    it("recalibrates status to overdue when all payments are voided and dueDate has passed", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 17,
            invoiceId: 3,
            studentId: 10,
            schoolId: 1,
            amount: 500,
          },
        ]),
      );

      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 3,
            schoolId: 1,
            totalAmount: 1000,
            paidAmount: 500,
            status: "partially_paid",
            dueDate: "2020-01-01",
          },
        ]),
      );

      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(true),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 3,
                paidAmount: 0,
                status: "overdue",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.voidPayment({
        paymentId: 17,
        reason: "Anulare plată pe factură restantă",
      });

      expect(result.success).toBe(true);
      expect(result.invoice.status).toBe("overdue");
    });

    it("rejects voiding payment without mandatory reason", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.voidPayment({
          paymentId: 16,
          reason: "",
        }),
      ).rejects.toThrow();
    });

    it("rejects voiding payment from another school with FORBIDDEN", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 99,
            invoiceId: 99,
            schoolId: 2,
            amount: 500,
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.voidPayment({
          paymentId: 99,
          reason: "Anulare",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects voiding non-existent payment with NOT_FOUND", async () => {
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.voidPayment({
          paymentId: 999,
          reason: "Anulare",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("billing.cancelInvoice", () => {
    it("cancels an unpaid invoice and records the reason in notes", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 5,
            invoiceNumber: "INV-5",
            schoolId: 1,
            studentId: 10,
            totalAmount: 1200,
            paidAmount: 0,
            status: "issued",
            notes: "Initial note",
          },
        ]),
      );

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 5,
                status: "cancelled",
                notes: "Initial note\n[Anulată de user #2: Studentul a renunțat la curs]",
              },
            ]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.cancelInvoice({
        id: 5,
        reason: "Studentul a renunțat la curs",
      });

      expect(result.status).toBe("cancelled");
      expect(result.notes).toContain("Studentul a renunțat la curs");
    });

    it("rejects cancelling invoice if it has paidAmount > 0", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 6,
            schoolId: 1,
            totalAmount: 1200,
            paidAmount: 400,
            status: "partially_paid",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.cancelInvoice({
          id: 6,
          reason: "Anulare eronată",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects cancelling invoice if it is already cancelled", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 7,
            schoolId: 1,
            totalAmount: 1200,
            paidAmount: 0,
            status: "cancelled",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.cancelInvoice({
          id: 7,
          reason: "Re-anulare",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects cancelling invoice without reason", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.cancelInvoice({
          id: 8,
          reason: "",
        }),
      ).rejects.toThrow();
    });

    it("rejects cross-school invoice cancellation with FORBIDDEN", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 9,
            schoolId: 2,
            totalAmount: 1000,
            paidAmount: 0,
            status: "issued",
          },
        ]),
      );

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.cancelInvoice({
          id: 9,
          reason: "Încercare neautorizată",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("billing RBAC authorization", () => {
    it("rejects non-admin users (e.g. teacher) from billing endpoints with FORBIDDEN", async () => {
      const caller = billingRouter.createCaller({ user: teacherUser });

      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-09-21",
          method: "cash",
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.cancelInvoice({
          id: 1,
          reason: "Anulare neautorizată",
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.voidPayment({
          paymentId: 1,
          reason: "Anulare neautorizată",
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.updateInvoiceStatus({
          id: 1,
          status: "issued",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
