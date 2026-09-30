"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InvoiceIcon,
} from "@/components/ui/icons";

export type InvoiceKpiCardsProps = {
  totalInvoiced: number;
  totalCollected: number;
  activeDebt: number;
  overdueCount: number;
  isLoading?: boolean;
};

export function InvoiceKpiCards({
  totalInvoiced,
  totalCollected,
  activeDebt,
  overdueCount,
  isLoading = false,
}: InvoiceKpiCardsProps) {
  const collectionRate =
    totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 100)) : 100;

  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Facturat */}
      <MetricCard
        title="Total Facturat"
        value={
          <div className="flex items-baseline gap-1.5">
            <span>{formatMdl(totalInvoiced)}</span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
        }
        icon={<InvoiceIcon />}
        footer="Volum total facturi emise"
      />

      {/* 2. Total Încasat */}
      <MetricCard
        title="Total Încasat"
        value={
          <div className="flex items-baseline gap-1.5 text-emerald-600">
            <span>{formatMdl(totalCollected)}</span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
        }
        icon={<CheckCircleIcon />}
        footer={
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <TrendingUpIcon className="w-3.5 h-3.5" />
            Rată colectare: {collectionRate}%
          </span>
        }
      />

      {/* 3. Datorii Active */}
      <MetricCard
        title="Datorii Active"
        value={
          <div className="flex items-baseline gap-1.5">
            <span className={activeDebt > 0 ? "text-rose-600" : "text-slate-900"}>
              {formatMdl(activeDebt)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
        }
        icon={<AlertTriangleIcon />}
        footer="Restanțe neachitate în curs"
      />

      {/* 4. Facturi Restante (Overdue) */}
      <MetricCard
        title="Facturi Restante"
        value={
          <div className="flex items-baseline gap-1.5">
            <span className={overdueCount > 0 ? "text-rose-600" : "text-slate-900"}>
              {overdueCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {overdueCount === 1 ? "factură" : "facturi"}
            </span>
          </div>
        }
        icon={<AlertTriangleIcon className={overdueCount > 0 ? "text-rose-600" : ""} />}
        footer={
          overdueCount > 0 ? (
            <span className="text-rose-600 font-medium">Termen de plată depășit</span>
          ) : (
            "Nicio factură restantă"
          )
        }
        href="/dashboard/invoices?tab=overdue"
      />
    </div>
  );
}
