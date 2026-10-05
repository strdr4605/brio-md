"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  InvoiceIcon,
  BarChartIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import { BillingKpiCards } from "@/components/dashboard/invoices/BillingKpiCards";
import { RevenueDistributionChart } from "@/components/dashboard/invoices/RevenueDistributionChart";
import { DebtorsTable } from "@/components/dashboard/invoices/DebtorsTable";
import {
  FinancialStatisticsHeader,
  DatePreset,
} from "@/components/dashboard/invoices/FinancialStatisticsHeader";

type TabView = "analytics" | "debtors";

function FinancialStatisticsContent() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin =
    isSuperAdmin || permissions.includes("admin") || role === "admin";

  // Tab View from URL or default to "analytics"
  const currentTab = (searchParams.get("tab") as TabView) || "analytics";
  const activeTab: TabView = currentTab === "debtors" ? "debtors" : "analytics";

  // Filter States
  const [preset, setPreset] = useState<DatePreset>("mtd");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleTabChange = (newTab: TabView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "analytics") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Calculate Date Range based on Preset
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === "mtd") {
      const yearMonth = todayStr.slice(0, 7);
      return { from: `${yearMonth}-01`, to: todayStr };
    }

    if (preset === "ytd") {
      const year = today.getFullYear();
      return { from: `${year}-01-01`, to: todayStr };
    }

    if (preset === "custom") {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }

    return undefined;
  }, [preset, customFrom, customTo]);

  // Fetch Billing Statistics
  const {
    data: statistics,
    isLoading: isLoadingStats,
  } = trpc.billing.getStatistics.useQuery(
    {
      dateRange: dateRange,
    },
    {
      enabled: isSuperOrAdmin,
    },
  );

  // Fetch Invoices for CSV Export
  const { data: rawInvoices = [] } = trpc.billing.getInvoices.useQuery(
    {
      dateRange: dateRange,
      limit: 500,
    },
    {
      enabled: isSuperOrAdmin,
    },
  );

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
          <InvoiceIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-xs text-slate-500 mt-1">
          Analizele financiare sunt accesibile doar administratorilor și conducerii școlii.
        </p>
      </div>
    );
  }

  const paymentsCsvData = statistics?.recentPayments || [];
  const debtorsCount = statistics?.debtors?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header and Filter Toolbar */}
      <FinancialStatisticsHeader
        preset={preset}
        setPreset={setPreset}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        rawInvoices={rawInvoices}
        paymentsCsvData={paymentsCsvData}
        debtorsData={statistics?.debtors || []}
      />

      {/* Main View Mode Segmented Control (Brio DS Monochrome) */}
      <div className="border-b border-slate-200/80 pb-2">
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange("analytics")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ${
              activeTab === "analytics"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            <BarChartIcon className="w-4 h-4" />
            <span>Prezentare & Venituri</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("debtors")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ${
              activeTab === "debtors"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            <AlertTriangleIcon
              className={`w-3.5 h-3.5 ${debtorsCount > 0 ? "text-amber-500" : "text-slate-400"}`}
            />
            <span>Registru Restanțieri</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "debtors"
                  ? "bg-slate-100 text-slate-800"
                  : debtorsCount > 0
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-200/70 text-slate-500"
              }`}
            >
              {debtorsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Macro Analytics View */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          <BillingKpiCards
            collectionRate={statistics?.kpis.collectionRate || 0}
            totalRevenueCollected={statistics?.kpis.totalRevenueCollected || 0}
            totalRevenueMTD={statistics?.kpis.totalRevenueMTD || 0}
            totalActiveDebt={statistics?.kpis.totalActiveDebt || 0}
            projectedRecurringRevenue={statistics?.kpis.projectedRecurringRevenue || 0}
            totalInvoiced={statistics?.kpis.totalInvoiced || 0}
            overdueInvoicesCount={statistics?.kpis.overdueInvoicesCount || 0}
            totalDebtorsCount={statistics?.kpis.totalDebtorsCount || 0}
            isLoading={isLoadingStats}
          />

          <RevenueDistributionChart
            trends={statistics?.trends || []}
            modelDistribution={statistics?.billingModelDistribution || []}
            courseBreakdown={statistics?.courseBreakdown || []}
            groupBreakdown={statistics?.groupBreakdown || []}
            isLoading={isLoadingStats}
          />
        </div>
      )}

      {/* Tab 2: Operational Debtors Management View */}
      {activeTab === "debtors" && (
        <div className="space-y-6 animate-fade-in">
          <DebtorsTable
            debtors={statistics?.debtors || []}
            isLoading={isLoadingStats}
          />
        </div>
      )}
    </div>
  );
}

export default function FinancialStatisticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FinancialStatisticsContent />
    </Suspense>
  );
}
