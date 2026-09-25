"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceCell, AttendanceStatus } from "./AttendanceCell";
import { AttendanceJournalHeader } from "./AttendanceJournalHeader";
import { AttendanceJournalToolbar, JournalFilterMode } from "./AttendanceJournalToolbar";
import { StudentBillingBadge } from "./StudentBillingBadge";
import { PhoneIcon } from "@/components/ui/icons";
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
      className={`text-slate-900 flex flex-col transition-all ${
        isFullscreen
          ? "fixed inset-0 z-[100] p-3 sm:p-5 overflow-auto bg-slate-100 min-h-screen"
          : "space-y-3.5 bg-transparent"
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
        <div
          id="journal-table-card"
          data-brio-id="attendance-table"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col flex-1"
        >
          <div className="overflow-x-auto flex-1 select-none">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-black border-b border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-100 w-10 p-2 text-center border-r border-slate-200">
                    #
                  </th>
                  <th className="sticky left-10 z-20 bg-slate-100 w-52 sm:w-60 p-2.5 border-r border-slate-200 truncate">
                    Elev (Nume, Abonament & Contact)
                  </th>
                  {data.dates.map((d) => (
                    <th
                      key={d.date}
                      title={d.isToday ? "Ziua de astăzi (Editabilă)" : isSuperOrAdmin ? `Arhivă ${d.date} (Editabilă - Admin)` : `Arhivă ${d.date}`}
                      className={`w-10 sm:w-11 p-1 text-center border-r border-slate-200/80 transition-colors ${
                        d.isToday ? "bg-blue-100/90 text-blue-900 ring-2 ring-blue-500 ring-inset" : isSuperOrAdmin ? "bg-slate-50 hover:bg-slate-100/80" : "bg-slate-100/60"
                      }`}
                    >
                      <div className={`text-[9px] uppercase ${d.isToday ? "font-black text-blue-700" : isSuperOrAdmin ? "font-bold text-slate-500" : "font-bold text-slate-400"}`}>
                        {d.shortDay}
                      </div>
                      <div className={`text-xs ${d.isToday ? "font-black text-blue-950" : isSuperOrAdmin ? "font-extrabold text-slate-800" : "font-bold text-slate-700"}`}>
                        {d.dayNumber}
                      </div>
                    </th>
                  ))}
                  <th className="w-12 p-2 text-center text-[10px] font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-200">
                    Prez
                  </th>
                  <th className="w-12 p-2 text-center text-[10px] font-bold text-rose-700 bg-rose-50/50 border-r border-slate-200">
                    Abs
                  </th>
                  <th className="w-14 p-2 text-center text-[10px] font-bold text-blue-700 bg-blue-50/50">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={data.dates.length + 5} className="p-8 text-center text-slate-400 text-xs">
                      {data.students.length === 0
                        ? "Nu există elevi înscriși în această grupă."
                        : "Niciun elev nu corespunde filtrelor selectate."}
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => {
                    const stats = studentStats[student.studentId] || { present: 0, absent: 0, pct: 100 };
                    const isUnpaid = Boolean(student.billing?.hasDebt || student.billing?.isOverdue);
                    return (
                      <tr
                        key={student.studentId}
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          isUnpaid ? "bg-rose-50/25" : ""
                        }`}
                      >
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 text-center font-bold text-slate-400 text-[11px] border-r border-slate-200 py-1">
                          {idx + 1}
                        </td>
                        <td
                          className={`sticky left-10 z-10 bg-white group-hover:bg-slate-50/80 px-2.5 py-1.5 border-r border-slate-200 font-bold text-slate-900 truncate ${
                            isUnpaid ? "border-l-4 border-l-rose-500 bg-rose-50/30" : ""
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`truncate max-w-[155px] ${
                                  isUnpaid ? "text-rose-950 font-black" : "text-slate-900"
                                }`}
                                title={student.studentName}
                              >
                                {student.studentName}
                              </span>
                              {Boolean(student.parentPhone) && (
                                <a
                                  href={`tel:${student.parentPhone}`}
                                  title={`Părinte: ${student.parentName || "Familie"} (${student.parentPhone})`}
                                  className="text-slate-400 hover:text-blue-600 transition p-0.5 rounded shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <PhoneIcon className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <StudentBillingBadge
                                billing={student.billing}
                                studentName={student.studentName}
                              />
                            </div>
                          </div>
                        </td>
                        {data.dates.map((d) => {
                          const record = localRecords[`${student.studentId}_${d.date}`];
                          return (
                            <td key={d.date} className="p-0 text-center">
                              <AttendanceCell
                                studentId={student.studentId}
                                studentName={student.studentName}
                                date={d.date}
                                isToday={d.isToday}
                                canEditAnyDate={isSuperOrAdmin}
                                status={record?.status || null}
                                comment={record?.comment}
                                onUpdate={(newStatus, newComment) => handleCellUpdate(student.studentId, d.date, newStatus, newComment)}
                              />
                            </td>
                          );
                        })}
                        <td className="text-center font-bold text-[11px] text-emerald-700 bg-emerald-50/30 border-r border-slate-200 py-1">
                          {stats.present}
                        </td>
                        <td className="text-center font-bold text-[11px] text-rose-700 bg-rose-50/30 border-r border-slate-200 py-1">
                          {stats.absent}
                        </td>
                        <td className="text-center font-extrabold text-[11px] text-blue-700 bg-blue-50/30 py-1">
                          {stats.pct}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 text-slate-600 text-[10px] font-black border-t-2 border-slate-300">
                  <td className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 p-2 text-center" colSpan={2}>
                    Total Prezenți pe Lecție:
                  </td>
                  {data.dates.map((d) => {
                    const tot = dateTotals[d.date] || { present: 0, absent: 0 };
                    return (
                      <td key={d.date} className="text-center p-1 border-r border-slate-200 font-extrabold text-emerald-700">
                        {tot.present > 0 ? tot.present : "—"}
                      </td>
                    );
                  })}
                  <td colSpan={3} className="bg-slate-50" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
