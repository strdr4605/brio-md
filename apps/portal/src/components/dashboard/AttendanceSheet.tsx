"use client";

import { useState, useEffect } from "react";
import { ParentCallWidget } from "./ParentCallWidget";
import { AbsenceCommentWidget } from "./AbsenceCommentWidget";
import { CheckCircleIcon } from "@/components/ui/icons";

export type AttendanceStudentItem = {
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  status: "present" | "absent" | "late" | "excused" | null;
  comment: string | null;
};

export type AttendanceSheetProps = {
  students: AttendanceStudentItem[];
  groupName: string;
  date: string;
  isSaving?: boolean;
  onSave: (records: { studentId: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }[]) => void;
};

type LocalAttendanceState = Record<
  number,
  {
    status: "present" | "absent" | "late" | "excused";
    comment: string;
  }
>;

/**
 * Interactive Student Attendance Roster Sheet
 * Features fast status toggling, instant parent call widget, and inline absence comment popover.
 */
export function AttendanceSheet({
  students,
  groupName,
  date,
  isSaving = false,
  onSave,
}: AttendanceSheetProps) {
  const [localState, setLocalState] = useState<LocalAttendanceState>({});
  const [openCommentStudentId, setOpenCommentStudentId] = useState<number | null>(null);

  // Initialize or update state when students list changes
  useEffect(() => {
    const nextState: LocalAttendanceState = {};
    for (const student of students) {
      nextState[student.studentId] = {
        status: student.status || "present", // Default to present as per specs
        comment: student.comment || "",
      };
    }
    setLocalState(nextState);
  }, [students]);

  const handleStatusChange = (
    studentId: number,
    newStatus: "present" | "absent" | "late" | "excused",
  ) => {
    setLocalState((prev) => ({
      ...prev,
      [studentId]: {
        status: newStatus,
        comment: prev[studentId]?.comment || "",
      },
    }));

    // If marked absent and no comment yet, automatically open the comment widget
    if (newStatus === "absent") {
      setOpenCommentStudentId(studentId);
    } else if (newStatus === "present" && openCommentStudentId === studentId && !localState[studentId]?.comment) {
      setOpenCommentStudentId(null);
    }
  };

  const handleCommentSave = (studentId: number, comment: string) => {
    setLocalState((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "absent",
        comment,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setLocalState((prev) => {
      const next: LocalAttendanceState = {};
      for (const student of students) {
        next[student.studentId] = {
          status: "present",
          comment: prev[student.studentId]?.comment || "",
        };
      }
      return next;
    });
  };

  const handleSaveAll = () => {
    const payload = students.map((s) => ({
      studentId: s.studentId,
      status: localState[s.studentId]?.status || "present",
      comment: localState[s.studentId]?.comment || null,
    }));
    onSave(payload);
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs">
        <p className="text-sm font-semibold text-slate-700">Nu sunt elevi înscriși în această grupă.</p>
        <p className="text-xs text-slate-400 mt-1">Adăugați înscrieri pentru grupa selectată din catalogul de cursuri.</p>
      </div>
    );
  }

  const presentCount = Object.values(localState).filter((s) => s.status === "present").length;
  const absentCount = Object.values(localState).filter((s) => s.status === "absent").length;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {groupName} • {date}:
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {presentCount} prezenți
          </span>
          {absentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {absentCount} absenți
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition active:scale-95"
          >
            Marchează toți prezenți
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>{isSaving ? "Se salvează..." : "Salvează prezența"}</span>
          </button>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {students.map((student, idx) => {
            const current = localState[student.studentId] || { status: "present", comment: "" };
            const isAbsent = current.status === "absent";
            const canAddComment =
              current.status === "absent" ||
              current.status === "late" ||
              current.status === "excused" ||
              Boolean(current.comment);
            const isCommentOpen = openCommentStudentId === student.studentId;

            return (
              <div
                key={student.studentId}
                className={`p-4 transition-colors ${
                  isAbsent ? "bg-rose-50/20" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Student and Parent Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {idx + 1}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {student.studentName}
                        </span>
                        {student.age && (
                          <span className="text-[11px] font-medium text-slate-400">
                            ({student.age} ani)
                          </span>
                        )}
                      </div>

                      {/* Instant Parent Contact Widget */}
                      <div className="mt-1">
                        <ParentCallWidget
                          parentName={student.parentName}
                          parentPhone={student.parentPhone}
                          compact
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Presence Status Buttons and Absence Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, "present")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                          current.status === "present"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Prezent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, "absent")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                          current.status === "absent"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, "late")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                          current.status === "late"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Întârziat
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, "excused")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                          current.status === "excused"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Motivat
                      </button>
                    </div>

                    {/* Button to toggle comment notes if absent, late, excused or if comment exists */}
                    {canAddComment && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentStudentId((prev) =>
                            prev === student.studentId ? null : student.studentId,
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                          current.comment
                            ? "bg-amber-100/80 text-amber-900 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                        title={current.comment ? `Motiv: ${current.comment}` : "Adaugă motiv / notă"}
                      >
                        <span>💬</span>
                        <span className="max-w-[120px] truncate">
                          {current.comment || "Adaugă motiv"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Absence Comment Inline Widget / Popover */}
                <AbsenceCommentWidget
                  isOpen={isCommentOpen}
                  initialComment={current.comment}
                  studentName={student.studentName}
                  onSave={(cmt) => handleCommentSave(student.studentId, cmt)}
                  onClose={() => setOpenCommentStudentId(null)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
