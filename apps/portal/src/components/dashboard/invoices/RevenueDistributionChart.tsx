"use client";

import { useState } from "react";
import type {
  MonthlyTrendItem,
  BillingModelDistributionItem,
  CourseRevenueItem,
  GroupRevenueItem,
} from "@/server/billingStatisticsService";
import { BookOpenIcon, UsersIcon, BarChartIcon } from "@/components/ui/icons";

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
  const [activeTab, setActiveTab] = useState<"courses" | "groups">("courses");

  const formatMdl = (val: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-2xl border border-slate-200/70" />
        <div className="h-80 bg-slate-100 rounded-2xl border border-slate-200/70" />
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
      {/* Top Row: Monthly Trend (2 cols) & Model Distribution (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5 text-blue-600" />
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
                <span className="w-3 h-3 rounded-md bg-blue-600 inline-block" />
                <span className="text-slate-600">Facturat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
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
                const billedHeight = Math.max(4, Math.round((t.billed / maxMonthlyVal) * 100));
                const collectedHeight = Math.max(4, Math.round((t.collected / maxMonthlyVal) * 100));

                return (
                  <div key={t.month} className="flex-1 flex flex-col items-center min-w-[50px] group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-12 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none shadow-md whitespace-nowrap z-20">
                      <div>Facturat: {formatMdl(t.billed)} MDL</div>
                      <div>Încasat: {formatMdl(t.collected)} MDL ({t.collectionRate}%)</div>
                    </div>

                    {/* Bars pair */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                      {/* Billed bar */}
                      <div
                        className="w-1/2 max-w-[20px] bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 hover:brightness-110"
                        style={{ height: `${billedHeight}%` }}
                        title={`Facturat: ${formatMdl(t.billed)} MDL`}
                      />
                      {/* Collected bar */}
                      <div
                        className="w-1/2 max-w-[20px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 hover:brightness-110"
                        style={{ height: `${collectedHeight}%` }}
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

        {/* 2. Revenue Distribution by Billing Model */}
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

      {/* Bottom Section: Course & Group Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Analiză Venituri pe Cursuri & Grupe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Venituri facturate, încasate și datorii per curs sau grupă
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("courses")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "courses"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
              <span>Cursuri ({courseBreakdown.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groups")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "groups"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" />
              <span>Grupe ({groupBreakdown.length})</span>
            </button>
          </div>
        </div>

        {/* Courses Table View */}
        {activeTab === "courses" && (
          <div className="overflow-x-auto">
            {courseBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nu există facturi asociate vreunui curs în perioada selectată.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Curs</th>
                    <th className="py-2.5 px-3 text-center">Elevi</th>
                    <th className="py-2.5 px-3 text-right">Facturat</th>
                    <th className="py-2.5 px-3 text-right">Încasat</th>
                    <th className="py-2.5 px-3 text-right">Restant</th>
                    <th className="py-2.5 px-3 text-right">Rată Colectare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseBreakdown.map((c) => (
                    <tr key={c.courseId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.courseName}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {c.studentCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatMdl(c.billed)} MDL
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {formatMdl(c.collected)} MDL
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">
                        {c.debt > 0 ? `${formatMdl(c.debt)} MDL` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${c.collectionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 min-w-[28px] text-right">
                            {c.collectionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Groups Table View */}
        {activeTab === "groups" && (
          <div className="overflow-x-auto">
            {groupBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nu există facturi asociate vreunei grupe în perioada selectată.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Grupă</th>
                    <th className="py-2.5 px-3">Curs</th>
                    <th className="py-2.5 px-3 text-right">Facturat</th>
                    <th className="py-2.5 px-3 text-right">Încasat</th>
                    <th className="py-2.5 px-3 text-right">Datorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupBreakdown.map((g) => (
                    <tr key={g.groupId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {g.groupName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {g.courseName}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatMdl(g.billed)} MDL
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {formatMdl(g.collected)} MDL
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">
                        {g.debt > 0 ? `${formatMdl(g.debt)} MDL` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
