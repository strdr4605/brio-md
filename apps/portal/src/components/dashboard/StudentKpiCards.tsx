"use client";

import {
  StudentsIcon,
  UserCheckIcon,
  BookOpenIcon,
  SchoolIcon,
} from "@/components/ui/icons";

type Props = {
  totalStudents: number;
  enrolledCount: number;
  unenrolledCount: number;
  schoolsCount: number;
};

export function StudentKpiCards({
  totalStudents,
  enrolledCount,
  unenrolledCount,
  schoolsCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-3.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <StudentsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase truncate block">Total Studenți</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5 sm:mt-1">{totalStudents}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-3.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <UserCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase truncate block">Înrolați în Curs</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5 sm:mt-1">{enrolledCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-3.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase truncate block">Fără Curs</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5 sm:mt-1">{unenrolledCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-3.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <SchoolIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase truncate block">Școli Active</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5 sm:mt-1">{schoolsCount}</p>
        </div>
      </div>
    </div>
  );
}
