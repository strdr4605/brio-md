"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  studentId: number;
  studentName: string;
  onSuccess?: () => void;
};

export function LogManualSubmissionModal({
  isOpen,
  onClose,
  courseId,
  studentId,
  studentName,
  onSuccess,
}: Props) {
  const [selectedResourceId, setSelectedResourceId] = useState<number | "">("");
  const [score, setScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("100");
  const [status, setStatus] = useState<"completed" | "reviewed">("reviewed");
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: resources = [], isLoading: isLoadingResources } =
    trpc.course.getCourseResources.useQuery(
      { courseId },
      { enabled: isOpen },
    );

  const recordMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getLessonSubmissions.invalidate({ courseId });
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Eroare la înregistrarea sarcinii.");
    },
  });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedResourceId) {
      setError("Te rugăm să selectezi o resursă sau sarcină de evaluat.");
      return;
    }

    const parsedScore = score.trim() !== "" ? parseInt(score, 10) : null;
    const parsedMaxScore = maxScore.trim() !== "" ? parseInt(maxScore, 10) : null;

    if (parsedScore !== null && isNaN(parsedScore)) {
      setError("Scorul introdus este invalid.");
      return;
    }

    await recordMutation.mutateAsync({
      courseId,
      studentId,
      resourceId: Number(selectedResourceId),
      status,
      score: parsedScore,
      maxScore: parsedMaxScore,
      teacherFeedback: feedback.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Înregistrare Manuală Sarcină</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elev: <strong className="text-slate-700">{studentName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={recordMutation.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Închide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Resursă / Temă / Minigame
            </label>
            {isLoadingResources ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : resources.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                Nu există resurse asignate acestui curs în bibliotecă.
              </p>
            ) : (
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value ? Number(e.target.value) : "")}
                className="w-full text-sm rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                required
              >
                <option value="">Alege resursa de evaluat...</option>
                {resources.map((item) => (
                  <option key={item.resource.id} value={item.resource.id}>
                    {item.resource.title} ({item.resource.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Punctaj obținut
              </label>
              <input
                type="number"
                min="0"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Ex: 85"
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Punctaj maxim
              </label>
              <input
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="Ex: 100"
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Stare evaluare
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="reviewed"
                  checked={status === "reviewed"}
                  onChange={() => setStatus("reviewed")}
                  className="text-slate-900 focus:ring-slate-900"
                />
                Evaluat & Notat
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={status === "completed"}
                  onChange={() => setStatus("completed")}
                  className="text-slate-900 focus:ring-slate-900"
                />
                Predat (Fără notă finală)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Feedback / Note profesor
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: Rezolvat pe fișă fizică la clasă, calcule corecte..."
              className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={recordMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={recordMutation.isPending || !selectedResourceId}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {recordMutation.isPending ? "Se salvează..." : "Înregistrează sarcina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
