"use client";

import { useState, useEffect } from "react";
import { ParentCallWidget } from "./ParentCallWidget";
import { AbsenceCommentWidget } from "./AbsenceCommentWidget";
import { CheckCircleIcon } from "@/components/ui/icons";
import { StudentBillingBadge, StudentBillingProps } from "./StudentBillingBadge";

export type AttendanceStudentItem = {
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  billing?: StudentBillingProps["billing"];
  status: "present" | "absent" | "late" | "excused" | null;
  comment: string | null;
};

export type AttendanceSheetProps = {
  students: AttendanceStudentItem[];
  groupName: string;
  date: string;
  isSaving?: boolean;
  onSaveAction?: (records: { studentId: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }[]) => void;
  onSave?: (records: { studentId: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }[]) => void;
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
  groupName: _groupName,
  date: _date,
  isSaving = false,
  onSaveAction,
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
    (onSaveAction || onSave)?.(payload);
  };

  if (students.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mb-3">
          👥
        </div>
        <p className="text-sm font-semibold text-slate-700">Nu sunt elevi înscriși în această grupă.</p>
        <p className="text-xs text-slate-400 mt-1">Adăugați înscrieri pentru grupa selectată din catalogul de cursuri.</p>
      </div>
    );
  }

  const presentCount = Object.values(localState).filter((s) => s.status === "present").length;
  const absentCount = Object.values(localState).filter((s) => s.status === "absent").length;
  const lateCount = Object.values(localState).filter((s) => s.status === "late").length;
  const excusedCount = Object.values(localState).filter((s) => s.status === "excused").length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sticky Action Toolbar */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {students.length} {students.length === 1 ? "elev" : "elevi"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {presentCount} prezenți
          </span>
          {absentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {absentCount} absenți
            </span>
          )}
          {lateCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {lateCount} întârziați
            </span>
          )}
          {excusedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {excusedCount} motivați
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition active:scale-95 shadow-2xs"
          >
            Marchează toți prezenți
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>{isSaving ? "Se salvează..." : "Salvează prezența"}</span>
          </button>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {students.map((student, idx) => {
          const current = localState[student.studentId] || { status: "present", comment: "" };
          const isAbsent = current.status === "absent";
          const canAddComment =
            current.status === "absent" ||
            current.status === "late" ||
            current.status === "excused" ||
            Boolean(current.comment);
          const isCommentOpen = openCommentStudentId === student.studentId;

          const isUnpaid = Boolean(student.billing?.hasDebt || student.billing?.isOverdue);

          return (
            <div
              key={student.studentId}
              className={`px-5 py-3 transition-colors ${
                isAbsent
                  ? "bg-rose-50/25 hover:bg-rose-50/40"
                  : isUnpaid
                    ? "bg-rose-50/15 hover:bg-rose-50/30 border-l-4 border-l-rose-500"
                    : "hover:bg-slate-50/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Student and Parent Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80">
                    {idx + 1}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm truncate ${isUnpaid ? "text-rose-950 font-black" : "text-slate-900 font-semibold"}`}>
                        {student.studentName}
                      </span>
                      {student.age && (
                        <span className="text-xs text-slate-400 font-normal shrink-0">
                          ({student.age} ani)
                        </span>
                      )}
                    </div>

                    {/* Instant Parent Contact Widget & Billing Pill */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <ParentCallWidget
                        parentName={student.parentName}
                        parentPhone={student.parentPhone}
                        compact
                      />
                      {student.billing && (
                        <StudentBillingBadge
                          billing={student.billing}
                          studentName={student.studentName}
                          compact
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Presence Status Buttons and Absence Details */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "present")}
                      className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition active:scale-95 ${
                        current.status === "present"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Prezent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "absent")}
                      className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition active:scale-95 ${
                        current.status === "absent"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "late")}
                      className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition active:scale-95 ${
                        current.status === "late"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Întârziat
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "excused")}
                      className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition active:scale-95 ${
                        current.status === "excused"
                          ? "bg-blue-600 text-white shadow-2xs"
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
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition shrink-0 ${
                        current.comment
                          ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={current.comment ? `Motiv: ${current.comment}` : "Adaugă motiv / notă"}
                    >
                      <span>💬</span>
                      <span className="max-w-[120px] truncate">
                        {current.comment || "Notă"}
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
  );
}
