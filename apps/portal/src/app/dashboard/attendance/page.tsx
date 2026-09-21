"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceGroupPicker } from "@/components/dashboard/AttendanceGroupPicker";
import { AttendanceJournalTable } from "@/components/dashboard/AttendanceJournalTable";
import { AttendanceSheet } from "@/components/dashboard/AttendanceSheet";
import { AttendanceMatrix } from "@/components/dashboard/AttendanceMatrix";
import {
  ChevronDownIcon,
  CalendarIcon,
  UsersIcon,
  TrendingUpIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";
  const isTeacher = permissions.includes("teach") || role === "teacher";
  const canAccessAttendance = isSuperOrAdmin || isTeacher;

  const urlGroupId = searchParams.get("groupId");
  const isFullscreenParam = searchParams.get("fullscreen") === "true";
  const promptParam = searchParams.get("prompt") as "in_progress" | "uncompleted" | null;
  const tabParam = searchParams.get("tab") as "journal" | "take" | "matrix" | null;

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  }, []);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);

  const [activeTab, setActiveTab] = useState<"journal" | "take" | "matrix">(
    tabParam === "take" || tabParam === "matrix" ? tabParam : "journal",
  );

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    urlGroupId ? Number(urlGroupId) : null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Sync state if URL search params change
  useEffect(() => {
    if (urlGroupId) {
      setSelectedGroupId(Number(urlGroupId));
    }
  }, [urlGroupId]);

  // Sync status
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Fetch groups list (automatically scoped to teacher by groupRouter.list)
  const { data: groupsList = [], isLoading: isGroupsLoading } = trpc.group.list.useQuery(
    { active: true },
    { enabled: canAccessAttendance },
  );

  // Distinct courses available from retrieved groups
  const coursesList = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of groupsList) {
      if (g.courseId && g.courseName) {
        map.set(g.courseId, g.courseName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [groupsList]);

  const filteredGroups = useMemo(() => {
    if (!selectedCourseId) return groupsList;
    return groupsList.filter((g) => g.courseId === selectedCourseId);
  }, [groupsList, selectedCourseId]);

  const selectedDayCode = useMemo(() => {
    if (!selectedDate) return "";
    const parts = selectedDate.split("-").map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return "";
    }
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return DAY_MAP[d.getDay()] || "";
  }, [selectedDate]);

  // Auto-select smart group for "take" and "matrix" tabs if none selected
  useEffect(() => {
    if (activeTab === "journal") return;
    if (filteredGroups.length === 0) {
      setSelectedGroupId(null);
      return;
    }
    if (selectedGroupId && filteredGroups.some((g) => g.id === selectedGroupId)) {
      return;
    }
    if (filteredGroups.length === 1) {
      setSelectedGroupId(filteredGroups[0].id);
      if (!selectedCourseId && filteredGroups[0].courseId) {
        setSelectedCourseId(filteredGroups[0].courseId);
      }
      return;
    }
    const scheduledForToday = filteredGroups.find((g) =>
      g.scheduleDays?.some((day) => day.toLowerCase() === selectedDayCode),
    );
    if (scheduledForToday) {
      setSelectedGroupId(scheduledForToday.id);
      if (!selectedCourseId && scheduledForToday.courseId) {
        setSelectedCourseId(scheduledForToday.courseId);
      }
    } else {
      setSelectedGroupId(filteredGroups[0].id);
      if (!selectedCourseId && filteredGroups[0].courseId) {
        setSelectedCourseId(filteredGroups[0].courseId);
      }
    }
  }, [activeTab, filteredGroups, selectedGroupId, selectedDayCode, selectedCourseId]);

  const activeGroup = useMemo(
    () => groupsList.find((g) => g.id === selectedGroupId),
    [groupsList, selectedGroupId],
  );

  // Fetch single-day attendance sheet for "take" tab
  const {
    data: sheetData = [],
    isLoading: isSheetLoading,
    refetch: refetchSheet,
  } = trpc.attendance.getSheet.useQuery(
    {
      groupId: selectedGroupId as number,
      date: selectedDate,
    },
    {
      enabled: activeTab === "take" && !!selectedGroupId && !!selectedDate,
      refetchOnWindowFocus: false,
    },
  );

  const submitMutation = trpc.attendance.submit.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      refetchSheet();
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  const handleSaveAttendance = async (
    records: {
      studentId: number;
      status: "present" | "absent" | "late" | "excused";
      comment?: string | null;
    }[],
  ) => {
    if (!selectedGroupId || !selectedDate) return;
    setSaveStatus("idle");
    await submitMutation.mutateAsync({
      groupId: selectedGroupId,
      date: selectedDate,
      records,
    });
  };

  // Fetch attendance matrix data for "matrix" tab
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
      enabled: isSuperOrAdmin && activeTab === "matrix" && !!selectedGroupId,
      refetchOnWindowFocus: false,
    },
  );

  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    const fullscreenQuery = isFullscreenParam ? "&fullscreen=true" : "";
    const promptQuery = promptParam ? `&prompt=${promptParam}` : "";
    router.push(`/dashboard/attendance?groupId=${groupId}${fullscreenQuery}${promptQuery}`);
  };

  const handleBackToPicker = () => {
    setSelectedGroupId(null);
    router.push("/dashboard/attendance");
  };

  if (authStatus === "loading") {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Se încarcă sesiunea...
      </div>
    );
  }

  if (!canAccessAttendance) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-fade-in">
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu aveți permisiuni suficiente pentru a accesa catalogul de prezență.
        </p>
      </div>
    );
  }

  // If in Journal mode and a group is chosen: show Journal Table
  if (activeTab === "journal" && selectedGroupId) {
    return (
      <AttendanceJournalTable
        groupId={selectedGroupId}
        initialFullscreen={isFullscreenParam}
        promptType={promptParam}
        onBackToPicker={handleBackToPicker}
        availableGroups={groupsList}
        onSwitchGroup={handleSelectGroup}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Catalog Prezență</span>
            {!isOnline && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Offline
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === "journal"
              ? "Selectează o grupă pentru a deschide catalogul tip școală și a nota în 1-click."
              : activeTab === "take"
              ? "Notează rapid prezența pentru lecția de azi cu salvare automată."
              : "Inspectează istoricul sesiunilor și analitica absențelor."}
          </p>
        </div>

        {/* View Switchers & Links */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("journal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                activeTab === "journal"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Catalog Jurnal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("take")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                activeTab === "take"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Catalog Rapid
            </button>
            {isSuperOrAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                  activeTab === "matrix"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Matrice & Analitică
              </button>
            )}
          </div>

          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-bold text-xs transition active:scale-95 shrink-0"
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Orar →</span>
          </Link>
        </div>
      </div>

      {/* Tab 1: Catalog Jurnal (School Gradebook Matrix - PR #91) */}
      {activeTab === "journal" && (
        <AttendanceGroupPicker
          groups={groupsList}
          onSelectGroup={handleSelectGroup}
          isLoading={isGroupsLoading}
          currentUserId={Number(session?.user?.id) || null}
        />
      )}

      {/* Tab 2: Catalog Rapid (Single-day Roster - PR #89) */}
      {activeTab === "take" && (
        <div className="space-y-4">
          {/* Filter Bar: Course, Group, and Quick Dates */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Course Filter */}
            <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Curs
              </label>
              <div className="relative">
                <select
                  value={selectedCourseId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedCourseId(val);
                    setSelectedGroupId(null);
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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

            {/* Group Filter */}
            <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Grupă
              </label>
              <div className="relative">
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedGroupId(id);
                    const g = groupsList.find((item) => item.id === id);
                    if (g?.courseId && !selectedCourseId) {
                      setSelectedCourseId(g.courseId);
                    }
                  }}
                  disabled={isGroupsLoading || filteredGroups.length === 0}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                >
                  {filteredGroups.length === 0 ? (
                    <option value="">Nicio grupă disponibilă</option>
                  ) : (
                    filteredGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.courseName})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Date Shortcuts & Date Picker */}
            <div className="flex flex-col min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Data Sesiunii
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition active:scale-95 ${
                    selectedDate === todayStr
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Azi
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(yesterdayStr)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition active:scale-95 ${
                    selectedDate === yesterdayStr
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Ieri
                </button>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-8 pr-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Auto-Save & Sync Status Indicator */}
            <div className="self-end pb-1 sm:pb-2 ml-auto flex items-center gap-2">
              {submitMutation.isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  Se sincronizează...
                </span>
              )}
              {saveStatus === "saved" && !submitMutation.isPending && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Sincronizat
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-xs font-semibold text-rose-600">
                  Eroare la salvare. Reîncearcă.
                </span>
              )}
            </div>
          </div>

          {/* Roster Area */}
          {isGroupsLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
              <p className="text-sm font-medium text-slate-400">Se încarcă grupele atribuite...</p>
            </div>
          ) : !selectedGroupId ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
              <p className="text-sm font-semibold text-slate-700">
                Selectați o grupă pentru a nota prezența.
              </p>
            </div>
          ) : isSheetLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
              <p className="text-sm font-medium text-slate-400">Se încarcă lista elevilor...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[420px]">
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    {activeGroup?.name}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5">
                    • {activeGroup?.courseName}
                  </span>
                  {activeGroup?.scheduleTime && (
                    <span className="text-xs text-slate-400 ml-1.5">
                      ({activeGroup.scheduleTime})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {new Intl.DateTimeFormat("ro-RO", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(selectedDate + "T00:00:00"))}
                </div>
              </div>

              <AttendanceSheet
                students={sheetData}
                groupName={activeGroup?.name || "Grupă"}
                date={selectedDate}
                isSaving={submitMutation.isPending}
                onSave={handleSaveAttendance}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Matrice & Istoric (Admin Historical Analytics) */}
      {activeTab === "matrix" && isSuperOrAdmin && (
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
                    setSelectedCourseId(val);
                    setSelectedGroupId(null);
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  disabled={isGroupsLoading || filteredGroups.length === 0}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                >
                  {filteredGroups.length === 0 ? (
                    <option value="">Nicio grupă disponibilă</option>
                  ) : (
                    filteredGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.courseName})
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
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-8 pr-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              </div>
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

              <div
                className={`bg-white rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
                  matrixData.summary.atRiskCount > 0
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-slate-200/80"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    matrixData.summary.atRiskCount > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  ⚠️
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Elevi în Risc (3+ Absențe)
                  </span>
                  <p
                    className={`text-xl font-black leading-none mt-1 ${
                      matrixData.summary.atRiskCount > 0 ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {matrixData.summary.atRiskCount}
                  </p>
                </div>
              </div>
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
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 animate-pulse">
          <p className="text-sm font-semibold text-slate-400">Se încarcă catalogul...</p>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
