import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import {
  fetchInvoices,
  fetchInvoiceById,
  executeCreateInvoice,
  executeUpdateInvoiceStatus,
} from "../invoiceService";
import { fetchStudentBalanceSummary } from "../studentBalanceService";
import {
  executeRecordPayment,
  executeVoidPayment,
  executeCancelInvoice,
} from "../billingService";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateSchema = z.string().regex(dateRegex, "Data trebuie să fie în format YYYY-MM-DD");

export const billingRouter = router({
  // 1. Get Invoices (with pagination, filters, and search)
  getInvoices: adminProcedure
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

  // 4. Create Invoice
  createInvoice: adminProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        schoolId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        enrollmentId: z.number().int().positive().optional(),
        invoiceNumber: z.string().max(50).optional(),
        type: z.enum(["subscription", "per_lesson", "situational"]),
        status: z
          .enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"])
          .default("draft"),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeCreateInvoice(db, input, ctx.user);
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
  cancelInvoice: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        invoiceId: z.number().int().positive().optional(),
        reason: z.string().min(1, "Motivul anulării este obligatoriu"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await executeCancelInvoice(db, input, ctx.user);
    }),
});
