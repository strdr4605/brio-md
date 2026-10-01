"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceGroupPicker } from "@/components/dashboard/AttendanceGroupPicker";
import { AttendanceJournalTable } from "@/components/dashboard/AttendanceJournalTable";
import { AttendanceRapidTab } from "@/components/dashboard/AttendanceRapidTab";
import { AttendanceMatrixTab } from "@/components/dashboard/AttendanceMatrixTab";
import { CalendarIcon, DoorIcon } from "@/components/ui/icons";

const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDateString(new Date());
const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = getLocalDateString(yesterdayDate);
const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

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
  const promptParam = searchParams.get("prompt") as
    | "in_progress"
    | "uncompleted"
    | null;
  const tabParam = searchParams.get("tab") as
    | "journal"
    | "take"
    | "matrix"
    | null;

  const [activeTab, setActiveTab] = useState<"journal" | "take" | "matrix">(
    tabParam === "take" || tabParam === "matrix" ? tabParam : "journal",
  );

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    urlGroupId ? Number(urlGroupId) : null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (urlGroupId) {
      setSelectedGroupId(Number(urlGroupId));
    }
  }, [urlGroupId]);

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

  const { data: groupsList = [], isLoading: isGroupsLoading } =
    trpc.group.list.useQuery({ active: true }, { enabled: canAccessAttendance });

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
    const [y, m, d] = selectedDate.split("-").map(Number);
    return DAY_MAP[new Date(y, m - 1, d).getDay()] || "";
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === "journal") return;
    if (filteredGroups.length === 0) {
      setSelectedGroupId(null);
      return;
    }
    if (
      selectedGroupId &&
      filteredGroups.some((g) => g.id === selectedGroupId)
    ) {
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
  }, [
    activeTab,
    filteredGroups,
    selectedGroupId,
    selectedDayCode,
    selectedCourseId,
  ]);

  const activeGroup = useMemo(
    () => groupsList.find((g) => g.id === selectedGroupId),
    [groupsList, selectedGroupId],
  );

  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    const fullscreenQuery = isFullscreenParam ? "&fullscreen=true" : "";
    const promptQuery = promptParam ? `&prompt=${promptParam}` : "";
    router.push(
      `/dashboard/attendance?groupId=${groupId}${fullscreenQuery}${promptQuery}`,
    );
  };

  const handleBackToPicker = () => {
    setSelectedGroupId(null);
    router.push("/dashboard/attendance");
  };

  if (authStatus === "loading") {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-14 bg-slate-200/80 rounded-2xl" />
        <div className="h-96 bg-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  if (!canAccessAttendance) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <DoorIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu aveți permisiuni suficiente pentru a accesa catalogul de prezență.
        </p>
      </div>
    );
  }

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
    <div className="space-y-5 animate-fade-in-up max-w-7xl mx-auto pb-12">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Catalog Prezență</span>
            {!isOnline && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className={`w-full sm:w-auto grid ${isSuperOrAdmin ? "grid-cols-3" : "grid-cols-2"} sm:inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80`}>
            <button
              type="button"
              onClick={() => setActiveTab("journal")}
              className={`py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition active:scale-95 text-center truncate ${
                activeTab === "journal" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Catalog Jurnal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("take")}
              className={`py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition active:scale-95 text-center truncate ${
                activeTab === "take" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Catalog Rapid
            </button>
            {isSuperOrAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition active:scale-95 text-center truncate ${
                  activeTab === "matrix" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Matrice
              </button>
            )}
          </div>

          <Link
            href="/dashboard/schedule"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 font-bold text-xs transition active:scale-95 shadow-xs shrink-0"
          >
            <CalendarIcon className="w-4 h-4 text-slate-600" />
            <span>Orar →</span>
          </Link>
        </div>
      </div>

      {/* Tab 1: Catalog Jurnal */}
      {activeTab === "journal" && (
        <AttendanceGroupPicker
          groups={groupsList}
          onSelectGroup={handleSelectGroup}
          isLoading={isGroupsLoading}
          currentUserId={Number(session?.user?.id) || null}
        />
      )}

      {/* Tab 2: Catalog Rapid */}
      {activeTab === "take" && (
        <AttendanceRapidTab
          coursesList={coursesList}
          filteredGroups={filteredGroups}
          selectedCourseId={selectedCourseId}
          onSelectCourseId={setSelectedCourseId}
          selectedGroupId={selectedGroupId}
          onSelectGroupId={setSelectedGroupId}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          todayStr={todayStr}
          yesterdayStr={yesterdayStr}
          isGroupsLoading={isGroupsLoading}
          activeGroup={activeGroup}
        />
      )}

      {/* Tab 3: Matrice & Istoric */}
      {activeTab === "matrix" && isSuperOrAdmin && (
        <AttendanceMatrixTab
          coursesList={coursesList}
          filteredGroups={filteredGroups}
          selectedCourseId={selectedCourseId}
          onSelectCourseId={setSelectedCourseId}
          selectedGroupId={selectedGroupId}
          onSelectGroupId={setSelectedGroupId}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          isGroupsLoading={isGroupsLoading}
          isSuperOrAdmin={isSuperOrAdmin}
        />
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 animate-pulse">
          <p className="text-sm font-semibold text-slate-400">
            Se încarcă catalogul...
          </p>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
