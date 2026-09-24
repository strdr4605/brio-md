"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  InvoiceIcon,
  BarChartIcon,
  CalendarIcon,
  SchoolIcon,
} from "@/components/ui/icons";
import { BillingKpiCards } from "@/components/dashboard/invoices/BillingKpiCards";
import { RevenueDistributionChart } from "@/components/dashboard/invoices/RevenueDistributionChart";
import { DebtorsTable } from "@/components/dashboard/invoices/DebtorsTable";
import { ExportCsvModal } from "@/components/dashboard/invoices/ExportCsvModal";

type DatePreset = "mtd" | "last30" | "ytd" | "all" | "custom";

export default function FinancialStatisticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin =
    isSuperAdmin || permissions.includes("admin") || role === "admin";

  // Filter States
  const [preset, setPreset] = useState<DatePreset>("mtd");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "all">("all");

  // Fetch Schools for Superadmin
  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  // Calculate Date Range based on Preset
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === "mtd") {
      const yearMonth = todayStr.slice(0, 7);
      return { from: `${yearMonth}-01`, to: todayStr };
    }

    if (preset === "last30") {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: past.toISOString().slice(0, 10), to: todayStr };
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

    // "all"
    return undefined;
  }, [preset, customFrom, customTo]);

  // Fetch Billing Statistics
  const {
    data: statistics,
    isLoading: isLoadingStats,
    refetch,
  } = trpc.billing.getStatistics.useQuery(
    {
      schoolId: selectedSchoolId !== "all" ? selectedSchoolId : undefined,
      dateRange: dateRange,
    },
    {
      enabled: isSuperOrAdmin,
    },
  );

  // Fetch Invoices and Payments for CSV Export
  const { data: rawInvoices = [] } = trpc.billing.getInvoices.useQuery(
    {
      schoolId: selectedSchoolId !== "all" ? selectedSchoolId : undefined,
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
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <InvoiceIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-xs text-slate-500 mt-1">
          Analizele financiare sunt accesibile doar administratorilor și conducerii școlii.
        </p>
      </div>
    );
  }

  // Payments data prepared for CSV export
  const paymentsCsvData = statistics?.recentPayments || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Statistici Financiare & Restanțieri
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Dashboard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitorizează indicatorii de încasare, veniturile recurente și gestionează restanțele elevilor.
          </p>
        </div>

        {/* View Switcher Tabs: Invoices vs Statistics */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
          >
            <InvoiceIcon className="w-3.5 h-3.5" />
            <span>Registru Facturi</span>
          </Link>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-xs transition-all"
          >
            <BarChartIcon className="w-3.5 h-3.5" />
            <span>Statistici & Restanțieri</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Perioadă:</span>
          </span>

          <button
            type="button"
            onClick={() => setPreset("mtd")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === "mtd"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Luna Curentă (MTD)
          </button>

          <button
            type="button"
            onClick={() => setPreset("last30")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === "last30"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Ultimele 30 zile
          </button>

          <button
            type="button"
            onClick={() => setPreset("ytd")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === "ytd"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Anul Curent (YTD)
          </button>

          <button
            type="button"
            onClick={() => setPreset("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === "all"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Toate Timpurile
          </button>

          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === "custom"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Personalizat
          </button>
        </div>

        {/* Right Section: Superadmin School Selector & Export CSV */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Superadmin School Filter */}
          {isSuperAdmin && schools.length > 0 && (
            <div className="flex items-center gap-1.5">
              <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSchoolId}
                onChange={(e) =>
                  setSelectedSchoolId(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Toate Școlile</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all active:scale-95 shadow-xs"
            title="Reîmprospătează statisticile"
            aria-label="Reîmprospătează statisticile"
          >
            <svg
              className={`w-4 h-4 ${isLoadingStats ? "animate-spin text-blue-600" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>

          {/* Export CSV Modal Button */}
          <ExportCsvModal
            invoicesData={rawInvoices}
            paymentsData={paymentsCsvData}
            debtorsData={statistics?.debtors || []}
          />
        </div>
      </div>

      {/* Custom Date Range Picker Fields */}
      {preset === "custom" && (
        <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-200/60 flex flex-wrap items-center gap-3 animate-fade-in text-xs">
          <span className="font-bold text-blue-900">Alege intervalul:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-600">De la:</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-600">Până la:</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* 1. Visual KPI Cards */}
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

      {/* 2. Monthly Trend Chart, Model Distribution & Course Breakdown */}
      <RevenueDistributionChart
        trends={statistics?.trends || []}
        modelDistribution={statistics?.billingModelDistribution || []}
        courseBreakdown={statistics?.courseBreakdown || []}
        groupBreakdown={statistics?.groupBreakdown || []}
        isLoading={isLoadingStats}
      />

      {/* 3. Debtors List (Top Restanțieri) with ParentCallWidget */}
      <DebtorsTable
        debtors={statistics?.debtors || []}
        isLoading={isLoadingStats}
      />
    </div>
  );
}
