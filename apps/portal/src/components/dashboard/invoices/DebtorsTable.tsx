"use client";

import { useState, useMemo } from "react";
import type { DebtorsListItem } from "@/server/billingStatisticsService";
import { DebtorTableRow } from "@/components/dashboard/invoices/DebtorTableRow";
import {
  SearchIcon,
  AlertTriangleIcon,
  StudentsIcon,
} from "@/components/ui/icons";

export type DebtorsTableProps = {
  debtors: DebtorsListItem[];
  isLoading?: boolean;
};

type SeverityFilter = "all" | "critical" | "recent" | "highDebt";

export function DebtorsTable({
  debtors,
  isLoading = false,
}: DebtorsTableProps) {
  const [search, setSearch] = useState("");
  const [minDebtFilter, setMinDebtFilter] = useState<number>(0);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Quick segment metrics
  const criticalCount = useMemo(
    () => debtors.filter((d) => d.overdueDays > 14).length,
    [debtors],
  );
  const recentCount = useMemo(
    () => debtors.filter((d) => d.overdueDays > 0 && d.overdueDays <= 14).length,
    [debtors],
  );
  const highDebtCount = useMemo(
    () => debtors.filter((d) => d.totalDebt >= 1000).length,
    [debtors],
  );
  const totalDebtSum = useMemo(
    () => debtors.reduce((sum, d) => sum + d.totalDebt, 0),
    [debtors],
  );

  const filteredDebtors = useMemo(() => {
    return debtors.filter((d) => {
      // Severity segment filter
      if (severityFilter === "critical" && d.overdueDays <= 14) return false;
      if (severityFilter === "recent" && (d.overdueDays === 0 || d.overdueDays > 14)) {
        return false;
      }
      if (severityFilter === "highDebt" && d.totalDebt < 1000) return false;

      // Dropdown min debt filter
      if (minDebtFilter > 0 && d.totalDebt < minDebtFilter) return false;

      // Search term
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesStudent = d.studentName.toLowerCase().includes(q);
        const matchesParent = (d.parentName || "").toLowerCase().includes(q);
        const matchesPhone =
          (d.studentPhone || "").includes(q) || (d.parentPhone || "").includes(q);
        const matchesGroup = d.groupNames.some((g: string) =>
          g.toLowerCase().includes(q),
        );
        if (!matchesStudent && !matchesParent && !matchesPhone && !matchesGroup) {
          return false;
        }
      }

      return true;
    });
  }, [debtors, search, minDebtFilter, severityFilter]);

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

  const chipBase =
    "px-4 py-1.5 rounded-full text-xs transition-colors flex items-center font-medium";
  const chipActive = "bg-slate-900 text-white";
  const chipInactive =
    "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900";

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Search / Min Debt Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <AlertTriangleIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Registru Restanțieri (Top Restanțe)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
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
          <div className="relative min-w-[200px]">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută elev, părinte sau grupă..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* Min Debt Filter */}
          <select
            value={minDebtFilter}
            onChange={(e) => setMinDebtFilter(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition cursor-pointer"
          >
            <option value={0}>Toate sumele</option>
            <option value={500}>Peste 500 MDL</option>
            <option value={1000}>Peste 1,000 MDL</option>
            <option value={2000}>Peste 2,000 MDL</option>
          </select>
        </div>
      </div>

      {/* Filter Chips + Highlighted "Datorie Totală În Registru" Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* Quick Severity Segment Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSeverityFilter("all")}
            className={`${chipBase} ${severityFilter === "all" ? chipActive : chipInactive}`}
          >
            Toate ({debtors.length})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter("critical")}
            className={`${chipBase} ${severityFilter === "critical" ? chipActive : chipInactive}`}
          >
            Mai mult de 14 zile ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter("recent")}
            className={`${chipBase} ${severityFilter === "recent" ? chipActive : chipInactive}`}
          >
            Până la 14 zile ({recentCount})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter("highDebt")}
            className={`${chipBase} ${severityFilter === "highDebt" ? chipActive : chipInactive}`}
          >
            Peste 1.000 MDL ({highDebtCount})
          </button>
        </div>

        {/* Total Debt Callout */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs self-start sm:self-auto shrink-0">
          <span className="text-xs font-medium text-slate-600">
            Datorie Totală:
          </span>
          <span className="text-sm font-black text-rose-600 tracking-tight tabular-nums">
            {formatMdl(totalDebtSum)} MDL
          </span>
        </div>
      </div>

      {/* Debtors List / Table */}
      {filteredDebtors.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-2">
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
              {filteredDebtors.map((debtor) => (
                <DebtorTableRow
                  key={debtor.studentId}
                  debtor={debtor}
                  formatMdl={formatMdl}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
