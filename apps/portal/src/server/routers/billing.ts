import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { eq, and, or, ilike, desc, gte, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  payments,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";

function getBillingRoles(user?: { permissions?: string[]; role?: string; schoolId?: number | null }) {
  const permissions = user?.permissions || [];
  const role = user?.role;
  return {
    isSuper: permissions.includes("super") || role === "superadmin",
    isAdmin: permissions.includes("admin") || role === "admin",
    isTeacher: permissions.includes("teach") || role === "teacher",
  };
}

export const billingRouter = router({
  // 1. Get Invoices (with pagination, filters, and search)
  getInvoices: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          search: z.string().optional(),
          status: z
            .enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"])
            .optional(),
          type: z.enum(["subscription", "per_lesson", "situational"]).optional(),
          groupId: z.number().int().positive().optional(),
          studentId: z.number().int().positive().optional(),
          schoolId: z.number().int().positive().optional(),
          dateRange: z
            .object({
              from: z.string().optional(),
              to: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      const conditions = [];

      // Multi-tenant isolation: non-super users can only access their school's invoices
      if (!isSuper) {
        if (!user.schoolId) return [];
        conditions.push(eq(invoices.schoolId, user.schoolId));
      } else if (input?.schoolId) {
        conditions.push(eq(invoices.schoolId, input.schoolId));
      }

      if (input?.status) {
        conditions.push(eq(invoices.status, input.status));
      }
      if (input?.type) {
        conditions.push(eq(invoices.type, input.type));
      }
      if (input?.groupId) {
        conditions.push(eq(invoices.groupId, input.groupId));
      }
      if (input?.studentId) {
        conditions.push(eq(invoices.studentId, input.studentId));
      }
      if (input?.search?.trim()) {
        const q = `%${input.search.trim()}%`;
        conditions.push(
          or(ilike(invoices.invoiceNumber, q), ilike(students.name, q)),
        );
      }
      if (input?.dateRange?.from) {
        conditions.push(gte(invoices.dueDate, input.dateRange.from));
      }
      if (input?.dateRange?.to) {
        conditions.push(lte(invoices.dueDate, input.dateRange.to));
      }

      const rows = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          schoolId: invoices.schoolId,
          studentId: invoices.studentId,
          studentName: students.name,
          studentPhone: students.phone,
          enrollmentId: invoices.enrollmentId,
          groupId: invoices.groupId,
          groupName: groups.name,
          type: invoices.type,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          dueDate: invoices.dueDate,
          periodStart: invoices.periodStart,
          periodEnd: invoices.periodEnd,
          notes: invoices.notes,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
        })
        .from(invoices)
        .innerJoin(students, eq(invoices.studentId, students.id))
        .leftJoin(groups, eq(invoices.groupId, groups.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(invoices.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return rows;
    }),

  // 2. Get Student Balance Summary
  getStudentBalanceSummary: protectedProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      // Verify student existence and school isolation
      const [student] = await db
        .select({
          id: students.id,
          name: students.name,
          schoolId: students.schoolId,
        })
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit",
        });
      }

      if (!isSuper && student.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți accesa datele unui student din altă școală",
        });
      }

      // Query non-cancelled invoices for this student
      const studentInvoices = await db
        .select({
          id: invoices.id,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          dueDate: invoices.dueDate,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, input.studentId),
            ne(invoices.status, "cancelled"),
          ),
        );

      // Query payments recorded for this student
      const studentPayments = await db
        .select({
          amount: payments.amount,
        })
        .from(payments)
        .where(eq(payments.studentId, input.studentId));

      const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      // Active / issued invoices: exclude draft and cancelled
      const activeInvoices = studentInvoices.filter((inv) => inv.status !== "draft");
      const totalInvoiced = activeInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

      const currentDebt = Math.max(0, totalInvoiced - totalPaid);

      // Overdue invoices: marked as 'overdue' or unpaid past dueDate
      const todayStr = new Date().toISOString().slice(0, 10);
      const overdueCount = activeInvoices.filter((inv) => {
        if (inv.status === "paid") return false;
        if (inv.status === "overdue") return true;
        if (inv.dueDate && inv.dueDate < todayStr) return true;
        return false;
      }).length;

      // Active billing plans from studentGroupEnrollments
      const activeBillingPlans = await db
        .select({
          enrollmentId: studentGroupEnrollments.id,
          groupId: groups.id,
          groupName: groups.name,
          courseId: courses.id,
          courseName: courses.name,
          billingType: studentGroupEnrollments.billingType,
          customPrice: studentGroupEnrollments.customPrice,
          discountPercent: studentGroupEnrollments.discountPercent,
          status: studentGroupEnrollments.status,
          joinedAt: studentGroupEnrollments.joinedAt,
        })
        .from(studentGroupEnrollments)
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .leftJoin(courses, eq(groups.courseId, courses.id))
        .where(
          and(
            eq(studentGroupEnrollments.studentId, input.studentId),
            eq(studentGroupEnrollments.status, "active"),
          ),
        );

      return {
        studentId: student.id,
        studentName: student.name,
        totalInvoiced,
        totalPaid,
        currentDebt,
        overdueCount,
        activeBillingPlans,
      };
    }),

  // 3. Get Invoice by ID (with items, student, group, and payment history)
  getInvoiceById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Factura nu a fost găsită",
        });
      }

      if (!isSuper && invoice.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți accesa o factură din altă școală",
        });
      }

      // Fetch student details
      const [student] = await db
        .select({
          id: students.id,
          name: students.name,
          phone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          age: students.age,
        })
        .from(students)
        .where(eq(students.id, invoice.studentId))
        .limit(1);

      // Fetch group and course if groupId is present
      let group = null;
      if (invoice.groupId) {
        const [g] = await db
          .select({
            id: groups.id,
            name: groups.name,
            courseId: courses.id,
            courseName: courses.name,
          })
          .from(groups)
          .leftJoin(courses, eq(groups.courseId, courses.id))
          .where(eq(groups.id, invoice.groupId))
          .limit(1);
        group = g || null;
      }

      // Fetch invoice line items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));

      // Fetch payments for this invoice
      const invoicePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.invoiceId, invoice.id))
        .orderBy(desc(payments.createdAt));

      return {
        ...invoice,
        student,
        group,
        items,
        payments: invoicePayments,
      };
    }),

  // 4. Create Invoice
  createInvoice: protectedProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        schoolId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        enrollmentId: z.number().int().positive().optional(),
        invoiceNumber: z.string().optional(),
        type: z.enum(["subscription", "per_lesson", "situational"]),
        status: z
          .enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"])
          .default("draft"),
        dueDate: z.string().optional(),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              quantity: z.number().int().positive().default(1),
              unitPrice: z.number().int().min(0),
              attendanceId: z.number().int().positive().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      const targetSchoolId = isSuper ? input.schoolId || user.schoolId : user.schoolId;
      if (!targetSchoolId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "schoolId este obligatoriu",
        });
      }

      // Verify student exists and belongs to target school
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit",
        });
      }

      if (!isSuper && student.schoolId !== targetSchoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți crea o factură pentru un student din altă școală",
        });
      }

      // Generate invoiceNumber if not provided
      const invoiceNum =
        input.invoiceNumber?.trim() ||
        `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // Calculate total amount from items
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const [createdInvoice] = await db
        .insert(invoices)
        .values({
          schoolId: targetSchoolId,
          studentId: input.studentId,
          groupId: input.groupId,
          enrollmentId: input.enrollmentId,
          invoiceNumber: invoiceNum,
          type: input.type,
          status: input.status,
          totalAmount,
          paidAmount: 0,
          dueDate: input.dueDate,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          notes: input.notes,
        })
        .returning();

      // Insert line items
      const itemsToInsert = input.items.map((it) => ({
        invoiceId: createdInvoice.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.quantity * it.unitPrice,
        attendanceId: it.attendanceId,
      }));

      const createdItems = await db
        .insert(invoiceItems)
        .values(itemsToInsert)
        .returning();

      return {
        ...createdInvoice,
        items: createdItems,
      };
    }),

  // 5. Update Invoice Status
  updateInvoiceStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      const [existing] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Factura nu a fost găsită",
        });
      }

      if (!isSuper && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți modifica o factură din altă școală",
        });
      }

      const updateData: {
        status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
        notes?: string;
        updatedAt: Date;
      } = {
        status: input.status,
        updatedAt: new Date(),
      };
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      const [updated] = await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, input.id))
        .returning();

      return updated;
    }),

  // 6. Record Payment
  recordPayment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number().int().positive(),
        amount: z.number().int().positive(),
        paymentDate: z.string().min(10).max(10), // YYYY-MM-DD
        method: z.enum(["cash", "bank_transfer", "card", "other"]),
        receiptNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { isSuper } = getBillingRoles(user);

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Factura nu a fost găsită",
        });
      }

      if (!isSuper && invoice.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți înregistra o plată pentru o factură din altă școală",
        });
      }

      const [newPayment] = await db
        .insert(payments)
        .values({
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          schoolId: invoice.schoolId,
          amount: input.amount,
          paymentDate: input.paymentDate,
          method: input.method,
          receiptNumber: input.receiptNumber,
          notes: input.notes,
          recordedByUserId: user.id ? parseInt(user.id, 10) || null : null,
        })
        .returning();

      const newPaidAmount = (invoice.paidAmount || 0) + input.amount;
      const newStatus =
        newPaidAmount >= invoice.totalAmount ? "paid" : "partially_paid";

      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          paidAmount: newPaidAmount,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id))
        .returning();

      return {
        payment: newPayment,
        invoice: updatedInvoice,
      };
    }),
});
