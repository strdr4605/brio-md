"use client";

import { useMemo } from "react";
import { findStudentConflictWithTargetGroup, GroupScheduleItem } from "@/lib/scheduleConflicts";

export type GroupEnrollmentViewProps = {
  isLoadingStudents: boolean;
  search: string;
  allStudents: Array<{
    id: number;
    name: string;
    phone?: string | null;
    parentName?: string | null;
    courses?: Array<{ id: number }>;
    groups?: GroupScheduleItem[];
  }>;
  courseId?: number | null;
  courseName?: string | null;
  selectedStudentIds: number[];
  existingGroupMembers: Array<{ studentId: number; status?: string | null }>;
  targetGroup?: GroupScheduleItem;
  onToggleStudent: (studentId: number) => void;
};

export function GroupEnrollmentView({
  isLoadingStudents,
  search,
  allStudents,
  courseId,
  courseName,
  selectedStudentIds,
  existingGroupMembers,
  targetGroup,
  onToggleStudent,
}: GroupEnrollmentViewProps) {
  // In group mode, only allow picking students who are already enrolled in this group's course
  const eligibleStudents = useMemo(() => {
    if (courseId) {
      return allStudents.filter((s) => s.courses?.some((c) => c.id === courseId));
    }
    return allStudents;
  }, [allStudents, courseId]);

  // Filter students in group mode
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return eligibleStudents;
    const q = search.toLowerCase();
    return eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        (s.parentName || "").toLowerCase().includes(q),
    );
  }, [eligibleStudents, search]);

  if (isLoadingStudents) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (eligibleStudents.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
        <p className="text-sm font-semibold text-slate-800">Niciun student înscris la acest curs</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Doar studenții deja înscriși la cursul <strong>{courseName || "respectiv"}</strong> pot fi
          adăugați în această grupă. Înscrieți mai întâi studenții la curs din profilul lor.
        </p>
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Nu a fost găsit niciun student</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {filteredStudents.map((s) => {
        const isSelected = selectedStudentIds.includes(s.id);
        const isAlreadyMember = existingGroupMembers.some((m) => m.studentId === s.id);
        const conflict = targetGroup
          ? findStudentConflictWithTargetGroup({
              targetGroup,
              studentActiveGroups: s.groups || [],
            })
          : { hasConflict: false };
        const isConflicted = conflict.hasConflict && !isSelected;

        return (
          <label
            key={s.id}
            title={isConflicted ? `Conflict de orar: ${conflict.reason}` : undefined}
            onClick={(e) => {
              if (isConflicted) e.preventDefault();
            }}
            className={`flex flex-col p-3 rounded-lg border transition-all select-none ${
              isSelected
                ? "bg-blue-50/50 border-blue-400"
                : isConflicted
                  ? "bg-slate-50/70 border-dashed border-slate-200 opacity-60 cursor-not-allowed"
                  : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isConflicted}
                  onChange={() => {
                    if (!isConflicted) onToggleStudent(s.id);
                  }}
                  className={`w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 ${
                    isConflicted ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-xs font-bold ${
                        isConflicted ? "text-slate-500" : "text-slate-800"
                      }`}
                    >
                      {s.name}
                    </p>
                    {isConflicted && (
                      <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80">
                        Suprapunere de orar
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {s.phone || "Fără telefon"}
                    {s.parentName ? ` • Tutore: ${s.parentName}` : ""}
                  </p>
                </div>
              </div>

              {isAlreadyMember && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Înrolat
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
