"use client";

import type {
  MonthlyTrendItem,
  BillingModelDistributionItem,
  CourseRevenueItem,
  GroupRevenueItem,
} from "@/server/billingStatisticsService";
import { BarChartIcon } from "@/components/ui/icons";
import { CourseGroupBreakdown } from "@/components/dashboard/invoices/CourseGroupBreakdown";

export type RevenueDistributionChartProps = {
  trends: MonthlyTrendItem[];
  modelDistribution: BillingModelDistributionItem[];
  courseBreakdown: CourseRevenueItem[];
  groupBreakdown: GroupRevenueItem[];
  isLoading?: boolean;
};

export function RevenueDistributionChart({
  trends,
  modelDistribution,
  courseBreakdown,
  groupBreakdown,
  isLoading = false,
}: RevenueDistributionChartProps) {
  const formatMdl = (val: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/70" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-100 rounded-2xl border border-slate-200/70" />
          <div className="h-80 bg-slate-100 rounded-2xl border border-slate-200/70" />
        </div>
      </div>
    );
  }

  // Find max value for scaling monthly bars
  const maxMonthlyVal = Math.max(
    1,
    ...trends.flatMap((t) => [t.billed, t.collected]),
  );

  return (
    <div className="space-y-6">
      {/* 1. Top Section: Course & Group Breakdown Table */}
      <CourseGroupBreakdown
        courseBreakdown={courseBreakdown}
        groupBreakdown={groupBreakdown}
        formatMdl={formatMdl}
      />

      {/* 2. Bottom Row: Monthly Trend (2 cols) & Model Distribution (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Evoluție Lunară: Facturat vs Încasat
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparație între volumul facturat și plățile încasate pe luni
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-400 inline-block" />
                <span className="text-slate-600">Facturat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                <span className="text-slate-600">Încasat</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Area */}
          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Nu există date pentru perioada selectată.
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-56 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
              {trends.map((t) => {
                const billedHeight =
                  t.billed > 0
                    ? Math.max(6, Math.round((t.billed / maxMonthlyVal) * 100))
                    : 0;
                const collectedHeight =
                  t.collected > 0
                    ? Math.max(6, Math.round((t.collected / maxMonthlyVal) * 100))
                    : 0;

                return (
                  <div
                    key={t.month}
                    className="flex-1 flex flex-col items-center min-w-[50px] group"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-12 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none shadow-md whitespace-nowrap z-20">
                      <div>Facturat: {formatMdl(t.billed)} MDL</div>
                      <div>
                        Încasat: {formatMdl(t.collected)} MDL ({t.collectionRate}%)
                      </div>
                    </div>

                    {/* Bars pair */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                      {/* Billed bar */}
                      <div
                        className={`w-1/2 max-w-[20px] rounded-t-md transition-all duration-300 ${
                          t.billed > 0
                            ? "bg-slate-400 hover:bg-slate-500"
                            : "bg-slate-200/60 h-1 rounded-full"
                        }`}
                        style={{
                          height: t.billed > 0 ? `${billedHeight}%` : undefined,
                        }}
                        title={`Facturat: ${formatMdl(t.billed)} MDL`}
                      />
                      {/* Collected bar */}
                      <div
                        className={`w-1/2 max-w-[20px] rounded-t-md transition-all duration-300 ${
                          t.collected > 0
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : "bg-slate-200/60 h-1 rounded-full"
                        }`}
                        style={{
                          height:
                            t.collected > 0 ? `${collectedHeight}%` : undefined,
                        }}
                        title={`Încasat: ${formatMdl(t.collected)} MDL`}
                      />
                    </div>

                    {/* Month Label */}
                    <div className="mt-2 text-center">
                      <span className="block text-[11px] font-bold text-slate-700 truncate">
                        {t.monthLabel}
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-400">
                        {t.collectionRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Distribution by Billing Model */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Distribuție Modele Facturare
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ponderea veniturilor pe tipuri de pachete
            </p>

            <div className="mt-6 space-y-5">
              {modelDistribution.map((m) => {
                const colorBg =
                  m.type === "subscription"
                    ? "bg-blue-600"
                    : m.type === "per_lesson"
                      ? "bg-emerald-500"
                      : "bg-purple-500";

                return (
                  <div key={m.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorBg}`} />
                        <span className="font-bold text-slate-800">{m.label}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {m.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorBg}`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>{m.count} facturi</span>
                      <span className="font-semibold text-slate-700">
                        {formatMdl(m.billed)} MDL facturat
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Model principal:</span>
            <span className="font-bold text-blue-600">
              {modelDistribution[0]?.label || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
