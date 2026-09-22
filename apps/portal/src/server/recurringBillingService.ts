import { eq, and, ne, or, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export const ROMANIAN_MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

export function parseTargetMonth(targetMonth: string, explicitDueDate?: string) {
  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "targetMonth trebuie să fie în format YYYY-MM valid (ex: 2026-10)",
    });
  }

  const padMonth = String(month).padStart(2, "0");
  const periodStart = `${year}-${padMonth}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const periodEnd = `${year}-${padMonth}-${String(lastDay).padStart(2, "0")}`;
  const defaultDueDay = Math.min(10, lastDay);
  const dueDate = explicitDueDate || `${year}-${padMonth}-${String(defaultDueDay).padStart(2, "0")}`;

  return { year, month, periodStart, periodEnd, dueDate, monthName: ROMANIAN_MONTHS[month - 1] };
}

export function calculateSubscriptionPrice(
  basePrice: number,
  customPrice?: number | null,
  discountPercent?: number | null,
): number {
  const rawBase = customPrice !== null && customPrice !== undefined ? customPrice : basePrice;
  const clampedBase = Math.max(0, Math.min(100_000_000, rawBase));
  const discount = discountPercent ? Math.max(0, Math.min(100, discountPercent)) : 0;
  return discount > 0 ? Math.max(0, Math.round((clampedBase * (100 - discount)) / 100)) : clampedBase;
}

export type RecurringInvoicesInput = {
  targetMonth: string;
  groupId?: number;
  schoolId?: number;
  defaultPrice?: number;
  basePrice?: number;
  dueDate?: string;
  monthName?: string;
  status?: "draft" | "issued";
  notes?: string;
};

export type CandidateDraft = {
  studentId: number;
  studentName: string;
  groupId: number;
  groupName: string;
  courseId: number;
  courseName: string;
  enrollmentId: number;
  billingType: string;
  basePrice: number;
  customPrice: number | null;
  discountPercent: number;
  finalPrice: number;
  totalAmount: number;
  lineItemDescription: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: "draft" | "issued";
};

export type CandidateSkipped = {
  studentId: number;
  studentName: string;
  groupId: number;
  groupName: string;
  courseId: number;
  courseName: string;
  enrollmentId: number;
  finalPrice: number;
  reason: string;
  existingInvoiceId: number;
};

async function getEligibleEnrollmentsAndDuplicates(
  dbInstance: typeof db,
  input: RecurringInvoicesInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? input.schoolId || user.schoolId : user.schoolId;
  if (!targetSchoolId) throw new TRPCError({ code: "BAD_REQUEST", message: "schoolId este obligatoriu" });

  if (input.groupId) {
    const [group] = await dbInstance
      .select({ id: groups.id, schoolId: groups.schoolId })
      .from(groups)
      .where(eq(groups.id, input.groupId))
      .limit(1);
    if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Grupul nu a fost găsit" });
    if (!isSuper && group.schoolId !== targetSchoolId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Grupul specificat nu aparține acestei școli" });
    }
  }

  const { periodStart, periodEnd, dueDate, monthName, year } = parseTargetMonth(input.targetMonth, input.dueDate);
  const resolvedMonthName = input.monthName || monthName;
  const defaultRate = input.defaultPrice ?? input.basePrice ?? 0;

  const conditions = [
    eq(groups.schoolId, targetSchoolId),
    eq(students.schoolId, targetSchoolId),
    eq(studentGroupEnrollments.status, "active"),
    eq(studentGroupEnrollments.billingType, "subscription_monthly"),
  ];
  if (input.groupId) conditions.push(eq(studentGroupEnrollments.groupId, input.groupId));

  const activeEnrollments = await dbInstance
    .select({
      enrollmentId: studentGroupEnrollments.id,
      studentId: studentGroupEnrollments.studentId,
      studentName: students.name,
      groupId: groups.id,
      groupName: groups.name,
      courseId: groups.courseId,
      courseName: courses.name,
      billingType: studentGroupEnrollments.billingType,
      customPrice: studentGroupEnrollments.customPrice,
      discountPercent: studentGroupEnrollments.discountPercent,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...conditions));

  const existingInvoices = await dbInstance
    .select({
      id: invoices.id,
      studentId: invoices.studentId,
      groupId: invoices.groupId,
      enrollmentId: invoices.enrollmentId,
      periodStart: invoices.periodStart,
      groupCourseId: groups.courseId,
    })
    .from(invoices)
    .leftJoin(groups, eq(invoices.groupId, groups.id))
    .where(
      and(
        eq(invoices.schoolId, targetSchoolId),
        ne(invoices.status, "cancelled"),
        or(eq(invoices.periodStart, periodStart), ilike(invoices.periodStart, `${input.targetMonth}%`)),
      ),
    );

  const readyCandidates: CandidateDraft[] = [];
  const skippedCandidates: CandidateSkipped[] = [];

  for (const enr of activeEnrollments) {
    const courseName = enr.courseName || enr.groupName || "Curs";
    const lineItemDescription = `Abonament curs ${courseName} - ${resolvedMonthName}`;
    const finalPrice = calculateSubscriptionPrice(defaultRate, enr.customPrice, enr.discountPercent);

    const dup = existingInvoices.find(
      (inv) =>
        inv.studentId === enr.studentId &&
        (inv.enrollmentId === enr.enrollmentId ||
          inv.groupId === enr.groupId ||
          (enr.courseId && inv.groupCourseId === enr.courseId)),
    );

    if (dup) {
      skippedCandidates.push({
        studentId: enr.studentId,
        studentName: enr.studentName,
        groupId: enr.groupId,
        groupName: enr.groupName,
        courseId: enr.courseId,
        courseName,
        enrollmentId: enr.enrollmentId,
        finalPrice,
        reason: "Factură activă deja existentă pentru acest curs și lună",
        existingInvoiceId: dup.id,
      });
    } else {
      readyCandidates.push({
        studentId: enr.studentId,
        studentName: enr.studentName,
        groupId: enr.groupId,
        groupName: enr.groupName,
        courseId: enr.courseId,
        courseName,
        enrollmentId: enr.enrollmentId,
        billingType: enr.billingType || "subscription_monthly",
        basePrice: defaultRate,
        customPrice: enr.customPrice,
        discountPercent: enr.discountPercent || 0,
        finalPrice,
        totalAmount: finalPrice,
        lineItemDescription,
        periodStart,
        periodEnd,
        dueDate,
        status: input.status || "draft",
      });
    }
  }

  return { targetSchoolId, year, resolvedMonthName, periodStart, periodEnd, dueDate, readyCandidates, skippedCandidates };
}

export async function previewRecurringInvoices(
  dbInstance: typeof db,
  input: RecurringInvoicesInput,
  user: BillingUser,
) {
  const { periodStart, periodEnd, dueDate, readyCandidates, skippedCandidates } =
    await getEligibleEnrollmentsAndDuplicates(dbInstance, input, user);

  const totalRevenue = readyCandidates.reduce((sum, item) => sum + item.finalPrice, 0);

  return {
    targetMonth: input.targetMonth,
    periodStart,
    periodEnd,
    dueDate,
    totalProjectedRevenue: totalRevenue,
    totalRevenue,
    totalAmount: totalRevenue,
    count: readyCandidates.length,
    createdCount: readyCandidates.length,
    skippedCount: skippedCandidates.length,
    skippedDuplicates: skippedCandidates.length,
    invoices: readyCandidates,
    items: readyCandidates,
    skipped: skippedCandidates,
  };
}

export async function generateRecurringInvoices(
  dbInstance: typeof db,
  input: RecurringInvoicesInput,
  user: BillingUser,
) {
  return await dbInstance.transaction(async (tx) => {
    const { targetSchoolId, year, resolvedMonthName, readyCandidates, skippedCandidates } =
      await getEligibleEnrollmentsAndDuplicates(tx as any, input, user);

    if (readyCandidates.length === 0) {
      return {
        createdCount: 0,
        created: 0,
        skippedCount: skippedCandidates.length,
        skippedDuplicates: skippedCandidates.length,
        totalAmount: 0,
        invoices: [],
      };
    }

    const createdInvoices = [];
    const timestampSuffix = Date.now().toString().slice(-4);

    for (let i = 0; i < readyCandidates.length; i++) {
      const item = readyCandidates[i];
      const randomPart = randomBytes(3).toString("hex").toUpperCase();
      const invoiceNumber = `INV-${year}-${timestampSuffix}-${String(i + 1).padStart(3, "0")}-${randomPart}`;

      const [createdInvoice] = await tx
        .insert(invoices)
        .values({
          schoolId: targetSchoolId,
          studentId: item.studentId,
          groupId: item.groupId,
          enrollmentId: item.enrollmentId,
          invoiceNumber,
          type: "subscription",
          status: item.status,
          totalAmount: item.finalPrice,
          paidAmount: 0,
          dueDate: item.dueDate,
          periodStart: item.periodStart,
          periodEnd: item.periodEnd,
          notes: input.notes || `Generat automat abonament curs ${item.courseName} - ${resolvedMonthName}`,
        })
        .returning();

      const [createdItem] = await tx
        .insert(invoiceItems)
        .values({
          invoiceId: createdInvoice.id,
          description: item.lineItemDescription,
          quantity: 1,
          unitPrice: item.finalPrice,
          amount: item.finalPrice,
        })
        .returning();

      createdInvoices.push({ ...createdInvoice, items: [createdItem] });
    }

    const totalAmount = createdInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      createdCount: createdInvoices.length,
      created: createdInvoices.length,
      skippedCount: skippedCandidates.length,
      skippedDuplicates: skippedCandidates.length,
      totalAmount,
      invoices: createdInvoices,
    };
  });
}
