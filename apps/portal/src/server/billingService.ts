import { eq, and, or, inArray, gte, lte, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  payments,
  studentGroupEnrollments,
  students,
  attendanceRecords,
} from "@/db/schema";

export type BillingUser = {
  id?: string | null;
  role?: string | null;
  permissions?: string[];
  schoolId?: number | null;
};

export function getBillingRoles(user?: BillingUser) {
  const permissions = user?.permissions || [];
  const role = user?.role;
  return {
    isSuper: permissions.includes("super") || role === "superadmin",
    isAdmin: permissions.includes("admin") || role === "admin",
    isTeacher: permissions.includes("teach") || role === "teacher",
  };
}

export type RecordPaymentInput = {
  invoiceId: number;
  amount: number;
  paymentDate: string;
  method: "cash" | "bank_transfer" | "card" | "other";
  receiptNumber?: string;
  notes?: string;
};

export type VoidPaymentInput = {
  paymentId: number;
  reason: string;
};

export type CancelInvoiceInput = {
  id?: number;
  invoiceId?: number;
  reason: string;
};

export async function executeRecordPayment(
  dbInstance: typeof db,
  input: RecordPaymentInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  if (!input.amount || input.amount <= 0 || !Number.isInteger(input.amount)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Suma plătită trebuie să fie un număr întreg pozitiv.",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || invoice.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți înregistra o plată pentru o factură din altă școală",
      });
    }

    if (invoice.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți înregistra plăți pentru o factură anulată",
      });
    }

    if (invoice.status === "draft") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți înregistra plăți pentru o factură în ciornă (draft). Emite factura mai întâi.",
      });
    }

    const currentPaid = invoice.paidAmount || 0;
    const remainingDebt = invoice.totalAmount - currentPaid;

    if (remainingDebt <= 0 || invoice.status === "paid") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Factura a fost deja achitată integral",
      });
    }

    if (input.amount > remainingDebt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Suma plătită (${input.amount}) depășește soldul rămas al facturii (${remainingDebt})`,
      });
    }

    const [newPayment] = await tx
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

    const newPaidAmount = currentPaid + input.amount;
    const newStatus =
      newPaidAmount >= invoice.totalAmount ? "paid" : "partially_paid";

    const [updatedInvoice] = await tx
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
  });
}

export async function executeVoidPayment(
  dbInstance: typeof db,
  input: VoidPaymentInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  if (!input.reason?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivul anulării plății este obligatoriu",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    // 1. Fetch payment to determine target invoice
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plata nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || payment.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți anula o plată din altă școală",
      });
    }

    // 2. Lock invoice first (consistent lock hierarchy)
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, payment.invoiceId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura asociată plății nu a fost găsită",
      });
    }

    // 3. Delete payment record atomically and verify deletion
    const deletedRows = await tx
      .delete(payments)
      .where(eq(payments.id, payment.id))
      .returning({ id: payments.id });

    if (deletedRows.length === 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Plata a fost deja anulată sau ștearsă de o altă sesiune",
      });
    }

    const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);

    let newStatus: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
    if (invoice.status === "cancelled") {
      newStatus = "cancelled";
    } else if (newPaidAmount >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (invoice.dueDate && invoice.dueDate < todayStr) {
        newStatus = "overdue";
      } else {
        newStatus = "issued";
      }
    }

    const voidNote = `[Plată #${payment.id} anulată (${payment.amount} lei) de user #${user.id ?? "necunoscut"}: ${input.reason.trim()}]`;
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n${voidNote}`
      : voidNote;

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return {
      success: true,
      voidedPaymentId: payment.id,
      voidedAmount: payment.amount,
      invoice: updatedInvoice,
    };
  });
}

export async function executeCancelInvoice(
  dbInstance: typeof db,
  input: CancelInvoiceInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetId = input.id ?? input.invoiceId;

  if (!targetId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "id sau invoiceId este obligatoriu",
    });
  }

  if (!input.reason?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivul anulării facturii este obligatoriu",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, targetId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || invoice.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți anula o factură din altă școală",
      });
    }

    if (invoice.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Factura este deja anulată",
      });
    }

    if (invoice.status === "paid" || (invoice.paidAmount && invoice.paidAmount > 0)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți anula o factură care are plăți înregistrate. Anulează plățile mai întâi.",
      });
    }

    const cancelNote = `[Anulată de user #${user.id ?? "necunoscut"}: ${input.reason.trim()}]`;
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n${cancelNote}`
      : cancelNote;

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        status: "cancelled",
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, targetId))
      .returning();

    return updatedInvoice;
  });
}

export type ProcessAttendanceBillingInput = {
  attendanceRecordId?: number;
  studentId: number;
  groupId: number;
  date: string;
  status: "present" | "absent" | "late" | "excused" | null;
};

export type ProcessAttendanceBillingResult =
  | { processed: true; alreadyExists: true; itemId: number }
  | { processed: true; created: true; itemId: number; invoiceId: number }
  | { processed: true; removed: true; itemId: number }
  | { processed: false; reason: string };

export async function processAttendanceBilling(
  input: ProcessAttendanceBillingInput,
  dbInstance: typeof db = db,
): Promise<ProcessAttendanceBillingResult> {
  if (!input.attendanceRecordId && input.status !== null) {
    return { processed: false, reason: "missing_record_id" };
  }

  // Attendance status "present" and "late" are billable attended sessions
  const isAttended = input.status === "present" || input.status === "late";

  return await dbInstance.transaction(async (tx) => {
    // 1. Fetch student's enrollment in this group
    const [enrollment] = await tx
      .select({
        id: studentGroupEnrollments.id,
        studentId: studentGroupEnrollments.studentId,
        groupId: studentGroupEnrollments.groupId,
        courseId: studentGroupEnrollments.courseId,
        billingType: studentGroupEnrollments.billingType,
        customPrice: studentGroupEnrollments.customPrice,
        discountPercent: studentGroupEnrollments.discountPercent,
      })
      .from(studentGroupEnrollments)
      .where(
        and(
          eq(studentGroupEnrollments.studentId, input.studentId),
          eq(studentGroupEnrollments.groupId, input.groupId),
        ),
      )
      .limit(1);

    if (!enrollment || enrollment.billingType !== "per_lesson") {
      return { processed: false, reason: "not_per_lesson" };
    }

    // 2. Check if a line item already exists for this attendance record
    let existingItem = null;
    if (input.attendanceRecordId) {
      const [item] = await tx
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.attendanceId, input.attendanceRecordId))
        .limit(1);
      existingItem = item || null;
    }

    if (isAttended) {
      // Idempotency: line item already created for this attendance record
      if (existingItem) {
        return { processed: true, alreadyExists: true, itemId: existingItem.id };
      }

      // Determine unit price
      const lessonPrice = enrollment.customPrice ?? 0;
      const discount = enrollment.discountPercent ?? 0;
      const finalPrice = discount > 0 ? Math.round(lessonPrice * (1 - discount / 100)) : lessonPrice;

      // Look for an existing draft per_lesson invoice for this student and group
      const [draftInvoice] = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, input.studentId),
            eq(invoices.groupId, input.groupId),
            eq(invoices.type, "per_lesson"),
            eq(invoices.status, "draft"),
          ),
        )
        .limit(1);

      if (draftInvoice) {
        const [createdItem] = await tx
          .insert(invoiceItems)
          .values({
            invoiceId: draftInvoice.id,
            attendanceId: input.attendanceRecordId!,
            description: `Lecție curs - ${input.date}`,
            quantity: 1,
            unitPrice: finalPrice,
            amount: finalPrice,
          })
          .returning();

        await tx
          .update(invoices)
          .set({
            totalAmount: draftInvoice.totalAmount + finalPrice,
            periodEnd: input.date,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, draftInvoice.id));

        return { processed: true, created: true, itemId: createdItem.id, invoiceId: draftInvoice.id };
      } else {
        let schoolId: number | null = null;
        const [studentRow] = await tx
          .select({ schoolId: students.schoolId })
          .from(students)
          .where(eq(students.id, input.studentId))
          .limit(1);
        if (studentRow?.schoolId) {
          schoolId = studentRow.schoolId;
        }

        const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${randomBytes(2).toString("hex").toUpperCase()}`;
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            schoolId,
            studentId: input.studentId,
            groupId: input.groupId,
            enrollmentId: enrollment.id,
            invoiceNumber,
            type: "per_lesson",
            status: "draft",
            totalAmount: finalPrice,
            paidAmount: 0,
            periodStart: input.date,
            periodEnd: input.date,
            notes: "Factură lecții per_lesson",
          })
          .returning();

        const [createdItem] = await tx
          .insert(invoiceItems)
          .values({
            invoiceId: newInvoice.id,
            attendanceId: input.attendanceRecordId!,
            description: `Lecție curs - ${input.date}`,
            quantity: 1,
            unitPrice: finalPrice,
            amount: finalPrice,
          })
          .returning();

        return { processed: true, created: true, itemId: createdItem.id, invoiceId: newInvoice.id };
      }
    } else {
      // If toggled away from present/late (absent, excused, or null/cleared)
      if (existingItem) {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, existingItem.invoiceId))
          .limit(1);

        if (invoice && invoice.status === "draft") {
          await tx
            .delete(invoiceItems)
            .where(eq(invoiceItems.id, existingItem.id));

          // Check if invoice has other items remaining
          const remainingItems = await tx
            .select({ id: invoiceItems.id })
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoice.id))
            .limit(1);

          if (remainingItems.length === 0) {
            // Delete empty draft invoice to avoid orphaned draft records
            await tx.delete(invoices).where(eq(invoices.id, invoice.id));
          } else {
            const newTotal = Math.max(0, invoice.totalAmount - existingItem.amount);
            await tx
              .update(invoices)
              .set({
                totalAmount: newTotal,
                updatedAt: new Date(),
              })
              .where(eq(invoices.id, invoice.id));
          }

          return { processed: true, removed: true, itemId: existingItem.id };
        }
      }
      return { processed: false, reason: "not_attended" };
    }
  });
}

export type BatchLessonInvoicingInput = {
  startDate: string;
  endDate: string;
  schoolId?: number;
  groupId?: number;
  studentId?: number;
  dueDate?: string;
  status?: "draft" | "issued";
};

export async function executeGenerateBatchLessonInvoices(
  dbInstance: typeof db,
  input: BatchLessonInvoicingInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? input.schoolId || user.schoolId : user.schoolId;

  if (!targetSchoolId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "schoolId este obligatoriu" });
  }

  // 1. Query attended lessons (present or late) in date range for per_lesson enrolled students
  const conditions = [
    or(eq(attendanceRecords.status, "present"), eq(attendanceRecords.status, "late")),
    gte(attendanceRecords.date, input.startDate),
    lte(attendanceRecords.date, input.endDate),
    eq(studentGroupEnrollments.billingType, "per_lesson"),
    eq(students.schoolId, targetSchoolId),
  ];

  if (input.groupId) {
    conditions.push(eq(attendanceRecords.groupId, input.groupId));
  }
  if (input.studentId) {
    conditions.push(eq(attendanceRecords.studentId, input.studentId));
  }

  const attendedLessons = await dbInstance
    .select({
      attendanceId: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      studentName: students.name,
      groupId: attendanceRecords.groupId,
      courseId: attendanceRecords.courseId,
      enrollmentId: studentGroupEnrollments.id,
      date: attendanceRecords.date,
      customPrice: studentGroupEnrollments.customPrice,
      discountPercent: studentGroupEnrollments.discountPercent,
      schoolId: students.schoolId,
    })
    .from(attendanceRecords)
    .innerJoin(
      studentGroupEnrollments,
      and(
        eq(attendanceRecords.studentId, studentGroupEnrollments.studentId),
        eq(attendanceRecords.groupId, studentGroupEnrollments.groupId),
      ),
    )
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .where(and(...conditions))
    .orderBy(asc(attendanceRecords.date));

  if (attendedLessons.length === 0) {
    return { success: true, count: 0, invoices: [], totalLessonsBilled: 0 };
  }

  // 2. Query existing invoice items bounded strictly to candidate attendance records
  const candidateAttendanceIds = attendedLessons.map((l) => l.attendanceId);
  const existingItems = await dbInstance
    .select({
      attendanceId: invoiceItems.attendanceId,
      invoiceStatus: invoices.status,
      invoiceId: invoices.id,
      amount: invoiceItems.amount,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.schoolId, targetSchoolId),
        inArray(invoiceItems.attendanceId, candidateAttendanceIds),
      ),
    );

  const alreadyBilledMap = new Map<number, { invoiceStatus: string; invoiceId: number; amount: number }>();
  for (const it of existingItems) {
    if (it.attendanceId) {
      alreadyBilledMap.set(it.attendanceId, {
        invoiceStatus: it.invoiceStatus,
        invoiceId: it.invoiceId,
        amount: it.amount,
      });
    }
  }

  // 3. Group unbilled lessons by student
  const lessonsByStudent = new Map<number, typeof attendedLessons>();
  for (const lesson of attendedLessons) {
    const existing = alreadyBilledMap.get(lesson.attendanceId);
    if (existing && existing.invoiceStatus !== "draft") {
      // Already billed in an issued or paid invoice - skip
      continue;
    }
    const list = lessonsByStudent.get(lesson.studentId) || [];
    list.push(lesson);
    lessonsByStudent.set(lesson.studentId, list);
  }

  const generatedInvoices = [];
  let totalLessonsBilled = 0;
  const invoiceStatus = input.status || "issued";

  for (const [studentId, lessons] of lessonsByStudent.entries()) {
    if (lessons.length === 0) continue;

    const firstLesson = lessons[0];

    const itemsToInsert = lessons.map((l) => {
      const basePrice = l.customPrice && l.customPrice > 0 ? l.customPrice : 0;
      const discount = l.discountPercent && l.discountPercent > 0 ? l.discountPercent : 0;
      const unitPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
      return {
        attendanceId: l.attendanceId,
        description: `Lecție curs - ${l.date}`,
        quantity: 1,
        unitPrice,
        amount: unitPrice,
      };
    });

    const totalAmount = itemsToInsert.reduce((sum, it) => sum + it.amount, 0);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${randomBytes(2).toString("hex").toUpperCase()}`;

    // Wrap each student's batch generation in a transaction to guarantee atomicity
    const createdResult = await dbInstance.transaction(async (tx) => {
      // Clean up previous draft items and adjust or delete previous draft invoices
      const impactedDraftInvoiceIds = new Set<number>();
      for (const l of lessons) {
        const existing = alreadyBilledMap.get(l.attendanceId);
        if (existing && existing.invoiceStatus === "draft") {
          impactedDraftInvoiceIds.add(existing.invoiceId);
          await tx
            .delete(invoiceItems)
            .where(eq(invoiceItems.attendanceId, l.attendanceId));
        }
      }

      // Reconcile or clean up affected draft invoices
      for (const draftInvoiceId of impactedDraftInvoiceIds) {
        const remainingItems = await tx
          .select({ id: invoiceItems.id, amount: invoiceItems.amount })
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, draftInvoiceId));

        if (remainingItems.length === 0) {
          // If no items remain, delete the draft invoice to prevent double-billing
          await tx.delete(invoices).where(eq(invoices.id, draftInvoiceId));
        } else {
          const newTotal = remainingItems.reduce((sum, item) => sum + item.amount, 0);
          await tx
            .update(invoices)
            .set({ totalAmount: newTotal, updatedAt: new Date() })
            .where(eq(invoices.id, draftInvoiceId));
        }
      }

      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          schoolId: targetSchoolId,
          studentId,
          groupId: firstLesson.groupId,
          enrollmentId: firstLesson.enrollmentId,
          invoiceNumber,
          type: "per_lesson",
          status: invoiceStatus,
          totalAmount,
          paidAmount: 0,
          dueDate: input.dueDate,
          periodStart: input.startDate,
          periodEnd: input.endDate,
          notes: `Facturare consolidată lecții (${input.startDate} - ${input.endDate})`,
        })
        .returning();

      const createdItems = await tx
        .insert(invoiceItems)
        .values(
          itemsToInsert.map((it) => ({
            invoiceId: newInvoice.id,
            attendanceId: it.attendanceId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.amount,
          })),
        )
        .returning();

      return { ...newInvoice, items: createdItems };
    });

    generatedInvoices.push(createdResult);
    totalLessonsBilled += lessons.length;
  }

  return {
    success: true,
    count: generatedInvoices.length,
    invoices: generatedInvoices,
    totalLessonsBilled,
  };
}

