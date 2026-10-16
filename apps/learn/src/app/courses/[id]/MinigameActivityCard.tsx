"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  GamepadIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  TrophyIcon,
} from "@brio-md/ui";

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
    <Card className="p-5 hover:border-amber-300 hover:shadow-sm border-amber-100/70 bg-gradient-to-b from-amber-50/15 via-white to-white transition space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <GamepadIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Minijoc Interactiv
              </span>
              {sessionNumber && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Sesiunea {sessionNumber}
                </span>
              )}
              {isCompleted && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Finalizat</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">{title}</h3>
          </div>
        </div>

        {submissionScore !== null && submissionScore !== undefined && (
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
              <TrophyIcon className="w-3.5 h-3.5" />
              <span>Scor: {submissionScore}{maxScore ? ` / ${maxScore}` : ""}</span>
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {instructions && (
        <p className="text-xs text-slate-600 bg-amber-50/40 border border-amber-100/80 p-2.5 rounded-xl leading-relaxed">
          <span className="font-semibold text-amber-900">Sarcina: </span>
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
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition flex items-center gap-1.5 shadow-sm shadow-amber-200 cursor-pointer active:scale-[0.99]"
          >
            <span>Lansează Jocul</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
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
                className="w-28 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white"
              />
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
              <CheckCircleIcon className="w-3.5 h-3.5" />
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
    </Card>
  );
}
