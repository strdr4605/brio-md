"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { DebtorsListItem } from "@/server/billingStatisticsService";
import { ParentCallWidget } from "@/components/dashboard/ParentCallWidget";
import {
  SearchIcon,
  AlertTriangleIcon,
  StudentsIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

export type DebtorsTableProps = {
  debtors: DebtorsListItem[];
  isLoading?: boolean;
};

export function DebtorsTable({ debtors, isLoading = false }: DebtorsTableProps) {
  const [search, setSearch] = useState("");
  const [minDebtFilter, setMinDebtFilter] = useState<number>(0);

  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredDebtors = useMemo(() => {
    return debtors.filter((d) => {
      if (minDebtFilter > 0 && d.totalDebt < minDebtFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesStudent = d.studentName.toLowerCase().includes(q);
        const matchesParent = (d.parentName || "").toLowerCase().includes(q);
        const matchesPhone = (d.studentPhone || "").includes(q) || (d.parentPhone || "").includes(q);
        const matchesGroup = d.groupNames.some((g: string) => g.toLowerCase().includes(q));
        if (!matchesStudent && !matchesParent && !matchesPhone && !matchesGroup) {
          return false;
        }
      }

      return true;
    });
  }, [debtors, search, minDebtFilter]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangleIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Registru Restanțieri (Top Restanțe)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {filteredDebtors.length} {filteredDebtors.length === 1 ? "elev" : "elevi"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Elevi cu facturi neachitate, ordonați după valoarea soldului și durata întârzierii.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută elev, părinte sau grupă..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Min Debt Filter */}
          <select
            value={minDebtFilter}
            onChange={(e) => setMinDebtFilter(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          >
            <option value={0}>Toate datoriile</option>
            <option value={500}>Peste 500 MDL</option>
            <option value={1000}>Peste 1,000 MDL</option>
            <option value={2000}>Peste 2,000 MDL</option>
          </select>
        </div>
      </div>

      {/* Debtors List / Table */}
      {filteredDebtors.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <StudentsIcon className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700 text-sm">Nicio restanță găsită!</p>
          <p className="text-slate-500 mt-0.5">
            {debtors.length === 0
              ? "Toate facturile emise sunt achitate sau nu există restanțe active."
              : "Nu există restanțieri care să corespundă filtrelor selectate."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">Elev</th>
                <th className="py-3 px-3">Grupe Înscrise</th>
                <th className="py-3 px-3">Contact Părinte (Apel Direct)</th>
                <th className="py-3 px-3 text-center">Facturi Restante</th>
                <th className="py-3 px-3">Zile Întârziere</th>
                <th className="py-3 px-3 text-right">Datorie Totală</th>
                <th className="py-3 px-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebtors.map((debtor) => {
                const isOverdue = debtor.overdueDays > 0;
                const isSevere = debtor.overdueDays > 14;

                return (
                  <tr
                    key={debtor.studentId}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Student Name & Direct Profile Link */}
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/dashboard/students/${debtor.studentId}`}
                        className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5"
                      >
                        <span>{debtor.studentName}</span>
                        <ChevronRightIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                      </Link>
                      {debtor.studentPhone && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {debtor.studentPhone}
                        </p>
                      )}
                    </td>

                    {/* Groups */}
                    <td className="py-3.5 px-3">
                      {debtor.groupNames.length === 0 ? (
                        <span className="text-slate-400 italic">Fără grupă</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {debtor.groupNames.map((g: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Parent Contact & ParentCallWidget */}
                    <td className="py-3.5 px-3">
                      <ParentCallWidget
                        parentName={debtor.parentName}
                        parentPhone={debtor.parentPhone}
                        compact={true}
                      />
                    </td>

                    {/* Unpaid Invoices Count */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {debtor.unpaidInvoicesCount}
                      </span>
                    </td>

                    {/* Overdue Duration */}
                    <td className="py-3.5 px-3">
                      {isOverdue ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isSevere
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          <AlertTriangleIcon className="w-3 h-3 shrink-0" />
                          <span>{debtor.overdueDays} zile</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">
                          În termen (0 zile)
                        </span>
                      )}
                      {debtor.earliestDueDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Scadență: {debtor.earliestDueDate}
                        </p>
                      )}
                    </td>

                    {/* Total Debt */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="text-sm font-black text-rose-700 tracking-tight">
                        {formatMdl(debtor.totalDebt)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1">
                        MDL
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/dashboard/students/${debtor.studentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition"
                      >
                        <span>Fișă Elev</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
