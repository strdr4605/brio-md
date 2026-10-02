"use client";

import { useState } from "react";
import type {
  CourseRevenueItem,
  GroupRevenueItem,
} from "@/server/billingStatisticsService";
import { BookOpenIcon, UsersIcon } from "@/components/ui/icons";

export type CourseGroupBreakdownProps = {
  courseBreakdown: CourseRevenueItem[];
  groupBreakdown: GroupRevenueItem[];
  formatMdl: (val: number) => string;
};

export function CourseGroupBreakdown({
  courseBreakdown,
  groupBreakdown,
  formatMdl,
}: CourseGroupBreakdownProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "groups">("courses");

  return (
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
                ? "bg-white text-slate-900 shadow-xs"
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
                ? "bg-white text-slate-900 shadow-xs"
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
  );
}
