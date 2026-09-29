import { eq, and, ne, inArray, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invoices,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";
import {
  parseTargetMonth,
  calculateSubscriptionPrice,
  generateRecurringInvoices,
} from "./recurringBillingService";

/** Options for running the monthly subscription check cron */
export type SubscriptionCheckOptions = {
  targetMonth?: string;       // Target audit month (YYYY-MM), defaults to current
  schoolId?: number;          // Filter by specific school branch
  autoCreateMissing?: boolean;// Automatically generate draft invoices if missing
  markOverdue?: boolean;      // Mark past-due invoices (dueDate < today) as 'overdue'
  user?: BillingUser;         // Caller user context for PBAC role verification
};

/** Detailed subscription status per student */
export type StudentSubscriptionDetail = {
  studentId: number;
  studentName: string;
  schoolId: number | null;
  groupId: number;
  groupName: string;
  courseId: number | null;
  courseName: string;
  enrollmentId: number;
  billingType: string;
  monthlyFee: number;
  hasInvoice: boolean;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceStatus: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "no_invoice";
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  dueDate: string | null;
  isOverdue: boolean;
  statusComment: string;
};

/** High-level financial and quantitative audit summary */
export type SubscriptionAuditSummary = {
  targetMonth: string;
  checkedAt: string;
  totalActiveSubscriptions: number; // Total active monthly subscriptions
  upToDateCount: number;             // Paid in full
  partiallyPaidCount: number;        // Partially paid
  unpaidCount: number;               // Issued, not yet due
  overdueCount: number;              // Overdue (past due date, active debt)
  missingInvoiceCount: number;       // Active students without an invoice for target month
  invoicesMarkedOverdue: number;     // Invoices updated to 'overdue' status
  invoicesAutoCreated: number;       // Draft invoices automatically generated
  totalExpectedRevenue: number;      // Total expected tariff revenue
  totalBilledAmount: number;         // Total billed invoice amount
  totalCollectedAmount: number;      // Total collected payments
  totalOutstandingDebt: number;      // Total remaining outstanding balance
};

export type SubscriptionCheckResult = {
  success: boolean;
  summary: SubscriptionAuditSummary;
  students: StudentSubscriptionDetail[];
  markedOverdueInvoiceIds: number[];
  autoCreatedInvoiceIds: number[];
};

/**
 * Core monthly subscription audit engine:
 * Evaluates active students, detects debtors, flags overdue invoices, and compiles balances.
 */
export async function runMonthlySubscriptionCheck(
  dbInstance: typeof db,
  options: SubscriptionCheckOptions = {},
): Promise<SubscriptionCheckResult> {
  // Step 1: Initialize time window (target month YYYY-MM and today)
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const targetMonth = options.targetMonth || defaultMonth;
  const { periodStart } = parseTargetMonth(targetMonth);
  const todayStr = now.toISOString().slice(0, 10);

  // Multi-tenant school scope resolution (superadmin sees all, school admin scoped)
  const { isSuper } = getBillingRoles(options.user);
  const targetSchoolId = isSuper
    ? options.schoolId || options.user?.schoolId
    : options.user?.schoolId ?? options.schoolId;

  const markOverdue = options.markOverdue !== false;
  const autoCreateMissing = options.autoCreateMissing === true;

  // Step 2: Query active enrollments with 'subscription_monthly' billing
  const enrollmentConditions = [
    eq(studentGroupEnrollments.status, "active"),
    eq(studentGroupEnrollments.billingType, "subscription_monthly"),
  ];
  if (targetSchoolId) {
    enrollmentConditions.push(eq(groups.schoolId, targetSchoolId));
    enrollmentConditions.push(eq(students.schoolId, targetSchoolId));
  }

  const activeEnrollments = await dbInstance
    .select({
      enrollmentId: studentGroupEnrollments.id,
      studentId: studentGroupEnrollments.studentId,
      studentName: students.name,
      schoolId: groups.schoolId,
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
    .where(and(...enrollmentConditions));

  const studentIds = Array.from(new Set(activeEnrollments.map((e) => e.studentId)));

  // Step 3: Batch load all month invoices in a single query (0 N+1)
  const invoiceConditions = [
    eq(invoices.type, "subscription"),
    ne(invoices.status, "cancelled"),
    or(eq(invoices.periodStart, periodStart), ilike(invoices.periodStart, `${targetMonth}%`)),
  ];
  if (targetSchoolId) {
    invoiceConditions.push(eq(invoices.schoolId, targetSchoolId));
  } else if (studentIds.length > 0) {
    invoiceConditions.push(inArray(invoices.studentId, studentIds));
  }

  const existingInvoices = studentIds.length > 0
    ? await dbInstance
        .select({
          id: invoices.id,
          schoolId: invoices.schoolId,
          studentId: invoices.studentId,
          groupId: invoices.groupId,
          enrollmentId: invoices.enrollmentId,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          dueDate: invoices.dueDate,
          periodStart: invoices.periodStart,
          periodEnd: invoices.periodEnd,
          groupCourseId: groups.courseId,
        })
        .from(invoices)
        .leftJoin(groups, eq(invoices.groupId, groups.id))
        .where(and(...invoiceConditions))
    : [];

  // Step 4: Mark invoices past due date as 'overdue'
  const markedOverdueInvoiceIds: number[] = [];
  if (markOverdue && existingInvoices.length > 0) {
    const overdueCandidates = existingInvoices.filter(
      (inv) =>
        (inv.status === "issued" || inv.status === "partially_paid") &&
        inv.dueDate &&
        inv.dueDate < todayStr,
    );

    for (const inv of overdueCandidates) {
      await dbInstance
        .update(invoices)
        .set({ status: "overdue" })
        .where(eq(invoices.id, inv.id));
      inv.status = "overdue";
      markedOverdueInvoiceIds.push(inv.id);
    }
  }

  // Step 5: Match subscriptions to invoices and compile statistics
  const studentsDetails: StudentSubscriptionDetail[] = [];
  let upToDateCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;
  let missingInvoiceCount = 0;
  let totalExpectedRevenue = 0;
  let totalBilledAmount = 0;
  let totalCollectedAmount = 0;
  let totalOutstandingDebt = 0;

  for (const enr of activeEnrollments) {
    const finalPrice = calculateSubscriptionPrice(0, enr.customPrice, enr.discountPercent);
    totalExpectedRevenue += finalPrice;

    const matchedInvoice = existingInvoices.find(
      (inv) =>
        inv.studentId === enr.studentId &&
        (inv.enrollmentId === enr.enrollmentId ||
          inv.groupId === enr.groupId ||
          (enr.courseId && inv.groupCourseId === enr.courseId)),
    );

    // Case A: Missing invoice for active student
    if (!matchedInvoice) {
      missingInvoiceCount++;
      totalOutstandingDebt += finalPrice;
      studentsDetails.push({
        studentId: enr.studentId,
        studentName: enr.studentName,
        schoolId: enr.schoolId,
        groupId: enr.groupId,
        groupName: enr.groupName,
        courseId: enr.courseId,
        courseName: enr.courseName || enr.groupName || "Curs",
        enrollmentId: enr.enrollmentId,
        billingType: enr.billingType || "subscription_monthly",
        monthlyFee: finalPrice,
        hasInvoice: false,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: "no_invoice",
        totalAmount: 0,
        paidAmount: 0,
        debtAmount: finalPrice,
        dueDate: null,
        isOverdue: false,
        statusComment: "Lipsă factură generată pentru luna curentă",
      });
      continue;
    }

    // Case B: Existing invoice found — categorize payment status
    const total = matchedInvoice.totalAmount || 0;
    const paid = matchedInvoice.paidAmount || 0;
    const debt = Math.max(0, total - paid);
    totalBilledAmount += total;
    totalCollectedAmount += paid;
    totalOutstandingDebt += debt;

    const isOverdue =
      matchedInvoice.status === "overdue" ||
      (matchedInvoice.status !== "paid" && Boolean(matchedInvoice.dueDate && matchedInvoice.dueDate < todayStr));

    let statusComment = "";
    if (matchedInvoice.status === "paid") {
      upToDateCount++;
      statusComment = "Abonament achitat integral";
    } else if (matchedInvoice.status === "partially_paid") {
      partiallyPaidCount++;
      statusComment = `Achitat parțial (${paid}/${total} MDL)`;
    } else if (isOverdue) {
      overdueCount++;
      statusComment = `Restanță expirată la ${matchedInvoice.dueDate} (${debt} MDL)`;
    } else {
      unpaidCount++;
      statusComment = `Factură emisă, scadență: ${matchedInvoice.dueDate || "N/A"}`;
    }

    studentsDetails.push({
      studentId: enr.studentId,
      studentName: enr.studentName,
      schoolId: enr.schoolId,
      groupId: enr.groupId,
      groupName: enr.groupName,
      courseId: enr.courseId,
      courseName: enr.courseName || enr.groupName || "Curs",
      enrollmentId: enr.enrollmentId,
      billingType: enr.billingType || "subscription_monthly",
      monthlyFee: finalPrice,
      hasInvoice: true,
      invoiceId: matchedInvoice.id,
      invoiceNumber: matchedInvoice.invoiceNumber,
      invoiceStatus: matchedInvoice.status as StudentSubscriptionDetail["invoiceStatus"],
      totalAmount: total,
      paidAmount: paid,
      debtAmount: debt,
      dueDate: matchedInvoice.dueDate,
      isOverdue,
      statusComment,
    });
  }

  // Step 6: Optionally generate missing draft invoices per school
  const autoCreatedInvoiceIds: number[] = [];
  if (autoCreateMissing && missingInvoiceCount > 0) {
    const schoolsToProcess = targetSchoolId
      ? [targetSchoolId]
      : Array.from(
          new Set(
            studentsDetails
              .filter((s) => s.invoiceStatus === "no_invoice" && s.schoolId !== null)
              .map((s) => s.schoolId as number)
          )
        );

    for (const sid of schoolsToProcess) {
      try {
        const generated = await generateRecurringInvoices(
          dbInstance,
          { targetMonth, schoolId: sid, status: "draft" },
          options.user || { role: "superadmin", permissions: ["super"] },
        );
        if (generated && Array.isArray(generated.invoices)) {
          for (const inv of generated.invoices) {
            autoCreatedInvoiceIds.push(inv.id);
          }
        }
      } catch {
        // Continue processing remaining schools if one fails
      }
    }
  }

  // Step 7: Build final audit summary report
  const summary: SubscriptionAuditSummary = {
    targetMonth,
    checkedAt: now.toISOString(),
    totalActiveSubscriptions: activeEnrollments.length,
    upToDateCount,
    partiallyPaidCount,
    unpaidCount,
    overdueCount,
    missingInvoiceCount,
    invoicesMarkedOverdue: markedOverdueInvoiceIds.length,
    invoicesAutoCreated: autoCreatedInvoiceIds.length,
    totalExpectedRevenue,
    totalBilledAmount,
    totalCollectedAmount,
    totalOutstandingDebt,
  };

  return {
    success: true,
    summary,
    students: studentsDetails,
    markedOverdueInvoiceIds,
    autoCreatedInvoiceIds,
  };
}
