"use client";

import { useEffect, useRef } from "react";
import { AttendanceCell, AttendanceStatus } from "./AttendanceCell";
import { StudentBillingBadge, StudentBillingProps } from "./StudentBillingBadge";
import { PhoneIcon } from "@/components/ui/icons";

export type JournalDateItem = {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  dayLabel: string;
  shortDay: string;
  isToday: boolean;
};

export type JournalStudentItem = {
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  enrollmentId: number;
  billingType?: string | null;
  customPrice: number | null;
  discountPercent: number | null;
  billing?: StudentBillingProps["billing"];
};

export type AttendanceJournalDesktopTableProps = {
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

export function AttendanceJournalDesktopTable({
  displayedStudents,
  totalStudentsCount,
  dates,
  records,
  studentStats,
  dateTotals,
  isSuperOrAdmin,
  onCellUpdate,
}: AttendanceJournalDesktopTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll horizontally to today's column so it's immediately visible
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const todayTh = scrollContainerRef.current.querySelector<HTMLElement>("[data-is-today='true']");
    if (todayTh) {
      const stickyOffset = window.innerWidth < 640 ? 175 : 255;
      const targetLeft = Math.max(0, todayTh.offsetLeft - stickyOffset);
      scrollContainerRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
  }, [dates]);

  return (
    <div className="bg-white -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-slate-200/90 shadow-xs overflow-hidden flex flex-col flex-1">
      <div ref={scrollContainerRef} className="overflow-x-auto flex-1 select-none scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-[700px]">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-[10px] sm:text-[11px] font-black border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-slate-100 w-8 sm:w-10 min-w-[32px] sm:min-w-[40px] p-1.5 sm:p-2 text-center border-r border-slate-200">
                #
              </th>
              <th className="sticky left-[32px] sm:left-10 z-20 bg-slate-100 w-36 sm:w-60 min-w-[135px] sm:min-w-[200px] max-w-[150px] sm:max-w-none p-1.5 sm:p-2.5 border-r border-slate-200 truncate">
                <span className="hidden sm:inline">Elev (Nume, Abonament & Contact)</span>
                <span className="sm:hidden">Elev</span>
              </th>
              {dates.map((d) => (
                <th
                  key={d.date}
                  data-is-today={d.isToday ? "true" : undefined}
                  title={
                    d.isToday
                      ? "Ziua de astăzi (Editabilă)"
                      : isSuperOrAdmin
                        ? `Arhivă ${d.date} (Editabilă - Admin)`
                        : `Arhivă ${d.date}`
                  }
                  className={`w-9 sm:w-11 min-w-[36px] sm:min-w-[44px] p-0.5 sm:p-1 text-center border-r border-slate-200/80 transition-colors ${
                    d.isToday
                      ? "bg-blue-100/90 text-blue-900 ring-2 ring-blue-500 ring-inset"
                      : isSuperOrAdmin
                        ? "bg-slate-50 hover:bg-slate-100/80"
                        : "bg-slate-100/60"
                  }`}
                >
                  <div
                    className={`text-[8px] sm:text-[9px] uppercase ${
                      d.isToday
                        ? "font-black text-blue-700"
                        : isSuperOrAdmin
                          ? "font-bold text-slate-500"
                          : "font-bold text-slate-400"
                    }`}
                  >
                    {d.shortDay}
                  </div>
                  <div
                    className={`text-[11px] sm:text-xs ${
                      d.isToday
                        ? "font-black text-blue-950"
                        : isSuperOrAdmin
                          ? "font-extrabold text-slate-800"
                          : "font-bold text-slate-700"
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </th>
              ))}
              <th className="w-10 sm:w-12 p-1 sm:p-2 text-center text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-200">
                Prez
              </th>
              <th className="w-10 sm:w-12 p-1 sm:p-2 text-center text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-50/50 border-r border-slate-200">
                Abs
              </th>
              <th className="w-11 sm:w-14 p-1 sm:p-2 text-center text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-50/50">
                %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-xs">
            {displayedStudents.length === 0 ? (
              <tr>
                <td colSpan={dates.length + 5} className="p-8 text-center text-slate-400 text-xs">
                  {totalStudentsCount === 0
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
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 text-center font-bold text-slate-400 text-[10px] sm:text-[11px] border-r border-slate-200 py-1">
                      {idx + 1}
                    </td>
                    <td
                      className={`sticky left-[32px] sm:left-10 z-10 bg-white group-hover:bg-slate-50/80 px-2 sm:px-2.5 py-1 sm:py-1.5 border-r border-slate-200 font-bold text-slate-900 truncate max-w-[150px] sm:max-w-none ${
                        isUnpaid ? "border-l-4 border-l-rose-500 bg-rose-50/30" : ""
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`truncate max-w-[105px] sm:max-w-[155px] text-xs sm:text-sm ${
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
                            compact
                          />
                        </div>
                      </div>
                    </td>
                    {dates.map((d) => {
                      const record = records[`${student.studentId}_${d.date}`];
                      return (
                        <td key={d.date} className="p-0 text-center w-9 sm:w-11 min-w-[36px] sm:min-w-[44px]">
                          <AttendanceCell
                            studentId={student.studentId}
                            studentName={student.studentName}
                            date={d.date}
                            isToday={d.isToday}
                            canEditAnyDate={isSuperOrAdmin}
                            status={record?.status || null}
                            comment={record?.comment}
                            onUpdate={(newStatus, newComment) =>
                              onCellUpdate(student.studentId, d.date, newStatus, newComment)
                            }
                          />
                        </td>
                      );
                    })}
                    <td className="text-center font-bold text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50/30 border-r border-slate-200 py-1">
                      {stats.present}
                    </td>
                    <td className="text-center font-bold text-[10px] sm:text-[11px] text-rose-700 bg-rose-50/30 border-r border-slate-200 py-1">
                      {stats.absent}
                    </td>
                    <td className="text-center font-extrabold text-[10px] sm:text-[11px] text-blue-700 bg-blue-50/30 py-1">
                      {stats.pct}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 text-slate-600 text-[9px] sm:text-[10px] font-black border-t-2 border-slate-300">
              <td className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 p-1.5 sm:p-2 text-center" colSpan={2}>
                <span className="hidden sm:inline">Total Prezenți pe Lecție:</span>
                <span className="sm:hidden">Total:</span>
              </td>
              {dates.map((d) => {
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
  );
}
