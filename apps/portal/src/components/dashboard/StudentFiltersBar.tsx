"use client";

import { SearchIcon } from "@/components/ui/icons";

type Props = {
  search: string;
  setSearch: (val: string) => void;
  selectedSchoolId: number | "all";
  setSelectedSchoolId: (val: number | "all") => void;
  schools: { id: number; name: string }[];
  courseFilter: "all" | "enrolled" | "unenrolled";
  setCourseFilter: (val: "all" | "enrolled" | "unenrolled") => void;
};

export function StudentFiltersBar({
  search,
  setSearch,
  selectedSchoolId,
  setSelectedSchoolId,
  schools,
  courseFilter,
  setCourseFilter,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="relative w-full md:w-80">
        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Caută după nume, telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {schools.length > 1 && (
          <select
            value={selectedSchoolId}
            onChange={(e) =>
              setSelectedSchoolId(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toate Școlile</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value as any)}
          className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="all">Toate Cursurile</option>
          <option value="enrolled">Doar Înrolați</option>
          <option value="unenrolled">Fără Curs Asignat</option>
        </select>
      </div>
    </div>
  );
}
