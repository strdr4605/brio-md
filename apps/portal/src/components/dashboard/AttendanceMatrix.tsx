"use client";

import { useState } from "react";
import { ParentCallWidget } from "./ParentCallWidget";
import { EditAttendanceModal } from "./EditAttendanceModal";

export type MatrixStudent = {
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  cells: Record<
    string,
    {
      id?: number;
      status: "present" | "absent" | "late" | "excused";
      comment?: string | null;
    }
  >;
  stats: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    totalSessions: number;
    attendedCount: number;
    attendanceRate: number;
    maxConsecutiveAbsences: number;
    hasConsecutiveAbsences: boolean;
  };
};

export type AttendanceMatrixProps = {
  groupId: number;
  groupName?: string;
  dates: string[];
  students: MatrixStudent[];
  onRefresh: () => void;
};

function formatDateHeader(dateStr: string) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayNames = ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"];
    const monthNames = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];
    return {
      dayOfWeek: dayNames[dateObj.getDay()] || "",
      dayMonth: `${day} ${monthNames[month - 1] || ""}`,
    };
  } catch {
    return { dayOfWeek: "", dayMonth: dateStr };
  }
}

export function AttendanceMatrix({
  groupId,
  dates,
  students,
  onRefresh,
}: AttendanceMatrixProps) {
  const [activeEditCell, setActiveEditCell] = useState<{
    studentId: number;
    studentName: string;
    date: string;
    status: "present" | "absent" | "late" | "excused";
    comment?: string | null;
  } | null>(null);

  const [hoveredComment, setHoveredComment] = useState<{
    studentName: string;
    date: string;
    comment: string;
    status: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      {/* Legend & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Legendă:
          </span>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center justify-center text-[11px]">
              P
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Prezent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold flex items-center justify-center text-[11px]">
              A
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center justify-center text-[11px]">
              Î
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Întârziat</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-bold flex items-center justify-center text-[11px]">
              M
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Motivat</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative w-5 h-5 rounded-md bg-slate-100 text-slate-500 border border-slate-300 font-bold flex items-center justify-center text-[10px]">
              •
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Comentariu</span>
          </div>
        </div>

        <div className="text-[10px] sm:text-[11px] font-medium min-h-[20px] flex items-center">
          {hoveredComment ? (
            <span className="text-blue-700 font-bold animate-fade-in truncate max-w-full">
              💬 {hoveredComment.studentName} ({hoveredComment.date}):{" "}
              <span className="italic font-medium text-slate-700">"{hoveredComment.comment}"</span>
            </span>
          ) : (
            <span className="text-slate-400">💡 Click pe o celulă pentru editare retroactivă.</span>
          )}
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {dates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Nu există sesiuni de prezență înregistrate pentru această grupă în perioada selectată.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80">
                  {/* Sticky Column: Student Info */}
                  <th className="sticky left-0 z-20 bg-slate-50 py-2.5 sm:py-3 px-2.5 sm:px-4 min-w-[130px] sm:min-w-[220px] font-bold text-slate-700 border-r border-slate-200/80 shadow-xs">
                    Elev ({students.length})
                  </th>
                  {/* Attendance Rate */}
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-3 min-w-[58px] sm:min-w-[90px] font-bold text-slate-700 text-center border-r border-slate-200/80">
                    Rată
                  </th>
                  {/* Dates Columns */}
                  {dates.map((dateStr) => {
                    const { dayOfWeek, dayMonth } = formatDateHeader(dateStr);
                    return (
                      <th
                        key={dateStr}
                        className="py-2 px-1.5 sm:px-2 min-w-[56px] sm:min-w-[64px] max-w-[68px] sm:max-w-[72px] text-center border-r border-slate-100 last:border-r-0"
                        title={dateStr}
                      >
                        <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">
                          {dayOfWeek}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-slate-800 whitespace-nowrap">
                          {dayMonth}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.studentId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      student.stats.hasConsecutiveAbsences ? "bg-rose-50/30" : ""
                    }`}
                  >
                    {/* Sticky Student Column */}
                    <td className="sticky left-0 z-10 bg-white py-2 px-2.5 sm:px-4 border-r border-slate-200/80 shadow-xs">
                      <div className="flex flex-col min-w-0 max-w-[125px] sm:max-w-[210px]">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-full">
                            {student.studentName}
                          </span>
                          {student.age && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({student.age} ani)
                            </span>
                          )}
                          {student.stats.hasConsecutiveAbsences && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0"
                              title={`Elevul are ${student.stats.maxConsecutiveAbsences} absențe consecutive`}
                            >
                              ⚠️ {student.stats.maxConsecutiveAbsences}+ abs
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 min-w-0">
                          <ParentCallWidget
                            parentName={student.parentName}
                            parentPhone={student.parentPhone}
                            compact
                          />
                        </div>
                      </div>
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-2 px-1 sm:px-3 text-center border-r border-slate-200/80 font-bold">
                      <span
                        className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
                          student.stats.attendanceRate >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : student.stats.attendanceRate >= 60
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {student.stats.attendanceRate}%
                      </span>
                    </td>

                    {/* Matrix Cells */}
                    {dates.map((dateStr) => {
                      const cell = student.cells[dateStr];
                      const status = cell?.status;
                      const comment = cell?.comment;

                      return (
                        <td
                          key={dateStr}
                          className="py-1.5 px-0.5 sm:px-1 text-center border-r border-slate-100 last:border-r-0 relative"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditCell({
                                studentId: student.studentId,
                                studentName: student.studentName,
                                date: dateStr,
                                status: status || "present",
                                comment: comment || null,
                              })
                            }
                            onMouseEnter={() => {
                              if (comment) {
                                setHoveredComment({
                                  studentName: student.studentName,
                                  date: dateStr,
                                  comment,
                                  status: status || "unmarked",
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredComment(null)}
                            className={`w-8 h-7 sm:w-9 sm:h-8 mx-auto rounded-lg font-bold flex items-center justify-center text-xs transition-all relative group active:scale-90 hover:ring-2 hover:ring-blue-500/50 ${
                              status === "present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : status === "absent"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-black"
                                  : status === "late"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-black"
                                    : status === "excused"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-black"
                                      : "bg-slate-50 text-slate-300 border border-slate-100 hover:bg-slate-100 hover:text-slate-600"
                            }`}
                            title={
                              comment
                                ? `${student.studentName} (${dateStr}): ${status?.toUpperCase()} — Motiv: ${comment}`
                                : `${student.studentName} (${dateStr}): ${status?.toUpperCase() || "Nemarcat"} (Click pentru editare)`
                            }
                          >
                            {status === "present"
                              ? "P"
                              : status === "absent"
                                ? "A"
                                : status === "late"
                                  ? "Î"
                                  : status === "excused"
                                    ? "M"
                                    : "-"}

                            {/* Comment indicator dot/icon */}
                            {comment && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {activeEditCell && (
        <EditAttendanceModal
          isOpen={true}
          onClose={() => setActiveEditCell(null)}
          groupId={groupId}
          studentId={activeEditCell.studentId}
          studentName={activeEditCell.studentName}
          date={activeEditCell.date}
          initialStatus={activeEditCell.status}
          initialComment={activeEditCell.comment}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}
