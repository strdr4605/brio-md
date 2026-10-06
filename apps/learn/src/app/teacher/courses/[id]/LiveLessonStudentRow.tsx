"use client";

import { AttendanceStatus, AttendanceStatusPills } from "./AttendanceStatusPills";
import { RestrictedStudentBadge } from "./RestrictedStudentBadge";
import { AbsentCommentInput } from "./AbsentCommentInput";

export type LiveLessonStudent = {
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  currentSession: number;
  completedSessions: number;
  progressStatus: string;
  status: AttendanceStatus;
  comment?: string | null;
  worksheetCompleted: boolean;
  isRestricted: boolean;
  restrictionReason?: string | null;
  hasDebt: boolean;
  debtAmount: number;
  isOverdue: boolean;
  isEligibleForAssignment: boolean;
};

type Props = {
  index: number;
  student: LiveLessonStudent;
  isAssignedResource: boolean;
  onToggleResource: (studentId: number) => void;
  onStatusChange: (studentId: number, nextStatus: AttendanceStatus) => void;
  onCommentChange: (studentId: number, comment: string | null) => void;
  onWorksheetSubmit: (studentId: number) => void;
  isMutating: boolean;
  isWorksheetSubmitting: boolean;
};

export function LiveLessonStudentRow({
  index,
  student,
  isAssignedResource,
  onToggleResource,
  onStatusChange,
  onCommentChange,
  onWorksheetSubmit,
  isMutating,
  isWorksheetSubmitting,
}: Props) {
  const canAssign = student.isEligibleForAssignment;
  const isAbsent = student.status === "absent" || student.status === "excused";
  const showCommentArea = isAbsent || Boolean(student.comment);

  return (
    <div
      className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors px-5 py-3.5 ${
        isAbsent ? "bg-rose-50/20" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-[48px_minmax(220px,1fr)_300px_270px] items-center gap-4">
        {/* Col 1: Index # */}
        <span className="text-center text-xs font-semibold text-slate-400 tabular-nums select-none">
          {index}
        </span>

        {/* Col 2: Student Info */}
        <div className="min-w-0 pr-2 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-slate-900 tracking-tight truncate">
              {student.studentName}
            </span>
            <RestrictedStudentBadge
              isRestricted={student.isRestricted}
              restrictionReason={student.restrictionReason}
              studentName={student.studentName}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/70 tracking-tight select-none">
              STD-{student.studentId.toString().padStart(4, "0")}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Sesiune {student.currentSession}</span>
            {student.parentPhone && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Tel: {student.parentPhone}</span>
              </>
            )}
          </div>
        </div>

        {/* Col 3: Status Buttons (Centered directly under STATUS header) */}
        <div className="flex justify-center">
          <AttendanceStatusPills
            currentStatus={student.status}
            onStatusChange={(next) => onStatusChange(student.studentId, next)}
            disabled={isMutating}
            hasComment={Boolean(student.comment)}
          />
        </div>

        {/* Col 4: Sarcini & Fișă (Right-aligned under SARCINI & FIȘĂ header) */}
        <div className="flex justify-end items-center gap-2 pr-1">
          {/* Minigame Button */}
          <button
            type="button"
            disabled={!canAssign}
            onClick={() => onToggleResource(student.studentId)}
            className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5 border shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus:outline-none ${
              !canAssign
                ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                : isAssignedResource
                  ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
            title={
              canAssign
                ? "Alocă minigame / sarcină interactivă"
                : "Elevul trebuie marcat PRESENT sau LATE pentru a primi sarcini"
            }
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isAssignedResource ? "Alocată ✓" : "Minigame"}</span>
          </button>

          {/* Worksheet Button */}
          <button
            type="button"
            disabled={isWorksheetSubmitting}
            onClick={() => onWorksheetSubmit(student.studentId)}
            className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5 border shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:outline-none ${
              student.worksheetCompleted
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
            title="Predare fișă: marchează automat prezența în timp real"
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{student.worksheetCompleted ? "Predată ✓" : "Predă Fișa"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Absent Mini-Comment Section */}
      {showCommentArea && (
        <div className="pl-12 pr-4 pt-2.5">
          <AbsentCommentInput
            comment={student.comment}
            onSaveComment={(cmt) => onCommentChange(student.studentId, cmt)}
            disabled={isMutating}
            studentName={student.studentName}
          />
        </div>
      )}
    </div>
  );
}
