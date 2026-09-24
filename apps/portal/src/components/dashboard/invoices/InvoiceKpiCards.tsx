"use client";

import { TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon, InvoiceIcon } from "@/components/ui/icons";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Facturat */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Facturat
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <InvoiceIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatMdl(totalInvoiced)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Volum total facturi emise</p>
        </div>
      </div>

      {/* 2. Total Încasat */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Încasat
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircleIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatMdl(totalCollected)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingUpIcon className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[11px] font-semibold text-emerald-600">
              Rată colectare: {collectionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* 3. Datorii Active */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Datorii Active
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangleIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 tracking-tight">
              {formatMdl(activeDebt)}
            </span>
            <span className="text-xs font-semibold text-slate-500">MDL</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Restanțe neachitate în curs</p>
        </div>
      </div>

      {/* 4. Facturi Restante (Overdue) */}
      <div
        className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-colors ${
          overdueCount > 0
            ? "bg-rose-50/40 border-rose-200 hover:border-rose-300"
            : "bg-white border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Facturi Restante
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              overdueCount > 0
                ? "bg-rose-100 text-rose-600 font-bold"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {overdueCount > 0 ? "!" : "0"}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black tracking-tight ${
                overdueCount > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {overdueCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {overdueCount === 1 ? "factură" : "facturi"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {overdueCount > 0 ? "Termen de plată depășit" : "Nicio factură restantă"}
          </p>
        </div>
      </div>
    </div>
  );
}
