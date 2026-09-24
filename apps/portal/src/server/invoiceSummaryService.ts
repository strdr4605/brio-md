import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export type InvoicesSummary = {
  totalInvoiced: number;
  totalCollected: number;
  activeDebt: number;
  overdueCount: number;
};

/**
 * Fetch count of overdue invoices for navigation badge.
 * Optimized single-query count avoiding heavy object overfetching.
 */
export async function fetchOverdueInvoicesCount(
  dbInstance: typeof db,
  user: BillingUser,
  schoolId?: number,
): Promise<number> {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? (schoolId ?? user.schoolId) : user.schoolId;

  if (!targetSchoolId && !isSuper) {
    return 0;
  }

  const conditions = [eq(invoices.status, "overdue")];
  if (targetSchoolId) {
    conditions.push(eq(invoices.schoolId, targetSchoolId));
  }

  const [result] = await dbInstance
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(and(...conditions));

  return result?.count ?? 0;
}

/**
 * Fetch aggregated KPI summary of invoices for dashboard overview cards.
 * Computes school-wide financial totals via PostgreSQL aggregation.
 */
export async function fetchInvoicesSummary(
  dbInstance: typeof db,
  user: BillingUser,
  schoolId?: number,
): Promise<InvoicesSummary> {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? (schoolId ?? user.schoolId) : user.schoolId;

  if (!targetSchoolId && !isSuper) {
    return {
      totalInvoiced: 0,
      totalCollected: 0,
      activeDebt: 0,
      overdueCount: 0,
    };
  }

  const conditions = [sql`${invoices.status} != 'cancelled'`];
  if (targetSchoolId) {
    conditions.push(eq(invoices.schoolId, targetSchoolId));
  }

  const [result] = await dbInstance
    .select({
      totalInvoiced: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)::int`,
      totalCollected: sql<number>`coalesce(sum(${invoices.paidAmount}), 0)::int`,
      activeDebt: sql<number>`coalesce(sum(case when ${invoices.status} != 'paid' then (${invoices.totalAmount} - ${invoices.paidAmount}) else 0 end), 0)::int`,
      overdueCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'overdue' then 1 else 0 end), 0)::int`,
    })
    .from(invoices)
    .where(and(...conditions));

  return {
    totalInvoiced: result?.totalInvoiced ?? 0,
    totalCollected: result?.totalCollected ?? 0,
    activeDebt: Math.max(0, result?.activeDebt ?? 0),
    overdueCount: result?.overdueCount ?? 0,
  };
}
