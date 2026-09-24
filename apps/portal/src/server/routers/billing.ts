import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, billingProcedure } from "../trpc";
import { db } from "@/lib/db";
import {
  fetchOverdueInvoicesCount,
  fetchInvoicesSummary,
} from "../invoiceSummaryService";
import {
  fetchInvoices,
  fetchInvoiceById,
  fetchPayments,
  executeCreateInvoice,
  executeCreateSituationalInvoice,
  executeUpdateInvoiceStatus,
} from "../invoiceService";
import { fetchStudentBalanceSummary } from "../studentBalanceService";
import {
  executeRecordPayment,
  executeVoidPayment,
  executeCancelInvoice,
  executeGenerateBatchLessonInvoices,
} from "../billingService";
import {
  previewRecurringInvoices,
  generateRecurringInvoices,
} from "../recurringBillingService";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateSchema = z
  .string()
  .regex(dateRegex, "Data trebuie să fie în format YYYY-MM-DD")
  .refine(
    (val) => {
      const d = new Date(val + "T00:00:00Z");
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
    },
    { message: "Data specificată este invalidă în calendar" },
  );

export const billingRouter = router({
  // 1. Get Invoices (with pagination, filters, and search)
  getInvoices: billingProcedure
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
              from: dateSchema.optional(),
              to: dateSchema.optional(),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchInvoices(db, input, ctx.user);
    }),

  // 1b. Get Overdue Invoices Count (Lightweight query for navigation badge)
  getOverdueCount: billingProcedure
    .input(z.object({ schoolId: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchOverdueInvoicesCount(db, ctx.user, input?.schoolId);
    }),

  // 1c. Get Invoices KPI Summary (Lightweight aggregation query for dashboard overview cards)
  getInvoicesSummary: billingProcedure
    .input(z.object({ schoolId: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchInvoicesSummary(db, ctx.user, input?.schoolId);
    }),

  // 2. Get Student Balance Summary
  getStudentBalanceSummary: adminProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchStudentBalanceSummary(db, input.studentId, ctx.user);
    }),

  // 3. Get Invoice by ID (with items, student, group, and payment history)
  getInvoiceById: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchInvoiceById(db, input.id, ctx.user);
    }),

  // 3.1 Get Payments (with school scoping, studentId/invoiceId filtering)
  getPayments: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          studentId: z.number().int().positive().optional(),
          invoiceId: z.number().int().positive().optional(),
          schoolId: z.number().int().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await fetchPayments(db, input, ctx.user);
    }),

  // 4. Create Invoice
  createInvoice: adminProcedure
    .input(
      z
        .object({
          studentId: z.number().int().positive(),
          schoolId: z.number().int().positive().optional(),
          groupId: z.number().int().positive().optional(),
          enrollmentId: z.number().int().positive().optional(),
          invoiceNumber: z.string().max(50).optional(),
          type: z.enum(["subscription", "per_lesson", "situational"]),
          status: z.enum(["draft", "issued"]).default("draft"),
          dueDate: dateSchema.optional(),
          periodStart: dateSchema.optional(),
          periodEnd: dateSchema.optional(),
          notes: z.string().optional(),
          items: z
            .array(
              z.object({
                description: z.string().min(1).max(255),
                quantity: z.number().int().positive().max(1000).default(1),
                unitPrice: z.number().int().min(0).max(100_000_000),
                attendanceId: z.number().int().positive().optional(),
              }),
            )
            .min(1),
        })
        .refine(
          (data) => {
            const total = data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
            return total <= 2_000_000_000;
          },
          { message: "Suma totală a facturii depășește limita permisă de 2,000,000,000." },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeCreateInvoice(db, input, ctx.user);
    }),

  // 4b. Create Situational (Ad-hoc) Invoice (Materials, Exams, Private Lessons, Adjustments)
  createSituationalInvoice: adminProcedure
    .input(
      z
        .object({
          studentId: z.number().int().positive(),
          schoolId: z.number().int().positive().optional(),
          title: z.string().min(1).max(255),
          category: z.enum(["materials", "exam", "private_session", "adjustment"]).or(z.string().min(1).max(50)),
          amount: z.number().int().min(0).max(2_000_000_000).optional(),
          dueDate: dateSchema.optional(),
          notes: z.string().optional(),
          status: z.enum(["draft", "issued"]).optional(),
          items: z
            .array(
              z.object({
                description: z.string().min(1).max(255),
                quantity: z.number().int().positive().max(1000).default(1),
                unitPrice: z.number().int().min(0).max(100_000_000),
              }),
            )
            .optional(),
        })
        .refine(
          (data) => (data.items && data.items.length > 0) || data.amount !== undefined,
          { message: "Factura situațională trebuie să conțină o sumă sau cel puțin un articol." },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeCreateSituationalInvoice(db, input, ctx.user);
    }),

  // 5. Update Invoice Status
  updateInvoiceStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeUpdateInvoiceStatus(db, input, ctx.user);
    }),

  // 6. Record Payment (Atomic Transaction)
  recordPayment: adminProcedure
    .input(
      z.object({
        invoiceId: z.number().int().positive(),
        amount: z.number().int().positive().max(100_000_000),
        paymentDate: dateSchema,
        method: z.enum(["cash", "bank_transfer", "card", "other"]),
        receiptNumber: z.string().max(100).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeRecordPayment(db, input, ctx.user);
    }),

  // 7. Void Payment (Atomic Transaction)
  voidPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        reason: z.string().min(1, "Motivul anulării plății este obligatoriu"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeVoidPayment(db, input, ctx.user);
    }),

  // 8. Cancel Invoice (Atomic Transaction)
  cancelInvoice: billingProcedure
    .input(
      z
        .object({
          id: z.number().int().positive().optional(),
          invoiceId: z.number().int().positive().optional(),
          reason: z.string().min(1, "Motivul anulării este obligatoriu"),
        })
        .refine((data) => data.id !== undefined || data.invoiceId !== undefined, {
          message: "Trebuie specificat id sau invoiceId pentru anularea facturii",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeCancelInvoice(db, input, ctx.user);
    }),

  // 9. Preview Recurring Invoices (Dry-Run Query)
  previewRecurringInvoices: adminProcedure
    .input(
      z.object({
        targetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "targetMonth trebuie să fie în format YYYY-MM (ex: 2026-10)"),
        groupId: z.number().int().positive().optional(),
        defaultPrice: z.number().int().min(0).max(100_000_000).optional(),
        basePrice: z.number().int().min(0).max(100_000_000).optional(),
        dueDate: dateSchema.optional(),
        schoolId: z.number().int().positive().optional(),
        monthName: z.string().max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await previewRecurringInvoices(db, input, ctx.user);
    }),

  // 10. Generate Recurring Invoices (Atomic Batch Mutation)
  generateRecurringInvoices: adminProcedure
    .input(
      z.object({
        targetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "targetMonth trebuie să fie în format YYYY-MM (ex: 2026-10)"),
        groupId: z.number().int().positive().optional(),
        defaultPrice: z.number().int().min(0).max(100_000_000).optional(),
        basePrice: z.number().int().min(0).max(100_000_000).optional(),
        dueDate: dateSchema.optional(),
        schoolId: z.number().int().positive().optional(),
        monthName: z.string().max(50).optional(),
        status: z.enum(["draft", "issued"]).default("draft").optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await generateRecurringInvoices(db, input, ctx.user);
    }),

  // 11. Batch Lesson Invoicing (Consolidate unbilled attended lessons into invoices)
  generateBatchLessonInvoices: adminProcedure
    .input(
      z.object({
        startDate: dateSchema,
        endDate: dateSchema,
        schoolId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        studentId: z.number().int().positive().optional(),
        dueDate: dateSchema.optional(),
        status: z.enum(["draft", "issued"]).default("issued"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeGenerateBatchLessonInvoices(db, input, ctx.user);
    }),
});
