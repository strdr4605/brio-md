"use client";

import { SearchIcon } from "@/components/ui/icons";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between flex-wrap">
      <div className="relative w-full sm:w-80">
        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("students.searchPlaceholder", "Caută după nume sau telefon...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 h-9 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-wrap">
        {schools.length > 1 && (
          <select
            value={selectedSchoolId}
            onChange={(e) =>
              setSelectedSchoolId(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-auto"
          >
            <option value="all">{t("students.allSchools", "Toate Școlile")}</option>
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
          className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-auto"
        >
          <option value="all">{t("students.allCourses", "Toate Cursurile")}</option>
          <option value="enrolled">{t("students.enrolledOnly", "Doar Înrolați")}</option>
          <option value="unenrolled">{t("students.unenrolledOnly", "Fără Curs Asignat")}</option>
        </select>
      </div>
    </div>
  );
}
