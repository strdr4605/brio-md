"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Props = {
  courseId: number;
  resourceId: number;
  title: string;
  url: string;
  sessionNumber?: number | null;
  instructions?: string | null;
  maxScore?: number | null;
  submissionStatus?: "assigned" | "in_progress" | "completed" | "reviewed" | null;
  submissionScore?: number | null;
  onPreview?: () => void;
};

export function MinigameActivityCard({
  courseId,
  resourceId,
  title,
  url,
  sessionNumber,
  instructions,
  maxScore,
  submissionStatus,
  submissionScore,
  onPreview,
}: Props) {
  const [scoreInput, setScoreInput] = useState<string>("");
  const [showScorePrompt, setShowScorePrompt] = useState(false);

  const utils = trpc.useUtils();

  const isCompleted = submissionStatus === "completed" || submissionStatus === "reviewed";

  const submitMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getMyCourseSubmissions.invalidate({ courseId });
      utils.course.getById.invalidate({ id: courseId });
      setShowScorePrompt(false);
    },
  });

  const handleMarkCompleted = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedScore = scoreInput.trim() ? parseInt(scoreInput.trim(), 10) : undefined;

    submitMutation.mutate({
      resourceId,
      courseId,
      status: "completed",
      score: !isNaN(parsedScore as number) ? parsedScore : maxScore ?? undefined,
      maxScore: maxScore ?? undefined,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-slate-300 hover:shadow-xs transition space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 text-xl font-medium">
            🎮
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Minijoc Interactiv
              </span>
              {sessionNumber && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Sesiunea {sessionNumber}
                </span>
              )}
              {isCompleted && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Finalizat
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">{title}</h3>
          </div>
        </div>

        {submissionScore !== null && submissionScore !== undefined && (
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
              Scor: {submissionScore}
              {maxScore ? ` / ${maxScore}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {instructions && (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">
          <span className="font-semibold text-slate-800">Sarcina: </span>
          {instructions}
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Lansează Jocul</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Previzualizează
            </button>
          )}
        </div>

        {!isCompleted ? (
          showScorePrompt ? (
            <form onSubmit={handleMarkCompleted} className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={maxScore ?? 1000}
                placeholder={maxScore ? `Scor (max ${maxScore})` : "Scor obținut"}
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                className="w-28 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitMutation.isPending ? "..." : "Confirmă"}
              </button>
              <button
                type="button"
                onClick={() => setShowScorePrompt(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => (maxScore ? setShowScorePrompt(true) : handleMarkCompleted({ preventDefault: () => {} } as any))}
              disabled={submitMutation.isPending}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Marchează ca Finalizat</span>
            </button>
          )
        ) : (
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Sarcina a fost predată
          </span>
        )}
      </div>
    </div>
  );
}
