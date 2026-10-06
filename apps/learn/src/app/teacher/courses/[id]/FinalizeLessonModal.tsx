"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AttendanceStatus } from "./AttendanceStatusPills";

type StudentInfo = {
  studentId: number;
  studentName: string;
  status: AttendanceStatus;
  parentName?: string | null;
  studentPhone?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  groupId?: number;
  date: string;
  allStudents: StudentInfo[];
  onSuccess: () => void;
};

export function FinalizeLessonModal({
  isOpen,
  onClose,
  courseId,
  groupId,
  date,
  allStudents,
  onSuccess,
}: Props) {
  const unmarkedStudents = allStudents.filter((s) => s.status === null);
  const presentCount = allStudents.filter(
    (s) => s.status === "present" || s.status === "late",
  ).length;
  const alreadyAbsentCount = allStudents.filter(
    (s) => s.status === "absent" || s.status === "excused",
  ).length;

  const [statuses, setStatuses] = useState<
    Record<number, "absent" | "excused" | "present">
  >(() => {
    const initial: Record<number, "absent" | "excused" | "present"> = {};
    for (const s of unmarkedStudents) {
      initial[s.studentId] = "absent";
    }
    return initial;
  });

  const finalizeMutation = trpc.attendance.finalizeLessonAttendance.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleBulkSet = (status: "absent" | "excused") => {
    const next: Record<number, "absent" | "excused" | "present"> = {};
    for (const s of unmarkedStudents) {
      next[s.studentId] = status;
    }
    setStatuses(next);
  };

  const handleSingleChange = (
    studentId: number,
    status: "absent" | "excused" | "present",
  ) => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = () => {
    if (unmarkedStudents.length === 0) {
      onSuccess();
      onClose();
      return;
    }

    const records = unmarkedStudents.map((s) => ({
      studentId: s.studentId,
      status: statuses[s.studentId] || "absent",
      comment:
        statuses[s.studentId] === "excused"
          ? "Absență motivată la finalizarea lecției"
          : statuses[s.studentId] === "absent"
            ? "Absență nemotivată la finalizarea lecției"
            : "Prezență confirmată la finalizare",
    }));

    finalizeMutation.mutate({
      courseId,
      groupId,
      date,
      records,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                📋
              </span>
              <h3 className="text-lg font-bold text-neutral-900">
                Finalizare Lecție & Catalogare Prezență
              </h3>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Data: <strong className="text-neutral-900">{date}</strong> • Elevi deja prezenți:{" "}
              <strong className="text-emerald-700">{presentCount}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {finalizeMutation.isError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{finalizeMutation.error?.message || "Eroare la salvarea prezenței."}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {unmarkedStudents.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mx-auto">
                ✓
              </div>
              <h4 className="text-sm font-bold text-neutral-900">
                Toți elevii au fost deja marcați!
              </h4>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Nu există elevi rămași nemarcați. ({presentCount} prezenți/întârziați,{" "}
                {alreadyAbsentCount} absenți). Poți încheia lecția direct.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>ℹ️</span> Revizuire automată elevi nemarcați ({unmarkedStudents.length})
                </p>
                <p className="text-amber-700/90 text-[11px]">
                  Elevii deja prezenți sau activi au fost omiși automat. Stabilește statusul
                  pentru elevii rămași (absențe motivate sau nemotivate).
                </p>
              </div>

              {/* Quick bulk action buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <span className="font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">
                  Acțiuni rapide:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSet("absent")}
                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                  >
                    Toți Absenți nemotivați
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSet("excused")}
                    className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition cursor-pointer"
                  >
                    Toți Motivați
                  </button>
                </div>
              </div>

              {/* Unmarked students list */}
              <div className="space-y-2.5 divide-y divide-neutral-100">
                {unmarkedStudents.map((student) => {
                  const currentChoice = statuses[student.studentId] || "absent";
                  return (
                    <div
                      key={student.studentId}
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-neutral-900">
                          {student.studentName}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {student.parentName
                            ? `Părinte: ${student.parentName}`
                            : student.studentPhone
                              ? `Tel: ${student.studentPhone}`
                              : "Fără contact direct"}
                        </p>
                      </div>

                      {/* Status choice pills */}
                      <div className="inline-flex items-center gap-1 p-0.5 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSingleChange(student.studentId, "absent")}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            currentChoice === "absent"
                              ? "bg-rose-600 text-white shadow-2xs"
                              : "text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleChange(student.studentId, "excused")}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            currentChoice === "excused"
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          Motivat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleChange(student.studentId, "present")}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            currentChoice === "present"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          Prezent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
          >
            Anulează
          </button>
          <button
            type="button"
            disabled={finalizeMutation.isPending}
            onClick={handleSubmit}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            {finalizeMutation.isPending ? (
              <span>Se procesează...</span>
            ) : (
              <>
                <span>✓</span>
                <span>Finalizează Lecția</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
