import { eq, and, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";

export type StudentBillingInfo = {
  billingType: "subscription_monthly" | "subscription_course" | "per_lesson" | "custom";
  customPrice: number | null;
  discountPercent: number | null;
  finalPrice: number | null;
  hasDebt: boolean;
  debtAmount: number;
  isOverdue: boolean;
  currentMonthStatus: "paid" | "partially_paid" | "unpaid" | "no_invoice";
  currentMonthInvoiceId: number | null;
  currentMonthInvoiceNumber: string | null;
  currentMonthDueDate: string | null;
  currentMonthTotalAmount: number | null;
  currentMonthPaidAmount: number | null;
  overdueCount: number;
};

export type StudentBillingInput = {
  studentId: number;
  enrollmentId?: number | null;
  billingType?: string | null;
  customPrice?: number | null;
  discountPercent?: number | null;
};

/**
 * Attaches calculated billing summaries, debt metrics, and current month invoice
 * statuses to an array of enrolled students in a single batch query (0 N+1).
 */
export async function attachBillingInfoToStudents<T extends StudentBillingInput>(
  dbInstance: typeof db,
  studentsList: T[],
  schoolId: number | null | undefined,
  monthStr: string, // YYYY-MM
  groupId?: number | null,
  groupCoursePrice?: number | null,
): Promise<Array<T & { billing: StudentBillingInfo }>> {
  if (!studentsList || studentsList.length === 0) {
    return [];
  }

  const studentIds = Array.from(new Set(studentsList.map((s) => s.studentId)));
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-31`;

  // 1. Fetch non-cancelled invoices for all students in one batch query
  const invoiceConditions = [
    inArray(invoices.studentId, studentIds),
    ne(invoices.status, "cancelled"),
  ];

  if (schoolId) {
    invoiceConditions.push(eq(invoices.schoolId, schoolId));
  }

  let allInvoices: any[] = [];
  try {
    const res = await dbInstance
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        groupId: invoices.groupId,
        enrollmentId: invoices.enrollmentId,
        invoiceNumber: invoices.invoiceNumber,
        type: invoices.type,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        dueDate: invoices.dueDate,
        periodStart: invoices.periodStart,
        periodEnd: invoices.periodEnd,
      })
      .from(invoices)
      .where(and(...invoiceConditions));
    if (Array.isArray(res)) {
      allInvoices = res;
    }
  } catch {
    allInvoices = [];
  }

  // 2. Group invoices by student ID
  const invoicesByStudent = new Map<number, typeof allInvoices>();
  for (const inv of allInvoices) {
    const list = invoicesByStudent.get(inv.studentId) || [];
    list.push(inv);
    invoicesByStudent.set(inv.studentId, list);
  }

  // 3. Compute billing metrics per student
  return studentsList.map((student) => {
    const rawBillingType = student.billingType || "subscription_monthly";
    const billingType = (
      ["subscription_monthly", "subscription_course", "per_lesson", "custom"].includes(rawBillingType)
        ? rawBillingType
        : "subscription_monthly"
    ) as StudentBillingInfo["billingType"];

    const customPrice = student.customPrice ?? null;
    const discountPercent = student.discountPercent ?? 0;
    const basePrice = customPrice ?? groupCoursePrice ?? 0;
    const finalPrice =
      discountPercent > 0
        ? Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)))
        : basePrice;

    const studentInvoices = invoicesByStudent.get(student.studentId) || [];

    // Active debt across non-draft invoices
    const nonDraftInvoices = studentInvoices.filter((inv) => inv.status !== "draft");
    const debtAmount = nonDraftInvoices.reduce(
      (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
      0,
    );

    // Overdue invoices calculation
    const overdueInvoices = nonDraftInvoices.filter((inv) => {
      if (inv.status === "paid") return false;
      if (inv.status === "overdue") return true;
      if (inv.dueDate && inv.dueDate < todayStr) return true;
      return false;
    });
    const overdueCount = overdueInvoices.length;
    const isOverdue = overdueCount > 0;

    // Current month invoice resolution
    const groupMatches = studentInvoices.filter(
      (inv) =>
        (groupId && inv.groupId === groupId) ||
        (student.enrollmentId && inv.enrollmentId === student.enrollmentId),
    );
    const candidatePool = groupMatches.length > 0 ? groupMatches : studentInvoices;

    const currentMonthInvoice =
      candidatePool.find(
        (inv) =>
          inv.periodStart?.startsWith(monthStr) ||
          (inv.periodStart &&
            inv.periodEnd &&
            inv.periodStart <= monthEnd &&
            inv.periodEnd >= monthStart),
      ) || null;

    let currentMonthStatus: StudentBillingInfo["currentMonthStatus"] = "no_invoice";
    if (currentMonthInvoice) {
      if (currentMonthInvoice.status === "paid") {
        currentMonthStatus = "paid";
      } else if (currentMonthInvoice.status === "partially_paid") {
        currentMonthStatus = "partially_paid";
      } else {
        currentMonthStatus = "unpaid";
      }
    }

    const isMonthlyUnpaid =
      billingType === "subscription_monthly" &&
      (currentMonthStatus === "unpaid" || currentMonthStatus === "partially_paid");

    const hasDebt = debtAmount > 0 || isOverdue || isMonthlyUnpaid;

    const billing: StudentBillingInfo = {
      billingType,
      customPrice,
      discountPercent,
      finalPrice,
      hasDebt,
      debtAmount,
      isOverdue,
      currentMonthStatus,
      currentMonthInvoiceId: currentMonthInvoice?.id ?? null,
      currentMonthInvoiceNumber: currentMonthInvoice?.invoiceNumber ?? null,
      currentMonthDueDate: currentMonthInvoice?.dueDate ?? null,
      currentMonthTotalAmount: currentMonthInvoice?.totalAmount ?? null,
      currentMonthPaidAmount: currentMonthInvoice?.paidAmount ?? null,
      overdueCount,
    };

    return {
      ...student,
      billing,
    };
  });
}
