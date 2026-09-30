"use client";

import { trpc } from "@/lib/trpc";
import { AttendanceMatrix } from "@/components/dashboard/AttendanceMatrix";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  ChevronDownIcon,
  CalendarIcon,
  UsersIcon,
  TrendingUpIcon,
  DoorIcon,
} from "@/components/ui/icons";

export type AttendanceMatrixTabProps = {
  coursesList: { id: number; name: string }[];
  filteredGroups: Array<{
    id: number;
    name: string;
    courseId?: number | null;
    courseName?: string | null;
  }>;
  selectedCourseId: number | null;
  onSelectCourseId: (id: number | null) => void;
  selectedGroupId: number | null;
  onSelectGroupId: (id: number | null) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  isGroupsLoading: boolean;
  isSuperOrAdmin: boolean;
};

export function AttendanceMatrixTab({
  coursesList,
  filteredGroups,
  selectedCourseId,
  onSelectCourseId,
  selectedGroupId,
  onSelectGroupId,
  selectedMonth,
  onSelectMonth,
  isGroupsLoading,
  isSuperOrAdmin,
}: AttendanceMatrixTabProps) {
  const {
    data: matrixData,
    isLoading: isMatrixLoading,
    refetch: refetchMatrix,
  } = trpc.attendance.getMatrix.useQuery(
    {
      groupId: selectedGroupId as number,
      month: selectedMonth || undefined,
    },
    {
      enabled: isSuperOrAdmin && Boolean(selectedGroupId),
      refetchOnWindowFocus: false,
    },
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar: Course, Group, and Month */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Curs
          </label>
          <div className="relative">
            <select
              value={selectedCourseId || ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onSelectCourseId(val);
                onSelectGroupId(null);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
            >
              <option value="">Toate cursurile</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Grupă
          </label>
          <div className="relative">
            <select
              value={selectedGroupId || ""}
              onChange={(e) => onSelectGroupId(Number(e.target.value))}
              disabled={isGroupsLoading || filteredGroups.length === 0}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition disabled:opacity-50"
            >
              {filteredGroups.length === 0 ? (
                <option value="">Nicio grupă disponibilă</option>
              ) : (
                filteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.courseName ? `(${g.courseName})` : ""}
                  </option>
                ))
              )}
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="relative flex flex-col min-w-[140px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Luna
          </label>
          <div className="relative flex items-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="pl-8 pr-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
            />
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Analytics Summary KPI Cards using standard MetricCard */}
      {matrixData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Elevi Înrolați"
            value={matrixData.summary.totalStudents}
            icon={<UsersIcon className="w-5 h-5 text-slate-700" />}
          />
          <MetricCard
            title="Sesiuni Desfășurate"
            value={matrixData.summary.totalDates}
            icon={<CalendarIcon className="w-5 h-5 text-slate-700" />}
          />
          <MetricCard
            title="Prezență Medie Grupă"
            value={`${matrixData.summary.groupAttendanceRate}%`}
            icon={<TrendingUpIcon className="w-5 h-5 text-slate-700" />}
          />
          <MetricCard
            title="Elevi în Risc"
            value={
              <span
                className={
                  matrixData.summary.atRiskCount > 0
                    ? "text-rose-600"
                    : "text-slate-900"
                }
              >
                {matrixData.summary.atRiskCount}
              </span>
            }
            icon={<DoorIcon className="w-5 h-5 text-slate-700" />}
            footer="3+ absențe înregistrate"
          />
        </div>
      )}

      {/* Matrix View */}
      {isMatrixLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
          <p className="text-sm font-medium text-slate-400">
            Se generează matricea istorică de prezență...
          </p>
        </div>
      ) : matrixData && selectedGroupId ? (
        <AttendanceMatrix
          groupId={selectedGroupId}
          dates={matrixData.dates}
          students={matrixData.students}
          onRefresh={() => refetchMatrix()}
        />
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">
            Selectați o grupă pentru a afișa matricea de prezență.
          </p>
        </div>
      )}
    </div>
  );
}
