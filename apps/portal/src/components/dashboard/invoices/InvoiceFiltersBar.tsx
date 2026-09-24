"use client";

import { SearchIcon, FilterIcon, XIcon } from "@/components/ui/icons";

export type StatusTab = "all" | "unpaid" | "overdue" | "paid";

export type InvoiceFiltersBarProps = {
  search: string;
  setSearch: (value: string) => void;
  statusTab: StatusTab;
  setStatusTab: (tab: StatusTab) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  groupIdFilter: string;
  setGroupIdFilter: (groupId: string) => void;
  groups: Array<{ id: number; name: string; courseName?: string }>;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
};

export function InvoiceFiltersBar({
  search,
  setSearch,
  statusTab,
  setStatusTab,
  typeFilter,
  setTypeFilter,
  groupIdFilter,
  setGroupIdFilter,
  groups,
  onResetFilters,
  hasActiveFilters,
}: InvoiceFiltersBarProps) {
  const tabs: Array<{ id: StatusTab; label: string }> = [
    { id: "all", label: "Toate" },
    { id: "unpaid", label: "Neachitate" },
    { id: "overdue", label: "Restante" },
    { id: "paid", label: "Achitate" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
      {/* Top: Status Tabs + Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const active = statusTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusTab(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? "bg-white text-slate-900 shadow-xs scale-[1.01]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Caută student sau # factură..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom: Secondary Filters (Type, Group, Reset) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mr-1">
          <FilterIcon className="w-3.5 h-3.5" />
          <span>Filtrează:</span>
        </div>

        {/* Type Select */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="all">Toate tipurile de factură</option>
          <option value="subscription">Abonament lunar</option>
          <option value="per_lesson">Plată per lecție</option>
          <option value="situational">Situativ / Ad-hoc</option>
        </select>

        {/* Group Select */}
        <select
          value={groupIdFilter}
          onChange={(e) => setGroupIdFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[200px] truncate"
        >
          <option value="all">Toate grupele</option>
          {groups.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name} {g.courseName ? `(${g.courseName})` : ""}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
          >
            <XIcon className="w-3.5 h-3.5" />
            <span>Resetează filtrele</span>
          </button>
        )}
      </div>
    </div>
  );
}
