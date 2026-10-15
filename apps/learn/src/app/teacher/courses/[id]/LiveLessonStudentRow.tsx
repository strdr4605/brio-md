"use client";

import { AttendanceStatus, AttendanceStatusPills } from "./AttendanceStatusPills";
import { RestrictedStudentBadge } from "./RestrictedStudentBadge";
import { AbsentCommentInput } from "./AbsentCommentInput";
import { StudentResourceAssigner, StudentSubmissionData } from "./StudentResourceAssigner";
import { SessionResourceItem } from "./SessionResourceBroadcastBar";

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
  courseId: number;
  groupId?: number;
  availableResources: SessionResourceItem[];
  submissions?: StudentSubmissionData[];
  onStatusChange: (studentId: number, nextStatus: AttendanceStatus) => void;
  onCommentChange: (studentId: number, comment: string | null) => void;
  onWorksheetSubmit: (studentId: number) => void;
  isMutating: boolean;
  isWorksheetSubmitting: boolean;
};

export function LiveLessonStudentRow({
  index,
  student,
  courseId,
  groupId,
  availableResources,
  submissions = [],
  onStatusChange,
  onCommentChange,
  onWorksheetSubmit,
  isMutating,
  isWorksheetSubmitting,
}: Props) {
  const canAssign = student.isEligibleForAssignment;
  const isAbsent = student.status === "absent" || student.status === "excused";
  const showCommentArea = isAbsent;

  return (
    <div
      className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors px-4 py-3 sm:px-5 sm:py-3.5 ${
        isAbsent ? "bg-rose-50/20" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-[40px_minmax(180px,1fr)_260px_minmax(240px,1.2fr)] items-center gap-3 sm:gap-4">
        {/* Col 1: Index # */}
        <span className="text-center text-xs font-semibold text-slate-400 tabular-nums select-none">
          {index}
        </span>

        {/* Col 2: Student Info */}
        <div className="min-w-0 pr-2 space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[13.5px] font-semibold text-slate-900 tracking-tight truncate block"
              title={student.studentName}
            >
              {student.studentName}
            </span>
            <RestrictedStudentBadge
              isRestricted={student.isRestricted}
              restrictionReason={student.restrictionReason}
              studentName={student.studentName}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/70 tracking-tight select-none shrink-0">
              STD-{student.studentId.toString().padStart(4, "0")}
            </span>
            <span className="text-slate-300 shrink-0">•</span>
            <span className="text-slate-600 font-medium shrink-0">Sesiune {student.currentSession}</span>
            {student.parentPhone && (
              <>
                <span className="text-slate-300 shrink-0">•</span>
                <span className="text-slate-500 truncate" title={`Tel: ${student.parentPhone}`}>
                  {student.parentPhone}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Col 3: Status Buttons (Centered directly under STATUS header) */}
        <div className="flex justify-center shrink-0 w-[260px]">
          <AttendanceStatusPills
            currentStatus={student.status}
            onStatusChange={(next) => onStatusChange(student.studentId, next)}
            disabled={isMutating}
            hasComment={isAbsent && Boolean(student.comment)}
          />
        </div>

        {/* Col 4: Sarcini & Fișă (Right-aligned under SARCINI & FIȘĂ header) */}
        <div className="flex justify-end min-w-0">
          <StudentResourceAssigner
            studentId={student.studentId}
            studentName={student.studentName}
            courseId={courseId}
            groupId={groupId}
            canAssign={canAssign}
            isRestricted={student.isRestricted}
            restrictionReason={student.restrictionReason}
            availableResources={availableResources}
            submissions={submissions}
            onWorksheetSubmit={onWorksheetSubmit}
            isWorksheetSubmitting={isWorksheetSubmitting}
          />
        </div>
      </div>

      {/* Expandable Absent Mini-Comment Section */}
      {showCommentArea && (
        <div className="pl-10 pr-4 pt-2">
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
