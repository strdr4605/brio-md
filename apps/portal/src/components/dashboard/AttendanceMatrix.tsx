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
  groupName: string;
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Legendă:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center justify-center text-[11px]">
              P
            </span>
            <span className="text-slate-600 font-medium">Prezent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold flex items-center justify-center text-[11px]">
              A
            </span>
            <span className="text-slate-600 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center justify-center text-[11px]">
              Î
            </span>
            <span className="text-slate-600 font-medium">Întârziat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-bold flex items-center justify-center text-[11px]">
              M
            </span>
            <span className="text-slate-600 font-medium">Motivat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative w-5 h-5 rounded-md bg-slate-100 text-slate-500 border border-slate-300 font-bold flex items-center justify-center text-[10px]">
              •
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            </span>
            <span className="text-slate-600 font-medium">Are Comentariu</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          💡 Click pe orice celulă pentru a edita statutul sau motivul retroactiv.
        </div>
      </div>

      {/* Floating Comment Preview Banner when hovering */}
      {hoveredComment && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fade-in">
          <span className="font-bold text-blue-700">
            💬 {hoveredComment.studentName} ({hoveredComment.date}):
          </span>
          <span className="font-medium italic">"{hoveredComment.comment}"</span>
        </div>
      )}

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
                  <th className="sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs py-3 px-4 min-w-[220px] font-bold text-slate-700 border-r border-slate-200/80 shadow-xs">
                    Elev ({students.length})
                  </th>
                  {/* Attendance Rate */}
                  <th className="py-3 px-3 min-w-[90px] font-bold text-slate-700 text-center border-r border-slate-200/80">
                    Rată
                  </th>
                  {/* Dates Columns */}
                  {dates.map((dateStr) => {
                    const { dayOfWeek, dayMonth } = formatDateHeader(dateStr);
                    return (
                      <th
                        key={dateStr}
                        className="py-2.5 px-2 min-w-[64px] max-w-[72px] text-center border-r border-slate-100 last:border-r-0"
                        title={dateStr}
                      >
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {dayOfWeek}
                        </div>
                        <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
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
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 py-2.5 px-4 border-r border-slate-200/80 shadow-xs">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {student.studentName}
                          </span>
                          {student.age && (
                            <span className="text-[10px] text-slate-400">
                              ({student.age} ani)
                            </span>
                          )}
                          {student.stats.hasConsecutiveAbsences && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                              title={`Elevul are ${student.stats.maxConsecutiveAbsences} absențe consecutive`}
                            >
                              ⚠️ {student.stats.maxConsecutiveAbsences}+ absențe
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <ParentCallWidget
                            parentName={student.parentName}
                            parentPhone={student.parentPhone}
                            compact
                          />
                        </div>
                      </div>
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-2 px-3 text-center border-r border-slate-200/80 font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
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
                          className="py-1.5 px-1 text-center border-r border-slate-100 last:border-r-0 relative"
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
                            className={`w-9 h-8 mx-auto rounded-lg font-bold flex items-center justify-center text-xs transition-all relative group hover:scale-105 active:scale-95 ${
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
