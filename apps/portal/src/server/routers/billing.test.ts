import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { billingRouter } from "./billing";
import { processAttendanceBilling } from "../billingService";

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
    limit: vi.fn().mockReturnThis(),
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

  describe("billing.createSituationalInvoice", () => {
    it("creates situational invoice with custom line items and INV-YYYY-XXXX format", async () => {
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
        values: vi.fn().mockImplementation((val: any) => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 60,
              invoiceNumber: val.invoiceNumber,
              schoolId: 1,
              studentId: 10,
              type: "situational",
              totalAmount: val.totalAmount,
              paidAmount: 0,
              status: val.status,
              notes: val.notes,
            },
          ]),
        })),
      });

      // 3. Mock items insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 60, description: "Set componente", quantity: 1, unitPrice: 350, amount: 350 },
            { id: 2, invoiceId: 60, description: "Manual curs", quantity: 2, unitPrice: 75, amount: 150 },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const currentYear = new Date().getFullYear();
      const result = await caller.createSituationalInvoice({
        studentId: 10,
        title: "Kit Robotică & Manual",
        category: "materials",
        dueDate: "2026-10-15",
        notes: "Predat la sala 3",
        status: "issued",
        items: [
          { description: "Set componente", quantity: 1, unitPrice: 350 },
          { description: "Manual curs", quantity: 2, unitPrice: 75 },
        ],
      });

      expect(result.id).toBe(60);
      expect(result.totalAmount).toBe(500);
      expect(result.invoiceNumber).toMatch(new RegExp(`^INV-${currentYear}-`));
      expect(result.type).toBe("situational");
      expect(result.status).toBe("issued");
      expect(result.items).toHaveLength(2);
    });

    it("creates situational invoice from top-level amount and category title", async () => {
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
        values: vi.fn().mockImplementation((val: any) => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 61,
              invoiceNumber: val.invoiceNumber,
              schoolId: 1,
              studentId: 10,
              type: "situational",
              totalAmount: val.totalAmount,
              paidAmount: 0,
              status: "draft",
              notes: val.notes,
            },
          ]),
        })),
      });

      // 3. Mock items insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 61, description: "Taxă examen Cambridge", quantity: 1, unitPrice: 850, amount: 850 },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.createSituationalInvoice({
        studentId: 10,
        title: "Taxă examen Cambridge",
        category: "exam_fee",
        amount: 850,
      });

      expect(result.id).toBe(61);
      expect(result.totalAmount).toBe(850);
      expect(result.items[0].description).toBe("Taxă examen Cambridge");
    });

    it("allows superadmin to create situational invoice for any school by passing schoolId", async () => {
      // 1. Mock student lookup (student in school 2)
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([sampleStudentSchool2]),
          }),
        }),
      });

      // 2. Mock invoice insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockImplementation((val: any) => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 62,
              invoiceNumber: val.invoiceNumber,
              schoolId: val.schoolId,
              studentId: 20,
              type: "situational",
              totalAmount: 100,
              paidAmount: 0,
              status: "draft",
            },
          ]),
        })),
      });

      // 3. Mock items insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 62, description: "Ajustare sold", quantity: 1, unitPrice: 100, amount: 100 },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: superUser });
      const result = await caller.createSituationalInvoice({
        studentId: 20,
        schoolId: 2,
        title: "Ajustare sold",
        category: "adjustment",
        amount: 100,
      });

      expect(result.id).toBe(62);
      expect(result.schoolId).toBe(2);
      expect(result.totalAmount).toBe(100);
    });

    it("fails when student does not exist", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createSituationalInvoice({
          studentId: 999,
          title: "Manuale",
          category: "materials",
          amount: 100,
        }),
      ).rejects.toThrow("Studentul nu a fost găsit");
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
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 15 }]),
        }),
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
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 16 }]),
        }),
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
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 17 }]),
        }),
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

  describe("hardened validation & enterprise invariants", () => {
    it("rejects initial status 'paid' or 'partially_paid' in createInvoice", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createInvoice({
          studentId: 10,
          type: "subscription",
          status: "paid" as any,
          items: [{ description: "Lecție", quantity: 1, unitPrice: 100 }],
        }),
      ).rejects.toThrow();

      await expect(
        caller.createInvoice({
          studentId: 10,
          type: "subscription",
          status: "partially_paid" as any,
          items: [{ description: "Lecție", quantity: 1, unitPrice: 100 }],
        }),
      ).rejects.toThrow();
    });

    it("rejects createInvoice when total exceeds 2,000,000,000 to prevent int32 overflow", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createInvoice({
          studentId: 10,
          type: "subscription",
          items: [{ description: "Curs VIP", quantity: 25, unitPrice: 90_000_000 }],
        }),
      ).rejects.toThrow();
    });

    it("rejects invalid calendar dates in dateSchema (e.g. 2026-02-31, 2026-04-31)", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-02-31",
          method: "cash",
        }),
      ).rejects.toThrow();

      await expect(
        caller.recordPayment({
          invoiceId: 1,
          amount: 500,
          paymentDate: "2026-04-31",
          method: "cash",
        }),
      ).rejects.toThrow();
    });

    it("rejects cancelInvoice when neither id nor invoiceId is provided", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.cancelInvoice({
          reason: "Anulare fără ID",
        } as any),
      ).rejects.toThrow();
    });

    it("prevents resurrecting a cancelled invoice via updateInvoiceStatus", async () => {
      const mockChain = createQueryChain([
        {
          id: 10,
          schoolId: 1,
          status: "cancelled",
          paidAmount: 0,
          totalAmount: 1000,
        },
      ]);
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 10,
          status: "issued",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("prevents setting status 'partially_paid' when paidAmount is 0", async () => {
      const mockChain = createQueryChain([
        {
          id: 11,
          schoolId: 1,
          status: "issued",
          paidAmount: 0,
          totalAmount: 1000,
        },
      ]);
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 11,
          status: "partially_paid",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("prevents demoting a fully paid invoice to issued, draft, or overdue", async () => {
      const mockChain = createQueryChain([
        {
          id: 12,
          schoolId: 1,
          status: "paid",
          paidAmount: 1000,
          totalAmount: 1000,
        },
      ]);
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 12,
          status: "issued",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("prevents cross-student enrollment ID hijacking during invoice creation", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([sampleStudentSchool1]))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createInvoice({
          studentId: sampleStudentSchool1.id,
          enrollmentId: 999,
          type: "subscription",
          items: [{ description: "Abonament", quantity: 1, unitPrice: 500 }],
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("throws CONFLICT if payment was already deleted/voided concurrently", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([{ id: 80, invoiceId: 1, studentId: 10, schoolId: 1, amount: 500 }]))
        .mockReturnValueOnce(createQueryChain([{ id: 1, schoolId: 1, totalAmount: 1000, paidAmount: 500, status: "partially_paid" }]));
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.voidPayment({
          paymentId: 80,
          reason: "Anulare concurentă",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("prevents demoting an invoice with paidAmount > 0 to draft or issued", async () => {
      const mockChain = createQueryChain([
        {
          id: 30,
          schoolId: 1,
          status: "partially_paid",
          paidAmount: 300,
          totalAmount: 1000,
        },
      ]);
      (db.select as any).mockReturnValue(mockChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.updateInvoiceStatus({
          id: 30,
          status: "draft",
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.updateInvoiceStatus({
          id: 30,
          status: "issued",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("rejects non-positive, floating-point, and >100M payment amounts", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(caller.recordPayment({ invoiceId: 1, amount: 0, paymentDate: "2026-09-21", method: "cash" })).rejects.toThrow();
      await expect(caller.recordPayment({ invoiceId: 1, amount: -50, paymentDate: "2026-09-21", method: "cash" })).rejects.toThrow();
      await expect(caller.recordPayment({ invoiceId: 1, amount: 100_000_001, paymentDate: "2026-09-21", method: "cash" })).rejects.toThrow();
      await expect(caller.recordPayment({ invoiceId: 1, amount: 49.99 as any, paymentDate: "2026-09-21", method: "cash" })).rejects.toThrow();
    });

    it("correctly differentiates leap year Feb 29 from non-leap year Feb 29", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(caller.recordPayment({ invoiceId: 1, amount: 500, paymentDate: "2026-02-29", method: "cash" })).rejects.toThrow();

      (db.select as any).mockReturnValueOnce(createQueryChain([]));
      await expect(caller.recordPayment({ invoiceId: 1, amount: 500, paymentDate: "2028-02-29", method: "cash" })).rejects.toThrow(TRPCError);
    });

    it("rejects createInvoice when student belongs to school 1 but groupId belongs to school 2", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([sampleStudentSchool1]))
        .mockReturnValueOnce(createQueryChain([{ id: 88, schoolId: 2 }]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(
        caller.createInvoice({
          studentId: sampleStudentSchool1.id,
          groupId: 88,
          type: "subscription",
          items: [{ description: "Cross-school group", quantity: 1, unitPrice: 500 }],
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("aborts payment recording when invoice update fails inside transaction", async () => {
      const mockTx: any = {
        select: vi.fn().mockReturnValue(createQueryChain([{ id: 1, totalAmount: 1000, paidAmount: 0, status: "issued", schoolId: 1 }])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) }) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error("DB Deadlock / Disk Full")) }) }) }),
      };
      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(caller.recordPayment({ invoiceId: 1, amount: 500, paymentDate: "2026-09-21", method: "cash" })).rejects.toThrow("DB Deadlock / Disk Full");
    });
  });

  describe("billing.previewRecurringInvoices & billing.generateRecurringInvoices", () => {
    const mockEnrollments = [
      {
        enrollmentId: 101,
        studentId: 10,
        studentName: "Alex Popescu",
        groupId: 1,
        groupName: "Grupa A - Luni",
        courseId: 5,
        courseName: "Robotică",
        billingType: "subscription_monthly",
        customPrice: null,
        discountPercent: 0,
      },
      {
        enrollmentId: 102,
        studentId: 11,
        studentName: "Mihai Enache",
        groupId: 1,
        groupName: "Grupa A - Luni",
        courseId: 5,
        courseName: "Robotică",
        billingType: "subscription_monthly",
        customPrice: 1200,
        discountPercent: 0,
      },
      {
        enrollmentId: 103,
        studentId: 12,
        studentName: "Elena Rusu",
        groupId: 1,
        groupName: "Grupa A - Luni",
        courseId: 5,
        courseName: "Robotică",
        billingType: "subscription_monthly",
        customPrice: 1500,
        discountPercent: 20,
      },
    ];

    it("previews recurring invoices and calculates custom pricing and discounts accurately", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockEnrollments))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(preview.targetMonth).toBe("2026-10");
      expect(preview.periodStart).toBe("2026-10-01");
      expect(preview.periodEnd).toBe("2026-10-31");
      expect(preview.dueDate).toBe("2026-10-10");
      expect(preview.invoices).toHaveLength(3);
      expect(preview.skippedCount).toBe(0);

      // 1. Alex: default price 1000, 0% discount
      expect(preview.invoices[0].studentId).toBe(10);
      expect(preview.invoices[0].finalPrice).toBe(1000);
      expect(preview.invoices[0].lineItemDescription).toBe("Abonament curs Robotică - Octombrie");

      // 2. Mihai: customPrice 1200 override, 0% discount
      expect(preview.invoices[1].studentId).toBe(11);
      expect(preview.invoices[1].finalPrice).toBe(1200);

      // 3. Elena: customPrice 1500, 20% discount -> 1200
      expect(preview.invoices[2].studentId).toBe(12);
      expect(preview.invoices[2].finalPrice).toBe(1200);

      expect(preview.totalProjectedRevenue).toBe(1000 + 1200 + 1200);
    });

    it("previews recurring invoices with optional custom monthName", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([mockEnrollments[0]]))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
        monthName: "Octombrie 2026",
      });

      expect(preview.invoices[0].lineItemDescription).toBe("Abonament curs Robotică - Octombrie 2026");
    });

    it("detects existing active invoices and marks them as skipped duplicates in preview", async () => {
      const existingActiveInvoice = {
        id: 777,
        studentId: 10,
        groupId: 1,
        enrollmentId: 101,
        periodStart: "2026-10-01",
        status: "issued",
        groupCourseId: 5,
      };

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockEnrollments))
        .mockReturnValueOnce(createQueryChain([existingActiveInvoice]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(preview.createdCount).toBe(2);
      expect(preview.skippedCount).toBe(1);
      expect(preview.skippedDuplicates).toBe(1);
      expect(preview.skipped[0].studentId).toBe(10);
      expect(preview.skipped[0].existingInvoiceId).toBe(777);
      expect(preview.totalProjectedRevenue).toBe(1200 + 1200);
    });

    it("scopes duplicate check specifically to subscription invoice type", async () => {
      let capturedWhereCondition: any;
      const invoiceQueryChain: any = Promise.resolve([]);
      Object.assign(invoiceQueryChain, {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation((condition) => {
          capturedWhereCondition = condition;
          return invoiceQueryChain;
        }),
      });

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockEnrollments))
        .mockReturnValueOnce(invoiceQueryChain);

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(invoiceQueryChain.where).toHaveBeenCalled();
      expect(capturedWhereCondition).toBeDefined();
      expect(preview.createdCount).toBe(3);
      expect(preview.skippedCount).toBe(0);
    });

    it("generates recurring invoices in batch and creates invoice items atomically", async () => {
      const mockTx: any = {
        select: vi.fn()
          .mockReturnValueOnce(createQueryChain(mockEnrollments))
          .mockReturnValueOnce(createQueryChain([])),
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 501,
                invoiceNumber: "INV-2026-001",
                studentId: 10,
                totalAmount: 1000,
                status: "draft",
              }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 1, invoiceId: 501, amount: 1000 }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 502,
                invoiceNumber: "INV-2026-002",
                studentId: 11,
                totalAmount: 1200,
                status: "draft",
              }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 2, invoiceId: 502, amount: 1200 }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 503,
                invoiceNumber: "INV-2026-003",
                studentId: 12,
                totalAmount: 1200,
                status: "draft",
              }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 3, invoiceId: 503, amount: 1200 }]),
            }),
          }),
      };

      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(result.createdCount).toBe(3);
      expect(result.created).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.totalAmount).toBe(3400);
      expect(result.invoices).toHaveLength(3);
    });

    it("guarantees idempotency: skips batch generation when invoices already exist", async () => {
      const existingInvoices = [
        { id: 1, studentId: 10, groupId: 1, enrollmentId: 101, periodStart: "2026-10-01", groupCourseId: 5 },
        { id: 2, studentId: 11, groupId: 1, enrollmentId: 102, periodStart: "2026-10-01", groupCourseId: 5 },
        { id: 3, studentId: 12, groupId: 1, enrollmentId: 103, periodStart: "2026-10-01", groupCourseId: 5 },
      ];

      const mockTx: any = {
        select: vi.fn()
          .mockReturnValueOnce(createQueryChain(mockEnrollments))
          .mockReturnValueOnce(createQueryChain(existingInvoices)),
        insert: vi.fn(),
      };

      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(result.createdCount).toBe(0);
      expect(result.created).toBe(0);
      expect(result.skippedCount).toBe(3);
      expect(result.skippedDuplicates).toBe(3);
      expect(result.totalAmount).toBe(0);
      expect(result.invoices).toHaveLength(0);
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("does not skip generation when existing invoice is cancelled", async () => {
      // In recurring billing, cancelled invoices are filtered out of existingInvoices by ne(status, 'cancelled')
      const mockTx: any = {
        select: vi.fn()
          .mockReturnValueOnce(createQueryChain([mockEnrollments[0]]))
          .mockReturnValueOnce(createQueryChain([])), // cancelled invoice is not returned as active
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 601, totalAmount: 1000, status: "draft" }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 10, invoiceId: 601, amount: 1000 }]),
            }),
          }),
      };

      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
      });

      expect(result.createdCount).toBe(1);
      expect(result.skippedCount).toBe(0);
    });

    it("rejects invalid targetMonth formats with 400 Bad Request", async () => {
      const caller = billingRouter.createCaller({ user: school1Admin });
      await expect(caller.previewRecurringInvoices({ targetMonth: "invalid" })).rejects.toThrow();
      await expect(caller.previewRecurringInvoices({ targetMonth: "2026-13" })).rejects.toThrow();
      await expect(caller.previewRecurringInvoices({ targetMonth: "2026-00" })).rejects.toThrow();
      await expect(caller.generateRecurringInvoices({ targetMonth: "2026-10-01" as any })).rejects.toThrow();
    });

    it("rejects group preview when group does not belong to school", async () => {
      (db.select as any).mockReturnValueOnce(createQueryChain([{ id: 99, schoolId: 2 }])); // Group in school 2

      const caller = billingRouter.createCaller({ user: school1Admin }); // Admin in school 1
      await expect(
        caller.previewRecurringInvoices({
          targetMonth: "2026-10",
          groupId: 99,
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("handles partial batch generation with mixed skipped duplicates and created invoices", async () => {
      const mockTx: any = {
        select: vi.fn()
          .mockReturnValueOnce(createQueryChain(mockEnrollments)) // 3 candidates
          .mockReturnValueOnce(createQueryChain([{ id: 77, studentId: 10, groupId: 1, enrollmentId: 101, periodStart: "2026-10-01", groupCourseId: 5 }])), // Alex is duplicate
        insert: vi.fn()
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 201, totalAmount: 1200, status: "draft" }]) }) })
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1, amount: 1200 }]) }) })
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 202, totalAmount: 1200, status: "draft" }]) }) })
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 2, amount: 1200 }]) }) }),
      };
      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateRecurringInvoices({ targetMonth: "2026-10", defaultPrice: 1000 });

      expect(result.createdCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.totalAmount).toBe(2400);
      expect(result.invoices).toHaveLength(2);
    });

    it("applies discount accurately to pure base price when customPrice is omitted", async () => {
      const enr = [{
        enrollmentId: 201,
        studentId: 55,
        studentName: "Diana Moraru",
        groupId: 1,
        groupName: "Robotică 1",
        courseId: 5,
        courseName: "Robotică",
        billingType: "subscription_monthly",
        customPrice: null,
        discountPercent: 15,
      }];
      (db.select as any)
        .mockReturnValueOnce(createQueryChain(enr))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({ targetMonth: "2026-10", defaultPrice: 1000 });

      // 1000 * 0.85 = 850
      expect(preview.invoices[0].finalPrice).toBe(850);
    });

    it("handles 100% scholarship and customPrice: 0 boundary cleanly", async () => {
      const enr = [
        {
          enrollmentId: 301,
          studentId: 61,
          studentName: "Free Tier Student",
          groupId: 1,
          groupName: "Robotică 1",
          courseId: 5,
          courseName: "Robotică",
          billingType: "subscription_monthly",
          customPrice: 0,
          discountPercent: 0,
        },
        {
          enrollmentId: 302,
          studentId: 62,
          studentName: "Full Scholarship Student",
          groupId: 1,
          groupName: "Robotică 1",
          courseId: 5,
          courseName: "Robotică",
          billingType: "subscription_monthly",
          customPrice: null,
          discountPercent: 100,
        },
      ];
      (db.select as any)
        .mockReturnValueOnce(createQueryChain(enr))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({ targetMonth: "2026-10", defaultPrice: 1500 });

      expect(preview.invoices[0].finalPrice).toBe(0);
      expect(preview.invoices[1].finalPrice).toBe(0);
      expect(preview.totalProjectedRevenue).toBe(0);
    });

    it("applies custom explicit dueDate when supplied in input", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([mockEnrollments[0]]))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
        dueDate: "2026-10-25",
      });

      expect(preview.dueDate).toBe("2026-10-25");
      expect(preview.invoices[0].dueDate).toBe("2026-10-25");
    });

    it("allows direct invoice status specification (status: issued)", async () => {
      const mockTx: any = {
        select: vi.fn()
          .mockReturnValueOnce(createQueryChain([mockEnrollments[0]]))
          .mockReturnValueOnce(createQueryChain([])),
        insert: vi.fn()
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 801, status: "issued", totalAmount: 1000 }]) }) })
          .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1, amount: 1000 }]) }) }),
      };
      (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateRecurringInvoices({
        targetMonth: "2026-10",
        defaultPrice: 1000,
        status: "issued",
      });

      expect(result.createdCount).toBe(1);
      expect(result.invoices[0].status).toBe("issued");
    });

    it("requires schoolId for SuperAdmin caller when previewing recurring invoices", async () => {
      const caller = billingRouter.createCaller({ user: superUser });
      await expect(caller.previewRecurringInvoices({ targetMonth: "2026-10" })).rejects.toThrow(TRPCError);
    });

    it("prevents duplicate invoices across cohorts for the same course in the same month", async () => {
      // Student 10 enrolled in Group A and Group B for the same Course 5
      const multiGroupEnrollments = [
        { ...mockEnrollments[0], groupId: 1, groupName: "Group A", courseId: 5 },
      ];
      const existingCourseInvoice = {
        id: 999,
        studentId: 10,
        groupId: 2, // different group!
        enrollmentId: 9999, // different enrollment!
        periodStart: "2026-10-01",
        status: "issued",
        groupCourseId: 5, // same course!
      };

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(multiGroupEnrollments))
        .mockReturnValueOnce(createQueryChain([existingCourseInvoice]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const preview = await caller.previewRecurringInvoices({ targetMonth: "2026-10", defaultPrice: 1000 });

      expect(preview.createdCount).toBe(0);
      expect(preview.skippedCount).toBe(1);
      expect(preview.skipped[0].reason).toContain("Factură activă deja existentă");
    });
  });

  describe("processAttendanceBilling (Attendance-Triggered Billing Engine)", () => {
    it("ignores student if enrollment is not per_lesson", async () => {
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 101,
            studentId: 10,
            groupId: 1,
            billingType: "subscription_monthly",
            customPrice: 1000,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      const res = await processAttendanceBilling({
        attendanceRecordId: 555,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "present",
      });

      expect(res.processed).toBe(false);
      expect((res as any).reason).toBe("not_per_lesson");
    });

    it("creates draft per_lesson invoice and invoice item for present attendance", async () => {
      // 1. Mock enrollment lookup (per_lesson)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 102,
            studentId: 10,
            groupId: 1,
            courseId: 5,
            billingType: "per_lesson",
            customPrice: 150,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Mock existing item lookup (none exists)
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      // 3. Mock existing draft invoice lookup (none exists)
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      // 4. Mock invoice insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 80, invoiceNumber: "INV-2026-PL01", totalAmount: 150, status: "draft" },
          ]),
        }),
      });

      // 5. Mock item insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 301, invoiceId: 80, attendanceId: 556, unitPrice: 150, amount: 150 },
          ]),
        }),
      });

      const res = await processAttendanceBilling({
        attendanceRecordId: 556,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "present",
      });

      expect(res.processed).toBe(true);
      expect((res as any).created).toBe(true);
      expect((res as any).itemId).toBe(301);
      expect((res as any).invoiceId).toBe(80);
    });

    it("enforces idempotency guard when attendance is marked present multiple times", async () => {
      // 1. Mock enrollment lookup (per_lesson)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 102,
            studentId: 10,
            groupId: 1,
            billingType: "per_lesson",
            customPrice: 150,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Mock existing item lookup (already exists!)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 301, invoiceId: 80, attendanceId: 556, amount: 150 }]),
      );

      const res = await processAttendanceBilling({
        attendanceRecordId: 556,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "present",
      });

      expect(res.processed).toBe(true);
      expect((res as any).alreadyExists).toBe(true);
      expect((res as any).itemId).toBe(301);
      // No insert should have been called!
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("removes draft line item and updates invoice total when status is toggled to absent", async () => {
      // 1. Mock enrollment lookup (per_lesson)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 102,
            studentId: 10,
            groupId: 1,
            billingType: "per_lesson",
            customPrice: 150,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Mock existing item lookup (found)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 301, invoiceId: 80, attendanceId: 556, amount: 150 }]),
      );

      // 3. Mock invoice lookup (draft invoice)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 80, status: "draft", totalAmount: 300 }]),
      );

      // 4. Mock item delete
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([]),
      });

      // 5. Mock remaining items query (1 item still remains)
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 300 }]),
      );

      // 6. Mock invoice update (totalAmount updated to 300 - 150 = 150)
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const res = await processAttendanceBilling({
        attendanceRecordId: 556,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "absent",
      });

      expect(res.processed).toBe(true);
      expect((res as any).removed).toBe(true);
      expect((res as any).itemId).toBe(301);
      expect(db.delete).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });

    it("deletes empty draft invoice when last item is removed upon absent toggle", async () => {
      // 1. Mock enrollment lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 102,
            studentId: 10,
            groupId: 1,
            billingType: "per_lesson",
            customPrice: 150,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Mock existing item lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 301, invoiceId: 80, attendanceId: 556, amount: 150 }]),
      );

      // 3. Mock invoice lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 80, status: "draft", totalAmount: 150 }]),
      );

      // 4. Mock item delete
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([]),
      });

      // 5. Mock remaining items query (empty - 0 items left)
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      // 6. Mock invoice delete
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([]),
      });

      const res = await processAttendanceBilling({
        attendanceRecordId: 556,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "absent",
      });

      expect(res.processed).toBe(true);
      expect((res as any).removed).toBe(true);
      expect(db.delete).toHaveBeenCalledTimes(2); // Deleted item AND draft invoice
    });

    it("bills student when attendance status is 'late'", async () => {
      // 1. Mock enrollment lookup
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            id: 102,
            studentId: 10,
            groupId: 1,
            courseId: 5,
            billingType: "per_lesson",
            customPrice: 150,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Existing item: none
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      // 3. Draft invoice: exists
      (db.select as any).mockReturnValueOnce(
        createQueryChain([{ id: 80, totalAmount: 150, status: "draft" }]),
      );

      // 4. Insert item
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 302, invoiceId: 80, attendanceId: 557, unitPrice: 150, amount: 150 },
          ]),
        }),
      });

      // 5. Update invoice
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const res = await processAttendanceBilling({
        attendanceRecordId: 557,
        studentId: 10,
        groupId: 1,
        date: "2026-09-22",
        status: "late",
      });

      expect(res.processed).toBe(true);
      expect((res as any).created).toBe(true);
      expect((res as any).itemId).toBe(302);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("billing.generateBatchLessonInvoices", () => {
    it("consolidates unbilled attended lessons into a single invoice per student", async () => {
      // 1. Mock attended lessons query
      (db.select as any).mockReturnValueOnce(
        createQueryChain([
          {
            attendanceId: 501,
            studentId: 10,
            studentName: "Alex Popescu",
            groupId: 1,
            courseId: 1,
            enrollmentId: 101,
            date: "2026-09-05",
            customPrice: 120,
            discountPercent: 0,
            schoolId: 1,
          },
          {
            attendanceId: 502,
            studentId: 10,
            studentName: "Alex Popescu",
            groupId: 1,
            courseId: 1,
            enrollmentId: 101,
            date: "2026-09-12",
            customPrice: 120,
            discountPercent: 0,
            schoolId: 1,
          },
        ]),
      );

      // 2. Mock existing items query (none are in issued invoices)
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      // 3. Mock invoice insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockImplementation((val: any) => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 95,
              invoiceNumber: val.invoiceNumber,
              schoolId: 1,
              studentId: 10,
              type: "per_lesson",
              status: val.status,
              totalAmount: val.totalAmount,
            },
          ]),
        })),
      });

      // 4. Mock invoice items insert
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 1, invoiceId: 95, attendanceId: 501, amount: 120 },
            { id: 2, invoiceId: 95, attendanceId: 502, amount: 120 },
          ]),
        }),
      });

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateBatchLessonInvoices({
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "issued",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.totalLessonsBilled).toBe(2);
      expect(result.invoices[0].totalAmount).toBe(240);
      expect(result.invoices[0].items).toHaveLength(2);
    });

    it("returns empty result if no unbilled attended lessons exist in the date range", async () => {
      (db.select as any).mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.generateBatchLessonInvoices({
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      expect(result.invoices).toHaveLength(0);
      expect(result.totalLessonsBilled).toBe(0);
    });
  });

  describe("billingRouter.getPayments", () => {
    it("fetches payment records filtered by school for school admin", async () => {
      const mockPayments = [
        {
          id: 1,
          invoiceId: 10,
          invoiceNumber: "INV-2026-0001",
          studentId: 100,
          studentName: "Alex Popescu",
          schoolId: 1,
          amount: 500,
          paymentDate: "2026-09-20",
          method: "cash",
          receiptNumber: "REC-001",
          notes: "Initial payment",
          createdAt: new Date(),
        },
      ];

      (db.select as any).mockReturnValueOnce(createQueryChain(mockPayments));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const result = await caller.getPayments({ studentId: 100 });

      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe("INV-2026-0001");
      expect(result[0].amount).toBe(500);
      expect(result[0].method).toBe("cash");
    });

    it("allows superadmin to retrieve payments across schools", async () => {
      const mockPayments = [
        {
          id: 1,
          invoiceId: 10,
          invoiceNumber: "INV-2026-0001",
          studentId: 100,
          studentName: "Alex Popescu",
          schoolId: 1,
          amount: 500,
          paymentDate: "2026-09-20",
          method: "card",
        },
        {
          id: 2,
          invoiceId: 20,
          invoiceNumber: "INV-2026-0002",
          studentId: 200,
          studentName: "Elena Rusu",
          schoolId: 2,
          amount: 800,
          paymentDate: "2026-09-21",
          method: "bank_transfer",
        },
      ];

      (db.select as any).mockReturnValueOnce(createQueryChain(mockPayments));

      const caller = billingRouter.createCaller({ user: superUser });
      const result = await caller.getPayments();

      expect(result).toHaveLength(2);
      expect(result[1].schoolId).toBe(2);
    });

    it("returns empty array for school admin without a valid schoolId", async () => {
      const adminWithoutSchool = {
        id: "99",
        email: "noschool@example.com",
        name: "No School Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: null,
      };

      const caller = billingRouter.createCaller({ user: adminWithoutSchool });
      const result = await caller.getPayments();

      expect(result).toEqual([]);
    });
  });

  describe("billing.getStatistics", () => {
    it("returns empty statistics when non-superadmin has no schoolId", async () => {
      const caller = billingRouter.createCaller({
        user: { ...school1Admin, schoolId: null },
      });
      const res = await caller.getStatistics();
      expect(res.kpis.totalRevenueCollected).toBe(0);
      expect(res.kpis.collectionRate).toBe(0);
      expect(res.debtors).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it("calculates KPIs, trends, model distribution, course breakdown, and debtors list correctly", async () => {
      const mockInvoices = [
        {
          id: 1,
          schoolId: 1,
          studentId: 10,
          studentName: "Alex Popescu",
          studentPhone: "+37369000001",
          parentName: "Maria Popescu",
          parentPhone: "+37360000000",
          groupId: 101,
          groupName: "Grupa A",
          courseId: 201,
          courseName: "Robotica 1",
          invoiceNumber: "INV-2026-001",
          type: "subscription",
          status: "partially_paid",
          totalAmount: 1000,
          paidAmount: 600,
          dueDate: "2026-09-10",
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
        {
          id: 2,
          schoolId: 1,
          studentId: 11,
          studentName: "Ion Creangă",
          studentPhone: "+37369000002",
          parentName: "Stefan Creangă",
          parentPhone: "+37360000003",
          groupId: 102,
          groupName: "Grupa B",
          courseId: 202,
          courseName: "Programare Python",
          invoiceNumber: "INV-2026-002",
          type: "per_lesson",
          status: "paid",
          totalAmount: 500,
          paidAmount: 500,
          dueDate: "2026-09-15",
          createdAt: new Date("2026-09-05T10:00:00Z"),
        },
        {
          id: 3,
          schoolId: 1,
          studentId: 10,
          studentName: "Alex Popescu",
          studentPhone: "+37369000001",
          parentName: "Maria Popescu",
          parentPhone: "+37360000000",
          groupId: 101,
          groupName: "Grupa A",
          courseId: 201,
          courseName: "Robotica 1",
          invoiceNumber: "INV-2026-003",
          type: "subscription",
          status: "overdue",
          totalAmount: 800,
          paidAmount: 0,
          dueDate: "2026-08-20",
          createdAt: new Date("2026-08-10T10:00:00Z"),
        },
      ];

      const mockPayments = [
        {
          id: 1,
          invoiceId: 1,
          invoiceNumber: "INV-2026-001",
          studentId: 10,
          studentName: "Alex Popescu",
          schoolId: 1,
          amount: 600,
          paymentDate: "2026-09-12",
          method: "card",
          receiptNumber: "RCP-001",
          notes: "Plata online",
          createdAt: new Date("2026-09-12T10:00:00Z"),
        },
        {
          id: 2,
          invoiceId: 2,
          invoiceNumber: "INV-2026-002",
          studentId: 11,
          studentName: "Ion Creangă",
          schoolId: 1,
          amount: 500,
          paymentDate: "2026-09-16",
          method: "cash",
          receiptNumber: "RCP-002",
          notes: null,
          createdAt: new Date("2026-09-16T10:00:00Z"),
        },
      ];

      const mockEnrollments = [
        { id: 1, studentId: 10, groupId: 101, groupName: "Grupa A", billingType: "subscription_monthly", customPrice: 1200 },
        { id: 2, studentId: 11, groupId: 102, groupName: "Grupa B", billingType: "subscription_monthly", customPrice: 1000 },
        { id: 3, studentId: 12, groupId: 103, groupName: "Grupa C", billingType: "per_lesson", customPrice: 200 },
      ];

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockInvoices))
        .mockReturnValueOnce(createQueryChain(mockPayments))
        .mockReturnValueOnce(createQueryChain(mockEnrollments));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const stats = await caller.getStatistics({
        dateRange: { from: "2026-09-01", to: "2026-09-30" },
      });

      // Verification:
      // Filtered invoices in Sep: id 1 (1000) and id 2 (500) => totalInvoiced = 1500
      // Payments in Sep: 600 + 500 = 1100 => totalRevenueCollected = 1100
      // collectionRate = round(1100 / 1500 * 100) = 73%
      expect(stats.kpis.totalInvoiced).toBe(1500);
      expect(stats.kpis.totalRevenueCollected).toBe(1100);
      expect(stats.kpis.collectionRate).toBe(73);

      // Active debt: across all active unpaid invoices (id 1: 400, id 3: 800) => 1200
      expect(stats.kpis.totalActiveDebt).toBe(1200);

      // MRR: 1200 + 1000 = 2200
      expect(stats.kpis.projectedRecurringRevenue).toBe(2200);

      // Top debtors: Alex Popescu owes 400 + 800 = 1200, 2 unpaid invoices
      expect(stats.debtors).toHaveLength(1);
      expect(stats.debtors[0].studentName).toBe("Alex Popescu");
      expect(stats.debtors[0].totalDebt).toBe(1200);
      expect(stats.debtors[0].unpaidInvoicesCount).toBe(2);
      expect(stats.debtors[0].parentPhone).toBe("+37360000000");
      expect(stats.debtors[0].earliestDueDate).toBe("2026-08-20");
      expect(stats.debtors[0].overdueDays).toBeGreaterThan(0);

      // Recent payments export
      expect(stats.recentPayments).toHaveLength(2);
      expect(stats.recentPayments[0].studentName).toBe("Ion Creangă"); // sorted desc: 2026-09-16
      expect(stats.recentPayments[0].invoiceNumber).toBe("INV-2026-002");
      expect(stats.recentPayments[1].studentName).toBe("Alex Popescu"); // 2026-09-12

      // Model distribution
      const subModel = stats.billingModelDistribution.find((m) => m.type === "subscription");
      expect(subModel?.billed).toBe(1000); // only id 1 in Sep
      const perLessonModel = stats.billingModelDistribution.find((m) => m.type === "per_lesson");
      expect(perLessonModel?.billed).toBe(500);

      // Course breakdown
      expect(stats.courseBreakdown.length).toBeGreaterThan(0);
      const robotica = stats.courseBreakdown.find((c) => c.courseName === "Robotica 1");
      expect(robotica?.billed).toBe(1000);
    });

    it("falls back to subscription invoice amounts for MRR when customPrice is null", async () => {
      const mockInvoices = [
        {
          id: 1,
          schoolId: 1,
          studentId: 10,
          groupId: 101,
          type: "subscription",
          status: "issued",
          totalAmount: 1400,
          paidAmount: 0,
          dueDate: "2026-09-10",
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
      ];
      const mockPayments: any[] = [];
      const mockEnrollments = [
        // customPrice is null: should fall back to student 10's subscription invoice (1400 MDL)
        { id: 1, studentId: 10, groupId: 101, groupName: "Grupa A", billingType: "subscription_monthly", customPrice: null },
      ];

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockInvoices))
        .mockReturnValueOnce(createQueryChain(mockPayments))
        .mockReturnValueOnce(createQueryChain(mockEnrollments));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const stats = await caller.getStatistics({
        dateRange: { from: "2026-09-01", to: "2026-09-30" },
      });

      expect(stats.kpis.projectedRecurringRevenue).toBe(1400);
    });

    it("enriches debtors with active enrolled groups when unpaid invoice has no groupId (situational)", async () => {
      const mockInvoices = [
        {
          id: 6,
          schoolId: 1,
          studentId: 2,
          studentName: "Elena Ionescu",
          studentPhone: "+37369000002",
          parentName: "Ion Ionescu",
          parentPhone: "+37361111111",
          groupId: null, // Situational fee without specific group
          groupName: null,
          courseId: null,
          courseName: null,
          invoiceNumber: "INV-2026-006",
          type: "situational",
          status: "overdue",
          totalAmount: 450,
          paidAmount: 0,
          dueDate: "2026-09-05",
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
      ];
      const mockPayments: any[] = [];
      const mockEnrollments = [
        {
          id: 10,
          studentId: 2,
          groupId: 102,
          groupName: "Robotics Cohort 1 - Miercuri 15:00",
          billingType: "subscription_monthly",
          customPrice: 1400,
        },
      ];

      (db.select as any)
        .mockReturnValueOnce(createQueryChain(mockInvoices))
        .mockReturnValueOnce(createQueryChain(mockPayments))
        .mockReturnValueOnce(createQueryChain(mockEnrollments));

      const caller = billingRouter.createCaller({ user: school1Admin });
      const stats = await caller.getStatistics({
        dateRange: { from: "2026-09-01", to: "2026-09-30" },
      });

      expect(stats.debtors).toHaveLength(1);
      expect(stats.debtors[0].studentName).toBe("Elena Ionescu");
      expect(stats.debtors[0].totalDebt).toBe(450);
      expect(stats.debtors[0].groupNames).toEqual(["Robotics Cohort 1 - Miercuri 15:00"]);
    });

    it("allows superadmin to query statistics across all schools or for specific school", async () => {
      (db.select as any)
        .mockReturnValueOnce(createQueryChain([]))
        .mockReturnValueOnce(createQueryChain([]))
        .mockReturnValueOnce(createQueryChain([]));

      const caller = billingRouter.createCaller({ user: superUser });
      const stats = await caller.getStatistics({ schoolId: 2 });
      expect(stats.kpis.totalActiveDebt).toBe(0);
      expect(db.select).toHaveBeenCalledTimes(3);
    });
  });
});
