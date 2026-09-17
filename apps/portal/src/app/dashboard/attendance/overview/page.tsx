"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceMatrix } from "@/components/dashboard/AttendanceMatrix";
import { ChevronDownIcon, CalendarIcon, UsersIcon, TrendingUpIcon } from "@/components/ui/icons";

export default function AttendanceOverviewPage() {
  const { data: session, status: authStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  // Current month default: YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 1. Fetch courses list
  const { data: coursesList = [] } = trpc.course.list.useQuery(
    { active: true },
    { enabled: isSuperOrAdmin },
  );

  // 2. Fetch groups list (filtered by selectedCourseId if set)
  const { data: groupsList = [], isLoading: isGroupsLoading } = trpc.group.list.useQuery(
    {
      courseId: selectedCourseId || undefined,
      active: true,
    },
    { enabled: isSuperOrAdmin },
  );

  // Automatically select first group when groups are loaded
  const currentGroupId =
    selectedGroupId && groupsList.some((g) => g.id === selectedGroupId)
      ? selectedGroupId
      : groupsList.length > 0
        ? groupsList[0].id
        : null;

  // 3. Fetch attendance matrix data
  const {
    data: matrixData,
    isLoading: isMatrixLoading,
    refetch: refetchMatrix,
  } = trpc.attendance.getMatrix.useQuery(
    {
      groupId: currentGroupId as number,
      month: selectedMonth || undefined,
    },
    {
      enabled: isSuperOrAdmin && !!currentGroupId,
      refetchOnWindowFocus: false,
    },
  );

  if (authStatus === "loading") {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Se încarcă sesiunea...
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-fade-in">
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Doar administratorii au permisiunea de a vizualiza matricea istorică și analitica de prezență.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Sub-nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Matrice & Istoric Prezență
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perspectivă globală pe lecțiile trecute, analiza absențelor și modificări retroactive.
          </p>
        </div>

        {/* Tab Switcher: Daily Catalog vs Historical Matrix */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
          <Link
            href="/dashboard/attendance"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Catalog Zilnic
          </Link>
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-xs">
            Matrice & Istoric
          </span>
        </div>
      </div>

      {/* Filter Bar: Course, Group, and Month Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Course Filter */}
        <div className="relative min-w-[160px]">
          <select
            value={selectedCourseId || ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedCourseId(val);
              setSelectedGroupId(null);
            }}
            className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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

        {/* Group Selector */}
        <div className="relative min-w-[180px]">
          <select
            value={currentGroupId || ""}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            disabled={isGroupsLoading || groupsList.length === 0}
            className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
          >
            {groupsList.length === 0 ? (
              <option value="">Nicio grupă disponibilă</option>
            ) : (
              groupsList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.courseName})
                </option>
              ))
            )}
          </select>
          <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Month Selector */}
        <div className="relative flex items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Analytics Summary KPI Cards */}
      {matrixData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Elevi Înrolați
              </span>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">
                {matrixData.summary.totalStudents}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Sesiuni Desfășurate
              </span>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">
                {matrixData.summary.totalDates}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUpIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Prezență Medie Grupă
              </span>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">
                {matrixData.summary.groupAttendanceRate}%
              </p>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
            matrixData.summary.atRiskCount > 0 ? "border-rose-200 bg-rose-50/20" : "border-slate-200/80"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              matrixData.summary.atRiskCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
            }`}>
              ⚠️
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Elevi în Risc (3+ Absențe)
              </span>
              <p className={`text-xl font-black leading-none mt-1 ${
                matrixData.summary.atRiskCount > 0 ? "text-rose-600" : "text-slate-900"
              }`}>
                {matrixData.summary.atRiskCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Matrix Content */}
      {isMatrixLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
          <p className="text-sm font-medium text-slate-400">
            Se generează matricea istorică de prezență...
          </p>
        </div>
      ) : matrixData && currentGroupId ? (
        <AttendanceMatrix
          groupId={currentGroupId}
          groupName={matrixData.group.name}
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
