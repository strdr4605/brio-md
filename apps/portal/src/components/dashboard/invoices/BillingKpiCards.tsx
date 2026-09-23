"use client";

import {
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InvoiceIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export type BillingKpiCardsProps = {
  collectionRate: number;
  totalRevenueCollected: number;
  totalRevenueMTD: number;
  totalActiveDebt: number;
  projectedRecurringRevenue: number;
  totalInvoiced: number;
  overdueInvoicesCount: number;
  totalDebtorsCount: number;
  isLoading?: boolean;
};

export function BillingKpiCards({
  collectionRate,
  totalRevenueCollected,
  totalRevenueMTD,
  totalActiveDebt,
  projectedRecurringRevenue,
  totalInvoiced,
  overdueInvoicesCount,
  totalDebtorsCount,
  isLoading = false,
}: BillingKpiCardsProps) {
  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200/70" />
        ))}
      </div>
    );
  }

  // Collection Rate styling
  const isHighCollection = collectionRate >= 85;
  const isMediumCollection = collectionRate >= 65 && collectionRate < 85;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Collection Rate (%) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Rata de Colectare
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isHighCollection
                ? "bg-emerald-50 text-emerald-600"
                : isMediumCollection
                  ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-600"
            }`}
          >
            <TrendingUpIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${
                isHighCollection
                  ? "text-emerald-700"
                  : isMediumCollection
                    ? "text-amber-700"
                    : "text-rose-700"
              }`}
            >
              {collectionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              din {formatMdl(totalInvoiced)} MDL
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHighCollection
                  ? "bg-emerald-500"
                  : isMediumCollection
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isHighCollection
              ? "Performanță excelentă de colectare"
              : isMediumCollection
                ? "Nivel moderat de încasare"
                : "Atenție: risc ridicat de restanțe"}
          </p>
        </div>
      </div>

      {/* 2. Total Revenue MTD */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Încasări Luna Curentă (MTD)
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircleIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatMdl(totalRevenueMTD)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-slate-500">
            <InvoiceIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="text-[11px] font-medium truncate">
              În perioada selectată: <span className="font-bold text-slate-700">{formatMdl(totalRevenueCollected)} MDL</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Total Active Debt */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Datorie Totală Activă
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangleIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-amber-700 tracking-tight">
              {formatMdl(totalActiveDebt)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {totalDebtorsCount} {totalDebtorsCount === 1 ? "restanțier" : "restanțieri"}
            </span>
            <span className="text-[11px] text-slate-400">
              {overdueInvoicesCount} facturi depășite
            </span>
          </div>
        </div>
      </div>

      {/* 4. Projected Recurring Revenue (MRR) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Venit Recurent Proiectat (MRR)
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-indigo-700 tracking-tight">
              {formatMdl(projectedRecurringRevenue)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL / lună</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Estimare pe baza abonamentelor active
          </p>
        </div>
      </div>
    </div>
  );
}
