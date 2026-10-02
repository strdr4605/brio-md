"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceStatus } from "./AttendanceCell";
import { AttendanceJournalHeader } from "./AttendanceJournalHeader";
import { AttendanceJournalToolbar, JournalFilterMode } from "./AttendanceJournalToolbar";
import { AttendanceJournalDesktopTable } from "./AttendanceJournalDesktopTable";
import {
  getMonthLabel,
  shiftMonth,
  computeStudentStats,
  computeDateTotals,
} from "./attendanceStats";

type AttendanceJournalTableProps = {
  groupId: number;
  initialMonthStr?: string; // YYYY-MM
  initialFullscreen?: boolean;
  promptType?: "in_progress" | "uncompleted" | null;
  onBackToPicker: () => void;
  availableGroups?: Array<{ id: number; name: string; courseName?: string | null; scheduleTime?: string | null }>;
  onSwitchGroup?: (newGroupId: number) => void;
};

export function AttendanceJournalTable({
  groupId,
  initialMonthStr,
  initialFullscreen = false,
  promptType,
  onBackToPicker,
  availableGroups,
  onSwitchGroup,
}: AttendanceJournalTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);

  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") || permissions.includes("admin") || role === "superadmin" || role === "admin";

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialMonthStr) return initialMonthStr;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthLabel = useMemo(() => getMonthLabel(currentMonth), [currentMonth]);

  const [filterMode, setFilterMode] = useState<JournalFilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.attendance.getJournal.useQuery(
    { groupId, month: currentMonth },
    { refetchOnWindowFocus: false },
  );

  const [localRecords, setLocalRecords] = useState<
    Record<string, { status: AttendanceStatus; comment: string | null }>
  >({});

  useEffect(() => {
    if (data?.records) setLocalRecords(data.records);
  }, [data?.records]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const quickMarkMutation = trpc.attendance.quickMark.useMutation({
    onMutate: () => setSaveStatus("saving"),
    onSuccess: () => {
      setSaveStatus("saved");
      utils.attendance.getTeacherActiveSession.invalidate();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("brio_attendance_session_dismissed", "1");
      }
      setTimeout(() => setSaveStatus("idle"), 2500);
    },
    onError: (err) => {
      setSaveStatus("idle");
      alert(err.message || "Eroare la înregistrarea prezenței.");
      utils.attendance.getJournal.invalidate({ groupId, month: currentMonth });
    },
  });

  const submitMutation = trpc.attendance.submit.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      utils.attendance.getJournal.invalidate({ groupId, month: currentMonth });
      utils.attendance.getTeacherActiveSession.invalidate();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("brio_attendance_session_dismissed", "1");
      }
      setTimeout(() => setSaveStatus("idle"), 2500);
    },
    onError: (err) => {
      setSaveStatus("idle");
      alert(err.message || "Eroare la salvarea prezenței.");
    },
  });

  const handleManualSave = () => {
    if (!data?.students || data.students.length === 0) return;
    setSaveStatus("saving");
    const targetDate = data.dates.find((d) => d.isToday)?.date || data.dates[0]?.date;
    if (!targetDate) return;

    const records = data.students.map((s) => {
      const rec = localRecords[`${s.studentId}_${targetDate}`];
      return {
        studentId: s.studentId,
        status: (rec?.status || "present") as "present" | "absent" | "late" | "excused",
        comment: rec?.comment || null,
      };
    });
    submitMutation.mutate({ groupId, date: targetDate, records });
  };

  const handleCellUpdate = useCallback(
    (studentId: number, date: string, status: AttendanceStatus, comment?: string | null) => {
      const key = `${studentId}_${date}`;
      setLocalRecords((prev) => ({ ...prev, [key]: { status, comment: comment ?? null } }));
      quickMarkMutation.mutate({ groupId, studentId, date, status, comment });
    },
    [groupId, quickMarkMutation],
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        await containerRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (initialFullscreen) {
      setIsFullscreen(true);
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }
  }, [initialFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) setIsFullscreen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const studentStats = useMemo(() => {
    if (!data?.students || !data?.dates) return {};
    return computeStudentStats(data.students, data.dates, localRecords);
  }, [data?.students, data?.dates, localRecords]);

  const dateTotals = useMemo(() => {
    if (!data?.dates || !data?.students) return {};
    return computeDateTotals(data.dates, data.students, localRecords);
  }, [data?.dates, data?.students, localRecords]);

  const { debtCount, paidCount, totalDebtAmount } = useMemo(() => {
    let debt = 0;
    let paid = 0;
    let totalDebt = 0;
    for (const s of data?.students || []) {
      const isUnpaid = Boolean(s.billing?.hasDebt || s.billing?.isOverdue);
      if (isUnpaid) {
        debt++;
        totalDebt += s.billing?.debtAmount || 0;
      } else {
        paid++;
      }
    }
    return { debtCount: debt, paidCount: paid, totalDebtAmount: totalDebt };
  }, [data?.students]);

  const displayedStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((s) => {
      const isUnpaid = Boolean(s.billing?.hasDebt || s.billing?.isOverdue);
      if (filterMode === "debt" && !isUnpaid) return false;
      if (filterMode === "paid" && isUnpaid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchParent = s.parentName?.toLowerCase().includes(q);
        if (!matchName && !matchParent) return false;
      }
      return true;
    });
  }, [data?.students, filterMode, searchQuery]);

  return (
    <div
      ref={containerRef}
      className={`bg-[#f8fafc] text-slate-900 flex flex-col transition-all ${
        isFullscreen
          ? "fixed inset-0 z-[100] p-3 sm:p-5 overflow-auto bg-slate-100 min-h-screen"
          : "space-y-3.5"
      }`}
    >
      <AttendanceJournalHeader
        groupId={groupId}
        groupName={data?.group.name}
        courseName={data?.group.courseName}
        scheduleTime={data?.group.scheduleTime}
        room={data?.group.room}
        teacherName={data?.group.teacherName}
        monthLabel={monthLabel}
        onPrevMonth={() => setCurrentMonth((prev) => shiftMonth(prev, -1))}
        onNextMonth={() => setCurrentMonth((prev) => shiftMonth(prev, 1))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        promptType={promptType}
        onBackToPicker={onBackToPicker}
        availableGroups={availableGroups}
        onSwitchGroup={onSwitchGroup}
        saveStatus={saveStatus}
        onSave={handleManualSave}
        canEditAnyDate={isSuperOrAdmin}
      />

      {/* Attendance & Billing Status Filter Toolbar */}
      {!isLoading && Boolean(data?.students?.length) && (
        <AttendanceJournalToolbar
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalStudents={data?.students.length ?? 0}
          debtCount={debtCount}
          paidCount={paidCount}
          totalDebtAmount={totalDebtAmount}
        />
      )}

      {/* Loading & Error States */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 animate-pulse">
          <p className="text-sm font-semibold text-slate-400">Se încarcă catalogul clasei...</p>
        </div>
      )}

      {Boolean(error) && (
        <div className="bg-rose-50 rounded-2xl p-6 text-center border border-rose-200 text-rose-700 text-xs font-bold">
          Eroare la încărcarea catalogului: {error?.message}
        </div>
      )}

      {/* High-Density Physical School Journal Table */}
      {!isLoading && data && (
        <AttendanceJournalDesktopTable
          displayedStudents={displayedStudents}
          totalStudentsCount={data.students.length}
          dates={data.dates}
          records={localRecords}
          studentStats={studentStats}
          dateTotals={dateTotals}
          isSuperOrAdmin={isSuperOrAdmin}
          onCellUpdate={handleCellUpdate}
        />
      )}
    </div>
  );
}
