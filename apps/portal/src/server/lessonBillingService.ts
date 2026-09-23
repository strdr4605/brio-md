import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  students,
  studentGroupEnrollments,
} from "@/db/schema";

export type ProcessAttendanceBillingInput = {
  attendanceRecordId?: number | null;
  studentId: number;
  groupId: number;
  date: string;
  status: "present" | "absent" | "late" | "excused" | null;
};

export async function processAttendanceBilling(
  input: ProcessAttendanceBillingInput,
  dbInstance: typeof db = db,
) {
  if (!input.attendanceRecordId && input.status !== null) {
    return { processed: false, reason: "missing_record_id" };
  }

  // 1. Fetch student's enrollment in this group
  const selectBuilder = dbInstance?.select?.({
    id: studentGroupEnrollments.id,
    studentId: studentGroupEnrollments.studentId,
    groupId: studentGroupEnrollments.groupId,
    courseId: studentGroupEnrollments.courseId,
    billingType: studentGroupEnrollments.billingType,
    customPrice: studentGroupEnrollments.customPrice,
    discountPercent: studentGroupEnrollments.discountPercent,
  });

  if (!selectBuilder || typeof selectBuilder.from !== "function") {
    return { processed: false, reason: "mock_db_unsupported" };
  }

  const fromBuilder = selectBuilder.from(studentGroupEnrollments);
  if (!fromBuilder || typeof fromBuilder.where !== "function") {
    return { processed: false, reason: "mock_db_unsupported" };
  }

  const whereBuilder = fromBuilder.where(
    and(
      eq(studentGroupEnrollments.studentId, input.studentId),
      eq(studentGroupEnrollments.groupId, input.groupId),
    ),
  );

  const enrollmentRows =
    typeof whereBuilder?.limit === "function"
      ? await whereBuilder.limit(1)
      : await whereBuilder;
  const enrollment = Array.isArray(enrollmentRows) ? enrollmentRows[0] : null;

  if (!enrollment || enrollment.billingType !== "per_lesson") {
    return { processed: false, reason: "not_per_lesson" };
  }

  // 2. Check if a line item already exists for this attendance record
  let existingItem = null;
  if (input.attendanceRecordId) {
    const [item] = await dbInstance
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.attendanceId, input.attendanceRecordId))
      .limit(1);
    existingItem = item || null;
  }

  const isBilledStatus = input.status === "present" || input.status === "late";

  const executeTx =
    typeof dbInstance?.transaction === "function"
      ? (fn: (tx: any) => Promise<any>) => dbInstance.transaction(fn)
      : (fn: (tx: any) => Promise<any>) => fn(dbInstance);

  if (isBilledStatus) {
    // Idempotency: line item already created for this attendance record
    if (existingItem) {
      return { processed: true, alreadyExists: true, itemId: existingItem.id };
    }

    // Determine unit price
    const lessonPrice = enrollment.customPrice ?? 0;
    const discount = enrollment.discountPercent ?? 0;
    const finalPrice = discount > 0 ? Math.round(lessonPrice * (1 - discount / 100)) : lessonPrice;

    return await executeTx(async (tx) => {
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

        const invoiceNumber = `INV-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
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
    });
  } else {
    // If toggled away from present/late (absent, excused, or null)
    if (existingItem) {
      return await executeTx(async (tx) => {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, existingItem.invoiceId))
          .limit(1);

        if (invoice && invoice.status === "draft") {
          await tx
            .delete(invoiceItems)
            .where(eq(invoiceItems.id, existingItem.id));

          const newTotal = Math.max(0, invoice.totalAmount - existingItem.amount);
          await tx
            .update(invoices)
            .set({
              totalAmount: newTotal,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoice.id));

          return { processed: true, removed: true, itemId: existingItem.id };
        }
        return { processed: false, reason: "invoice_not_draft" };
      });
    }
    return { processed: false, reason: "not_billed_status" };
  }
}
