"use client";

import { trpc } from "@/lib/trpc";
import { SessionResourceItem } from "./SessionResourceBroadcastBar";
import { StudentTaskItem } from "./StudentTaskItem";

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
  submissions: StudentSubmissionData[];
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
  submissions = [],
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

  const unassignMutation = trpc.lesson.unassignIndividualResource.useMutation({
    onSuccess: () => {
      utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId });
      utils.attendance.getLessonAttendance.invalidate({ courseId });
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

  const handleComplete = (sub: StudentSubmissionData, score: number = 100) => {
    recordSubmissionMutation.mutate({
      studentId,
      resourceId: sub.resourceId,
      courseId,
      groupId,
      status: "completed",
      score: sub.maxScore || score,
    });
  };

  const handleSaveScore = (sub: StudentSubmissionData, newScore: number) => {
    recordSubmissionMutation.mutate({
      studentId,
      resourceId: sub.resourceId,
      courseId,
      groupId,
      status: "reviewed",
      score: newScore,
      maxScore: sub.maxScore || 100,
    });
  };

  const handleRemove = (sub: StudentSubmissionData) => {
    unassignMutation.mutate({
      studentId,
      resourceId: sub.resourceId,
      courseId,
    });
  };

  const isMutating =
    assignMutation.isPending ||
    recordSubmissionMutation.isPending ||
    unassignMutation.isPending;

  return (
    <div className="flex flex-col items-end gap-1.5 w-full py-0.5">
      {/* List of Assigned Challenges & Grades */}
      {submissions.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-full">
          {submissions.map((sub) => (
            <StudentTaskItem
              key={sub.id}
              sub={sub}
              canAssign={canAssign}
              onComplete={handleComplete}
              onSaveScore={handleSaveScore}
              onRemove={handleRemove}
              isMutating={isMutating}
            />
          ))}
        </div>
      )}

      {/* Action Bar: Add Task Dropdown + Quick Submit fallback */}
      <div className="flex items-center justify-end gap-1.5">
        <div className="relative min-w-[125px] max-w-[170px]">
          <select
            value=""
            disabled={!canAssign || assignMutation.isPending}
            onChange={(e) => handleSelectResource(e.target.value)}
            className={`w-full py-1 px-2 text-[10.5px] font-medium rounded-[4px] border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 truncate ${
              !canAssign
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : submissions.length === 0
                  ? "bg-white text-slate-700 border-slate-300 hover:border-slate-400 font-medium"
                  : "bg-slate-50 text-slate-700 border-dashed border-slate-300 hover:bg-white hover:border-slate-400 font-semibold"
            }`}
            title={
              !canAssign
                ? isRestricted
                  ? `Restricționat: ${restrictionReason || "Restanță"}`
                  : "Elevul trebuie marcat prezent pentru a primi sarcini"
                : submissions.length === 0
                  ? `Alocă sarcină pentru ${studentName}`
                  : `Adaugă încă o sarcină suplimentară pentru ${studentName}`
            }
          >
            <option value="">
              {submissions.length === 0
                ? availableResources.length === 0
                  ? "Fără sarcini"
                  : "— Alege sarcină —"
                : "+ Adaugă sarcină"}
            </option>
            {availableResources.map((item) => {
              const alreadyAssigned = submissions.some((s) => s.resourceId === item.resource.id);
              return (
                <option key={item.resource.id} value={item.resource.id}>
                  {item.resource.type === "minigame" ? "🎮 " : "📄 "}
                  {item.resource.title} {alreadyAssigned ? "✓" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {submissions.length === 0 && (
          <button
            type="button"
            disabled={!canAssign || isWorksheetSubmitting}
            onClick={() => onWorksheetSubmit(studentId)}
            className={`px-2.5 py-1 rounded-[4px] text-[10.5px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer border shadow-2xs flex items-center gap-1 ${
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
    </div>
  );
}
