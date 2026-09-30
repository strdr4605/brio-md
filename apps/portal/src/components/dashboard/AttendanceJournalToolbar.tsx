"use client";

import { AlertTriangleIcon, CheckCircleIcon, SearchIcon } from "@/components/ui/icons";

export type JournalFilterMode = "all" | "debt" | "paid";

export type AttendanceJournalToolbarProps = {
  filterMode: JournalFilterMode;
  onFilterChange: (mode: JournalFilterMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalStudents: number;
  debtCount: number;
  paidCount: number;
  totalDebtAmount?: number;
};

export function AttendanceJournalToolbar({
  filterMode,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalStudents,
  debtCount,
  paidCount,
  totalDebtAmount = 0,
}: AttendanceJournalToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xs">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Filtrează:
        </span>

        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
            filterMode === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          Toți ({totalStudents})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("debt")}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
            filterMode === "debt"
              ? "bg-rose-600 text-white shadow-2xs"
              : debtCount > 0
                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          {debtCount > 0 && <AlertTriangleIcon className="w-3 h-3 text-rose-600 shrink-0" />}
          <span>Restanțieri ({debtCount})</span>
          {totalDebtAmount > 0 && (
            <span className="text-[10px] opacity-85 font-mono">
              (-{totalDebtAmount}L)
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("paid")}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
            filterMode === "paid"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <CheckCircleIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Achitați ({paidCount})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center min-w-[160px] sm:min-w-[200px]">
        <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Caută elev..."
          className="w-full pl-8 pr-3 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
