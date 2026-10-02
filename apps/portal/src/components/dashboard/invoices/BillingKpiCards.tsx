"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
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

  const isHighCollection = collectionRate >= 85;
  const isMediumCollection = collectionRate >= 65 && collectionRate < 85;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Collection Rate (%) */}
      <MetricCard
        title="Rata de Colectare"
        value={
          <div className="flex items-baseline gap-2">
            <span
              className={
                isHighCollection
                  ? "text-emerald-600"
                  : isMediumCollection
                    ? "text-amber-600"
                    : "text-rose-600"
              }
            >
              {collectionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              din {formatMdl(totalInvoiced)} MDL
            </span>
          </div>
        }
        icon={<TrendingUpIcon />}
        footer={
          <div className="w-full">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
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
            <span className="text-[11px] text-slate-500 block truncate">
              {isHighCollection
                ? "Performanță excelentă de colectare"
                : isMediumCollection
                  ? "Nivel moderat de încasare"
                  : "Atenție: risc ridicat de restanțe"}
            </span>
          </div>
        }
      />

      {/* 2. Total Revenue MTD */}
      <MetricCard
        title="Încasări Luna Curentă (MTD)"
        value={
          <div className="flex items-baseline gap-1.5">
            <span>{formatMdl(totalRevenueMTD)}</span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
        }
        icon={<CheckCircleIcon />}
        footer={`În perioada: ${formatMdl(totalRevenueCollected)} MDL`}
      />

      {/* 3. Total Active Debt */}
      <MetricCard
        title="Datorie Totală Activă"
        href="?tab=debtors"
        value={
          <div className="flex items-baseline gap-1.5">
            <span className={totalActiveDebt > 0 ? "text-rose-600" : "text-slate-900"}>
              {formatMdl(totalActiveDebt)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
        }
        icon={<AlertTriangleIcon className={totalActiveDebt > 0 ? "text-rose-600" : ""} />}
        footer={`${totalDebtorsCount} ${totalDebtorsCount === 1 ? "restanțier" : "restanțieri"} (${overdueInvoicesCount} facturi depășite)`}
      />

      {/* 4. Projected Recurring Revenue (MRR) */}
      <MetricCard
        title="Venit Recurent Proiectat (MRR)"
        value={
          <div className="flex items-baseline gap-1.5">
            <span>{formatMdl(projectedRecurringRevenue)}</span>
            <span className="text-xs font-semibold text-slate-500">MDL / lună</span>
          </div>
        }
        icon={<SparklesIcon />}
        footer="Estimare pe baza abonamentelor active"
      />
    </div>
  );
}
