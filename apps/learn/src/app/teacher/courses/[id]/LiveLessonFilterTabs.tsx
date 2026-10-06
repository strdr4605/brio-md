"use client";

export type FilterTab = "present" | "all" | "unmarked" | "late" | "absent" | "restricted";

type Props = {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts: {
    present: number;
    total: number;
    unmarked: number;
    late: number;
    absent: number;
    restricted: number;
  };
  search: string;
  onSearchChange: (search: string) => void;
};

export function LiveLessonFilterTabs({
  activeTab,
  onTabChange,
  counts,
  search,
  onSearchChange,
}: Props) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-3 sm:p-4 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
      {/* Search Input on the Left (like ACAMIS top search bar) */}
      <div className="relative max-w-sm w-full">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search students by name or code..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full text-xs border border-slate-300 bg-white rounded-[4px] pl-9 pr-8 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs on the Right */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* Prezenți (Default view) */}
        <button
          type="button"
          onClick={() => onTabChange("present")}
          className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
            activeTab === "present"
              ? "bg-[#15803d] text-white border-[#15803d] shadow-2xs"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>Prezenți</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === "present" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts.present}
          </span>
        </button>

        {/* Toți */}
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
            activeTab === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>Toți</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts.total}
          </span>
        </button>

        {/* Nemarcați */}
        <button
          type="button"
          onClick={() => onTabChange("unmarked")}
          className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
            activeTab === "unmarked"
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>Nemarcați</span>
          {counts.unmarked > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
              {counts.unmarked}
            </span>
          )}
        </button>

        {/* Întârziați */}
        <button
          type="button"
          onClick={() => onTabChange("late")}
          className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
            activeTab === "late"
              ? "bg-[#d97706] text-white border-[#d97706] shadow-2xs"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>Întârziați</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === "late" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts.late}
          </span>
        </button>

        {/* Absenți */}
        <button
          type="button"
          onClick={() => onTabChange("absent")}
          className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
            activeTab === "absent"
              ? "bg-[#e11d48] text-white border-[#e11d48] shadow-2xs"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>Absenți</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === "absent" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts.absent}
          </span>
        </button>

        {/* Restricționați */}
        {counts.restricted > 0 && (
          <button
            type="button"
            onClick={() => onTabChange("restricted")}
            className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-wider text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === "restricted"
                ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span>Restricționați</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-bold">
              {counts.restricted}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
