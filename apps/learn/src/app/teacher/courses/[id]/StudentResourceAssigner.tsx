"use client";

import { trpc } from "@/lib/trpc";
import { SessionResourceItem } from "./SessionResourceBroadcastBar";

export type StudentSubmissionData = {
  id: number;
  studentId: number;
  resourceId: number;
  status: "assigned" | "in_progress" | "completed" | "reviewed";
  score: number | null;
  maxScore: number | null;
  resourceTitle?: string | null;
  resourceType?: string | null;
};

type Props = {
  studentId: number;
  studentName: string;
  courseId: number;
  groupId?: number;
  canAssign: boolean;
  isRestricted: boolean;
  restrictionReason?: string | null;
  availableResources: SessionResourceItem[];
  currentSubmission?: StudentSubmissionData;
  onWorksheetSubmit: (studentId: number) => void;
  isWorksheetSubmitting: boolean;
};

export function StudentResourceAssigner({
  studentId,
  studentName,
  courseId,
  groupId,
  canAssign,
  isRestricted,
  restrictionReason,
  availableResources,
  currentSubmission,
  onWorksheetSubmit,
  isWorksheetSubmitting,
}: Props) {
  const utils = trpc.useUtils();

  const assignMutation = trpc.lesson.assignIndividualResource.useMutation({
    onSuccess: () => {
      utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId });
      utils.attendance.getLessonAttendance.invalidate({ courseId });
    },
  });

  const recordSubmissionMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId });
      utils.attendance.getLessonAttendance.invalidate({ courseId });
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  const handleSelectResource = (resourceIdStr: string) => {
    const resourceId = parseInt(resourceIdStr, 10);
    if (isNaN(resourceId) || resourceId === 0) return;
    assignMutation.mutate({
      studentId,
      courseId,
      resourceId,
      groupId,
    });
  };

  const handleCompleteTask = () => {
    if (!currentSubmission) {
      onWorksheetSubmit(studentId);
      return;
    }
    recordSubmissionMutation.mutate({
      studentId,
      resourceId: currentSubmission.resourceId,
      courseId,
      groupId,
      status: "completed",
      score: currentSubmission.maxScore || 100,
    });
  };

  const status = currentSubmission?.status || null;
  const isCompleted = status === "completed" || status === "reviewed";
  const isInProgress = status === "in_progress";
  const isAssigned = status === "assigned";

  return (
    <div className="flex items-center justify-end gap-2 pr-1 flex-wrap">
      {/* Task Selector Dropdown (Individual Assignment) */}
      <div className="relative min-w-[130px] max-w-[170px]">
        <select
          value={currentSubmission?.resourceId || ""}
          disabled={!canAssign || assignMutation.isPending}
          onChange={(e) => handleSelectResource(e.target.value)}
          className={`w-full py-1.5 px-2 text-[11px] font-medium rounded-[4px] border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 truncate ${
            !canAssign
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : isCompleted
                ? "bg-emerald-50/50 text-emerald-900 border-emerald-200"
                : isAssigned
                  ? "bg-sky-50 text-sky-900 border-sky-300 font-semibold"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
          }`}
          title={
            !canAssign
              ? isRestricted
                ? `Restricționat: ${restrictionReason || "Restanță"}`
                : "Elevul trebuie marcat prezent pentru a primi sarcini"
              : `Alocă sarcină individuală pentru ${studentName}`
          }
        >
          <option value="">
            {availableResources.length === 0 ? "Fără sarcini" : "— Alege sarcină —"}
          </option>
          {availableResources.map((item) => (
            <option key={item.resource.id} value={item.resource.id}>
              {item.resource.type === "minigame" ? "🎮 " : "📄 "}
              {item.resource.title}
            </option>
          ))}
        </select>
      </div>

      {/* Live Status Badge */}
      {status ? (
        <span
          className={`px-2 py-1 rounded-[4px] text-[10.5px] font-bold uppercase tracking-wider select-none flex items-center gap-1 border ${
            isCompleted
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : isInProgress
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-sky-100 text-sky-800 border-sky-300"
          }`}
        >
          {isCompleted && (
            <span>
              {currentSubmission?.score !== null && currentSubmission?.score !== undefined
                ? `${currentSubmission.score}p ✓`
                : "Predat ✓"}
            </span>
          )}
          {isInProgress && <span>În lucru ⚡</span>}
          {isAssigned && <span>Alocat ⏳</span>}
        </span>
      ) : (
        <span className="text-[10px] text-slate-400 font-medium px-1 select-none hidden sm:inline">
          Nealocat
        </span>
      )}

      {/* Quick Finish / Grade Button */}
      {isAssigned || isInProgress ? (
        <button
          type="button"
          disabled={recordSubmissionMutation.isPending}
          onClick={handleCompleteTask}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer shadow-2xs flex items-center gap-1"
          title="Marchează sarcina ca finalizată și confirmă prezența în timp real"
        >
          <span>✓</span>
          <span>Predă</span>
        </button>
      ) : isCompleted ? (
        <span
          className="w-7 h-7 rounded-[4px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold"
          title="Sarcină finalizată cu succes"
        >
          ✓
        </span>
      ) : (
        <button
          type="button"
          disabled={!canAssign || isWorksheetSubmitting}
          onClick={() => onWorksheetSubmit(studentId)}
          className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer border shadow-2xs flex items-center gap-1 ${
            !canAssign
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
          title="Predare fișă / confirmare rapidă prezență"
        >
          <span>Predă</span>
        </button>
      )}
    </div>
  );
}
