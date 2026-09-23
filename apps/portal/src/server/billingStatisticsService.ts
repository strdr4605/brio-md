import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invoices,
  payments,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export type GetBillingStatisticsInput = {
  dateRange?: {
    from?: string;
    to?: string;
  };
  schoolId?: number;
};

export type DebtorsListItem = {
  studentId: number;
  studentName: string;
  studentPhone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  totalDebt: number;
  unpaidInvoicesCount: number;
  earliestDueDate: string | null;
  overdueDays: number;
  groupNames: string[];
};

export type MonthlyTrendItem = {
  month: string; // "YYYY-MM"
  monthLabel: string; // "Sep 2026"
  billed: number;
  collected: number;
  collectionRate: number;
};

export type BillingModelDistributionItem = {
  type: "subscription" | "per_lesson" | "situational";
  label: string;
  count: number;
  billed: number;
  collected: number;
  percentage: number;
};

export type CourseRevenueItem = {
  courseId: number;
  courseName: string;
  billed: number;
  collected: number;
  debt: number;
  studentCount: number;
  collectionRate: number;
};

export type GroupRevenueItem = {
  groupId: number;
  groupName: string;
  courseName: string;
  billed: number;
  collected: number;
  debt: number;
};

export type BillingStatisticsResult = {
  kpis: {
    collectionRate: number;
    totalRevenueCollected: number;
    totalRevenueMTD: number;
    totalActiveDebt: number;
    projectedRecurringRevenue: number;
    totalInvoiced: number;
    overdueInvoicesCount: number;
    totalDebtorsCount: number;
  };
  trends: MonthlyTrendItem[];
  billingModelDistribution: BillingModelDistributionItem[];
  courseBreakdown: CourseRevenueItem[];
  groupBreakdown: GroupRevenueItem[];
  debtors: DebtorsListItem[];
};

const ROMANIAN_MONTH_NAMES: Record<string, string> = {
  "01": "Ian",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mai",
  "06": "Iun",
  "07": "Iul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Noi",
  "12": "Dec",
};

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const monthName = ROMANIAN_MONTH_NAMES[month] || month;
  return `${monthName} ${year}`;
}

export async function fetchBillingStatistics(
  dbInstance: typeof db,
  input: GetBillingStatisticsInput | undefined,
  user: BillingUser,
): Promise<BillingStatisticsResult> {
  const { isSuper } = getBillingRoles(user);

  // PBAC & Multi-tenant scoping
  let targetSchoolId: number | undefined = undefined;
  if (!isSuper) {
    if (!user.schoolId) {
      return getEmptyBillingStatisticsResult();
    }
    targetSchoolId = user.schoolId;
  } else if (input?.schoolId) {
    targetSchoolId = input.schoolId;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const currentYearMonth = todayStr.slice(0, 7);

  // 1. Fetch Invoices (excluding cancelled)
  const invoiceConditions = [ne(invoices.status, "cancelled")];
  if (targetSchoolId !== undefined) {
    invoiceConditions.push(eq(invoices.schoolId, targetSchoolId));
  }

  const allInvoices = await dbInstance
    .select({
      id: invoices.id,
      schoolId: invoices.schoolId,
      studentId: invoices.studentId,
      studentName: students.name,
      studentPhone: students.phone,
      parentName: students.parentName,
      parentPhone: students.parentPhone,
      groupId: invoices.groupId,
      groupName: groups.name,
      courseId: groups.courseId,
      courseName: courses.name,
      invoiceNumber: invoices.invoiceNumber,
      type: invoices.type,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      periodStart: invoices.periodStart,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(students, eq(invoices.studentId, students.id))
    .leftJoin(groups, eq(invoices.groupId, groups.id))
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...invoiceConditions));

  // 2. Fetch Payments
  const paymentConditions = [];
  if (targetSchoolId !== undefined) {
    paymentConditions.push(eq(payments.schoolId, targetSchoolId));
  }

  const allPayments = await dbInstance
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      studentId: payments.studentId,
      schoolId: payments.schoolId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(paymentConditions.length > 0 ? and(...paymentConditions) : undefined);

  // 3. Fetch Active Subscriptions for Projected Recurring Revenue (MRR)
  const enrollmentConditions = [eq(studentGroupEnrollments.status, "active")];
  if (targetSchoolId !== undefined) {
    enrollmentConditions.push(eq(groups.schoolId, targetSchoolId));
  }

  const activeEnrollments = await dbInstance
    .select({
      id: studentGroupEnrollments.id,
      billingType: studentGroupEnrollments.billingType,
      customPrice: studentGroupEnrollments.customPrice,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .where(and(...enrollmentConditions));

  const projectedRecurringRevenue = activeEnrollments
    .filter((e) => e.billingType === "subscription_monthly")
    .reduce((sum, e) => sum + (e.customPrice || 0), 0);

  // Date Range filtering helpers
  const fromDate = input?.dateRange?.from;
  const toDate = input?.dateRange?.to;

  function isInDateRange(dateStr: string | null | undefined): boolean {
    if (!fromDate && !toDate) return true;
    if (!dateStr) return false;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }

  // Filter invoices for the selected period (by dueDate or createdAt)
  const filteredInvoices = allInvoices.filter((inv) => {
    const refDate = inv.dueDate || (inv.createdAt ? inv.createdAt.toISOString().slice(0, 10) : null);
    return isInDateRange(refDate);
  });

  // Filter payments for the selected period (by paymentDate)
  const filteredPayments = allPayments.filter((p) => {
    return isInDateRange(p.paymentDate);
  });

  // Total Revenue MTD (Month-to-Date: payments in current calendar month)
  const totalRevenueMTD = allPayments
    .filter((p) => p.paymentDate && p.paymentDate.startsWith(currentYearMonth))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Total Collected in selected period
  const totalRevenueCollected = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Total Invoiced in selected period
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // Collection Rate for the period
  const collectionRate =
    totalInvoiced > 0
      ? Math.min(100, Math.round((totalRevenueCollected / totalInvoiced) * 100))
      : totalRevenueCollected > 0
        ? 100
        : 0;

  // Active Debt: across ALL non-cancelled active invoices (issued, partially_paid, overdue)
  const activeUnpaidInvoices = allInvoices.filter(
    (inv) => inv.status !== "draft" && (inv.totalAmount || 0) > (inv.paidAmount || 0),
  );

  const totalActiveDebt = activeUnpaidInvoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0,
  );

  const overdueInvoicesCount = activeUnpaidInvoices.filter((inv) => {
    if (inv.status === "overdue") return true;
    if (inv.dueDate && inv.dueDate < todayStr) return true;
    return false;
  }).length;

  // 4. Monthly Trends (last 6-12 months)
  const monthMap = new Map<string, { billed: number; collected: number }>();

  // Determine months to display: last 6 months or months in date range
  const monthsSet = new Set<string>();

  // Default: populate the last 6 months up to current month
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const m = d.toISOString().slice(0, 7);
    monthsSet.add(m);
  }

  // Also include months present in filtered invoices and payments
  for (const inv of filteredInvoices) {
    const m = (inv.dueDate || (inv.createdAt ? inv.createdAt.toISOString().slice(0, 10) : "")).slice(0, 7);
    if (m && m.length === 7) monthsSet.add(m);
  }
  for (const p of filteredPayments) {
    const m = p.paymentDate.slice(0, 7);
    if (m && m.length === 7) monthsSet.add(m);
  }

  const sortedMonths = Array.from(monthsSet).sort();
  // Keep the most relevant trailing months (max 12)
  const finalMonths = sortedMonths.slice(-12);

  for (const m of finalMonths) {
    monthMap.set(m, { billed: 0, collected: 0 });
  }

  for (const inv of allInvoices) {
    const m = (inv.dueDate || (inv.createdAt ? inv.createdAt.toISOString().slice(0, 10) : "")).slice(0, 7);
    if (monthMap.has(m)) {
      const curr = monthMap.get(m)!;
      curr.billed += inv.totalAmount || 0;
    }
  }

  for (const p of allPayments) {
    const m = p.paymentDate.slice(0, 7);
    if (monthMap.has(m)) {
      const curr = monthMap.get(m)!;
      curr.collected += p.amount || 0;
    }
  }

  const trends: MonthlyTrendItem[] = finalMonths.map((m) => {
    const data = monthMap.get(m)!;
    const rate =
      data.billed > 0
        ? Math.min(100, Math.round((data.collected / data.billed) * 100))
        : data.collected > 0
          ? 100
          : 0;
    return {
      month: m,
      monthLabel: formatMonthLabel(m),
      billed: data.billed,
      collected: data.collected,
      collectionRate: rate,
    };
  });

  // 5. Billing Model Distribution
  const modelStats: Record<
    "subscription" | "per_lesson" | "situational",
    { count: number; billed: number; collected: number }
  > = {
    subscription: { count: 0, billed: 0, collected: 0 },
    per_lesson: { count: 0, billed: 0, collected: 0 },
    situational: { count: 0, billed: 0, collected: 0 },
  };

  const modelLabels: Record<"subscription" | "per_lesson" | "situational", string> = {
    subscription: "Abonament lunar",
    per_lesson: "Per ședință",
    situational: "Situațional / Eveniment",
  };

  for (const inv of filteredInvoices) {
    const t = inv.type as "subscription" | "per_lesson" | "situational";
    if (modelStats[t]) {
      modelStats[t].count += 1;
      modelStats[t].billed += inv.totalAmount || 0;
      modelStats[t].collected += inv.paidAmount || 0;
    }
  }

  const totalModelBilled =
    modelStats.subscription.billed + modelStats.per_lesson.billed + modelStats.situational.billed;

  const billingModelDistribution: BillingModelDistributionItem[] = (
    ["subscription", "per_lesson", "situational"] as const
  ).map((type) => {
    const st = modelStats[type];
    const percentage =
      totalModelBilled > 0 ? Math.round((st.billed / totalModelBilled) * 100) : 0;
    return {
      type,
      label: modelLabels[type],
      count: st.count,
      billed: st.billed,
      collected: st.collected,
      percentage,
    };
  });

  // 6. Course & Group Breakdown
  const courseMap = new Map<
    number,
    {
      courseName: string;
      billed: number;
      collected: number;
      debt: number;
      students: Set<number>;
    }
  >();

  const groupMap = new Map<
    number,
    {
      groupName: string;
      courseName: string;
      billed: number;
      collected: number;
      debt: number;
    }
  >();

  for (const inv of filteredInvoices) {
    const debt = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));

    // Course
    if (inv.courseId) {
      if (!courseMap.has(inv.courseId)) {
        courseMap.set(inv.courseId, {
          courseName: inv.courseName || `Curs #${inv.courseId}`,
          billed: 0,
          collected: 0,
          debt: 0,
          students: new Set<number>(),
        });
      }
      const c = courseMap.get(inv.courseId)!;
      c.billed += inv.totalAmount || 0;
      c.collected += inv.paidAmount || 0;
      c.debt += debt;
      if (inv.studentId) c.students.add(inv.studentId);
    }

    // Group
    if (inv.groupId) {
      if (!groupMap.has(inv.groupId)) {
        groupMap.set(inv.groupId, {
          groupName: inv.groupName || `Grupa #${inv.groupId}`,
          courseName: inv.courseName || "Curs comun",
          billed: 0,
          collected: 0,
          debt: 0,
        });
      }
      const g = groupMap.get(inv.groupId)!;
      g.billed += inv.totalAmount || 0;
      g.collected += inv.paidAmount || 0;
      g.debt += debt;
    }
  }

  const courseBreakdown: CourseRevenueItem[] = Array.from(courseMap.entries())
    .map(([courseId, data]) => {
      const rate =
        data.billed > 0
          ? Math.min(100, Math.round((data.collected / data.billed) * 100))
          : data.collected > 0
            ? 100
            : 0;
      return {
        courseId,
        courseName: data.courseName,
        billed: data.billed,
        collected: data.collected,
        debt: data.debt,
        studentCount: data.students.size,
        collectionRate: rate,
      };
    })
    .sort((a, b) => b.billed - a.billed);

  const groupBreakdown: GroupRevenueItem[] = Array.from(groupMap.entries())
    .map(([groupId, data]) => ({
      groupId,
      groupName: data.groupName,
      courseName: data.courseName,
      billed: data.billed,
      collected: data.collected,
      debt: data.debt,
    }))
    .sort((a, b) => b.billed - a.billed);

  // 7. Debtors List (Top Restanțieri)
  const studentDebtorMap = new Map<
    number,
    {
      studentId: number;
      studentName: string;
      studentPhone: string | null;
      parentName: string | null;
      parentPhone: string | null;
      totalDebt: number;
      unpaidInvoicesCount: number;
      earliestDueDate: string | null;
      groups: Set<string>;
    }
  >();

  for (const inv of activeUnpaidInvoices) {
    const debt = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
    if (debt <= 0) continue;

    if (!studentDebtorMap.has(inv.studentId)) {
      studentDebtorMap.set(inv.studentId, {
        studentId: inv.studentId,
        studentName: inv.studentName,
        studentPhone: inv.studentPhone,
        parentName: inv.parentName,
        parentPhone: inv.parentPhone,
        totalDebt: 0,
        unpaidInvoicesCount: 0,
        earliestDueDate: null,
        groups: new Set<string>(),
      });
    }

    const debtor = studentDebtorMap.get(inv.studentId)!;
    debtor.totalDebt += debt;
    debtor.unpaidInvoicesCount += 1;

    if (inv.groupName) {
      debtor.groups.add(inv.groupName);
    }

    if (inv.dueDate) {
      if (!debtor.earliestDueDate || inv.dueDate < debtor.earliestDueDate) {
        debtor.earliestDueDate = inv.dueDate;
      }
    }
  }

  const debtors: DebtorsListItem[] = Array.from(studentDebtorMap.values())
    .map((d) => {
      let overdueDays = 0;
      if (d.earliestDueDate && d.earliestDueDate < todayStr) {
        const diffMs = today.getTime() - new Date(`${d.earliestDueDate}T00:00:00Z`).getTime();
        overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        studentId: d.studentId,
        studentName: d.studentName,
        studentPhone: d.studentPhone,
        parentName: d.parentName,
        parentPhone: d.parentPhone,
        totalDebt: d.totalDebt,
        unpaidInvoicesCount: d.unpaidInvoicesCount,
        earliestDueDate: d.earliestDueDate,
        overdueDays,
        groupNames: Array.from(d.groups),
      };
    })
    .sort((a, b) => {
      // Sort primarily by total debt descending, then by overdue days descending
      if (b.totalDebt !== a.totalDebt) {
        return b.totalDebt - a.totalDebt;
      }
      return b.overdueDays - a.overdueDays;
    });

  return {
    kpis: {
      collectionRate,
      totalRevenueCollected,
      totalRevenueMTD,
      totalActiveDebt,
      projectedRecurringRevenue,
      totalInvoiced,
      overdueInvoicesCount,
      totalDebtorsCount: debtors.length,
    },
    trends,
    billingModelDistribution,
    courseBreakdown,
    groupBreakdown,
    debtors,
  };
}

function getEmptyBillingStatisticsResult(): BillingStatisticsResult {
  return {
    kpis: {
      collectionRate: 0,
      totalRevenueCollected: 0,
      totalRevenueMTD: 0,
      totalActiveDebt: 0,
      projectedRecurringRevenue: 0,
      totalInvoiced: 0,
      overdueInvoicesCount: 0,
      totalDebtorsCount: 0,
    },
    trends: [],
    billingModelDistribution: [
      { type: "subscription", label: "Abonament lunar", count: 0, billed: 0, collected: 0, percentage: 0 },
      { type: "per_lesson", label: "Per ședință", count: 0, billed: 0, collected: 0, percentage: 0 },
      { type: "situational", label: "Situațional / Eveniment", count: 0, billed: 0, collected: 0, percentage: 0 },
    ],
    courseBreakdown: [],
    groupBreakdown: [],
    debtors: [],
  };
}
