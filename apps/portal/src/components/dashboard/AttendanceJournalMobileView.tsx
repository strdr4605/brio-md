"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AttendanceStatus } from "./AttendanceCell";
import {
  AttendanceJournalDesktopTable,
  JournalDateItem,
  JournalStudentItem,
} from "./AttendanceJournalDesktopTable";
import { StudentCheckinCard } from "./StudentCheckinCard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DashboardIcon,
} from "@/components/ui/icons";

export type AttendanceJournalMobileViewProps = {
  displayedStudents: JournalStudentItem[];
  totalStudentsCount: number;
  dates: JournalDateItem[];
  records: Record<string, { status: AttendanceStatus; comment: string | null }>;
  studentStats: Record<number, { present: number; absent: number; pct: number }>;
  dateTotals: Record<string, { present: number; absent: number }>;
  isSuperOrAdmin: boolean;
  onCellUpdate: (
    studentId: number,
    date: string,
    status: AttendanceStatus,
    comment?: string | null,
  ) => void;
};

export function AttendanceJournalMobileView({
  displayedStudents,
  totalStudentsCount,
  dates,
  records,
  studentStats,
  dateTotals,
  isSuperOrAdmin,
  onCellUpdate,
}: AttendanceJournalMobileViewProps) {
  // Mode: "cards" (touch-optimized day view) or "matrix" (scrollable full grid)
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");

  // Determine initial selected date: today if available, else first date
  const defaultDate = useMemo(() => {
    const todayItem = dates.find((d) => d.isToday);
    return todayItem ? todayItem.date : dates[0]?.date || "";
  }, [dates]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  // Keep selected date valid if dates list changes
  useEffect(() => {
    if (!dates.some((d) => d.date === selectedDate) && dates.length > 0) {
      const todayItem = dates.find((d) => d.isToday);
      setSelectedDate(todayItem ? todayItem.date : dates[0].date);
    }
  }, [dates, selectedDate]);

  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Scroll active date into view
  useEffect(() => {
    if (!dateScrollRef.current) return;
    const activeEl = dateScrollRef.current.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDate]);

  const selectedDateObj = useMemo(
    () => dates.find((d) => d.date === selectedDate),
    [dates, selectedDate],
  );

  const canEditSelectedDate = Boolean(selectedDateObj?.isToday || isSuperOrAdmin);

  // Selected date statistics
  const dayStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    for (const s of displayedStudents) {
      const status = records[`${s.studentId}_${selectedDate}`]?.status;
      if (!status) unmarked++;
      else if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
    }
    return { present, absent, late, unmarked };
  }, [displayedStudents, records, selectedDate]);

  const handleMarkAllPresentToday = () => {
    if (!canEditSelectedDate) return;
    for (const s of displayedStudents) {
      const rec = records[`${s.studentId}_${selectedDate}`];
      if (!rec?.status) {
        onCellUpdate(s.studentId, selectedDate, "present", null);
      }
    }
  };

  const currentIndex = dates.findIndex((d) => d.date === selectedDate);
  const handlePrevDate = () => {
    if (currentIndex > 0) setSelectedDate(dates[currentIndex - 1].date);
  };
  const handleNextDate = () => {
    if (currentIndex < dates.length - 1) setSelectedDate(dates[currentIndex + 1].date);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "cards"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Listă Zi</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "matrix"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DashboardIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Tabel Matrice</span>
          </button>
        </div>

        {viewMode === "cards" && (
          <span className="text-[11px] font-bold text-slate-500">
            {dates.length} {dates.length === 1 ? "lecție" : "lecții"} în lună
          </span>
        )}
      </div>

      {/* If Matrix View is selected, show desktop table with horizontal scroll */}
      {viewMode === "matrix" && (
        <AttendanceJournalDesktopTable
          displayedStudents={displayedStudents}
          totalStudentsCount={totalStudentsCount}
          dates={dates}
          records={records}
          studentStats={studentStats}
          dateTotals={dateTotals}
          isSuperOrAdmin={isSuperOrAdmin}
          onCellUpdate={onCellUpdate}
        />
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <>
          {/* Horizontal Date Picker Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevDate}
                disabled={currentIndex <= 0}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition shrink-0 cursor-pointer"
                title="Lecția precedentă"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <div
                ref={dateScrollRef}
                className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth flex-1"
              >
                {dates.map((d) => {
                  const isSelected = d.date === selectedDate;
                  const tot = dateTotals[d.date];
                  const hasAttendance = Boolean(tot && tot.present + tot.absent > 0);

                  return (
                    <button
                      key={d.date}
                      type="button"
                      data-active={isSelected ? "true" : "false"}
                      onClick={() => setSelectedDate(d.date)}
                      className={`flex flex-col items-center justify-center min-w-[52px] py-2 px-1.5 rounded-xl border transition cursor-pointer shrink-0 active:scale-95 ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-400/40"
                          : d.isToday
                            ? "bg-blue-50/80 border-blue-300 text-blue-900"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`text-[10px] uppercase font-extrabold ${
                          isSelected
                            ? "text-blue-100"
                            : d.isToday
                              ? "text-blue-700"
                              : "text-slate-400"
                        }`}
                      >
                        {d.shortDay}
                      </span>
                      <span className="text-sm font-black mt-0.5">{d.dayNumber}</span>
                      {d.isToday && (
                        <span
                          className={`text-[8px] font-black uppercase px-1 rounded-sm mt-0.5 ${
                            isSelected ? "bg-white text-blue-700" : "bg-blue-600 text-white"
                          }`}
                        >
                          Azi
                        </span>
                      )}
                      {!d.isToday && hasAttendance && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            isSelected ? "bg-emerald-300" : "bg-emerald-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNextDate}
                disabled={currentIndex >= dates.length - 1}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition shrink-0 cursor-pointer"
                title="Lecția următoare"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Date Context & Stats Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    {selectedDateObj?.dayLabel || "Lecție"}, {selectedDateObj?.dayNumber}{" "}
                    {selectedDate.slice(0, 7)}
                  </h3>
                  {selectedDateObj?.isToday ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Lecție Astăzi
                    </span>
                  ) : canEditSelectedDate ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Editare Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      Arhivă
                    </span>
                  )}
                </div>
              </div>

              {canEditSelectedDate && dayStats.unmarked > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllPresentToday}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  Marchează toți prezenți
                </button>
              )}
            </div>

            {/* Quick Summary Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80">
                {dayStats.present} prezenți
              </span>
              {dayStats.absent > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200/80">
                  {dayStats.absent} absenți
                </span>
              )}
              {dayStats.late > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200/80">
                  {dayStats.late} întârziați
                </span>
              )}
              {dayStats.unmarked > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold">
                  {dayStats.unmarked} nemarcați
                </span>
              )}
            </div>
          </div>

          {/* Students Mobile Check-In Cards List */}
          <div className="space-y-2.5">
            {displayedStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs">
                {totalStudentsCount === 0
                  ? "Nu există elevi înscriși în această grupă."
                  : "Niciun elev nu corespunde filtrelor selectate."}
              </div>
            ) : (
              displayedStudents.map((student, idx) => {
                const record = records[`${student.studentId}_${selectedDate}`];
                return (
                  <StudentCheckinCard
                    key={student.studentId}
                    student={student}
                    index={idx}
                    selectedDate={selectedDate}
                    record={record}
                    canEdit={canEditSelectedDate}
                    onCellUpdate={onCellUpdate}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
