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

export type LessonSubmissionItem = {
  studentId: number;
  resourceId: number;
  score: number | null;
  maxScore: number | null;
  status: "assigned" | "in_progress" | "completed" | "reviewed";
};

function formatDateToEuropean(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateStr;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  groupId?: number;
  date: string;
  allStudents: StudentInfo[];
  lessonSubmissions?: LessonSubmissionItem[];
  onSuccess: () => void;
};

export function FinalizeLessonModal({
  isOpen,
  onClose,
  courseId,
  groupId,
  date,
  allStudents,
  lessonSubmissions = [],
  onSuccess,
}: Props) {
  const unmarkedStudents = allStudents.filter((s) => s.status === null);
  const presentCount = allStudents.filter(
    (s) => s.status === "present" || s.status === "late",
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

  const bulkSubmissionsMutation = trpc.lesson.bulkFinalizeLessonSubmissions.useMutation();

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
    // Persist all student task submissions and scores in bulk
    if (groupId && lessonSubmissions.length > 0) {
      bulkSubmissionsMutation.mutate({
        courseId,
        groupId,
        submissions: lessonSubmissions.map((sub) => ({
          studentId: sub.studentId,
          resourceId: sub.resourceId,
          score: sub.score ?? (sub.status === "completed" ? 100 : null),
          maxScore: sub.maxScore ?? 100,
          status: sub.status,
        })),
      });
    }

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
            : null,
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
                Finalizare Lecție & Salvare Activități
              </h3>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Data: <strong className="text-neutral-900">{formatDateToEuropean(date)}</strong> • Elevi prezenți:{" "}
              <strong className="text-emerald-700">{presentCount}</strong>
              {lessonSubmissions.length > 0 && (
                <>
                  {" "}• Sarcini înregistrate: <strong className="text-slate-800">{lessonSubmissions.length}</strong>
                </>
              )}
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
        <div className="p-6 overflow-y-auto space-y-5">
          {unmarkedStudents.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <p className="text-sm font-bold text-emerald-900">
                Toți elevii din această clasă au prezența deja catalogată!
              </p>
              <p className="text-xs text-emerald-700">
                Apasă pe butonul de mai jos pentru a închide activitățile sesiunii și a salva rezultatele.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs">
                <span>
                  Au rămas <strong>{unmarkedStudents.length} elevi</strong> fără prezență marcată.
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[11px] text-amber-800">Setează toți ca:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSet("absent")}
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold text-[10px] uppercase transition cursor-pointer"
                  >
                    Absenți
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSet("excused")}
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold text-[10px] uppercase transition cursor-pointer"
                  >
                    Scuzați
                  </button>
                </div>
              </div>

              {/* Unmarked Students List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {unmarkedStudents.map((s) => {
                  const currentChoice = statuses[s.studentId] || "absent";
                  return (
                    <div
                      key={s.studentId}
                      className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-neutral-900 truncate">
                          {s.studentName}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {s.parentName ? `Părinte: ${s.parentName}` : `STD-${s.studentId}`}
                        </div>
                      </div>

                      {/* Pill options */}
                      <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl text-xs select-none">
                        <button
                          type="button"
                          onClick={() => handleSingleChange(s.studentId, "absent")}
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
                          onClick={() => handleSingleChange(s.studentId, "excused")}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            currentChoice === "excused"
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          Scuzat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleChange(s.studentId, "present")}
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
            disabled={finalizeMutation.isPending || bulkSubmissionsMutation.isPending}
            onClick={handleSubmit}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            {finalizeMutation.isPending || bulkSubmissionsMutation.isPending ? (
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
