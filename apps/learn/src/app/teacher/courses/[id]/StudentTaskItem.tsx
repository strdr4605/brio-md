"use client";

import { useState } from "react";
import { StudentSubmissionData } from "./StudentResourceAssigner";

type Props = {
  sub: StudentSubmissionData;
  canAssign: boolean;
  onComplete: (sub: StudentSubmissionData, score?: number) => void;
  onSaveScore: (sub: StudentSubmissionData, score: number) => void;
  onRemove?: (sub: StudentSubmissionData) => void;
  isMutating?: boolean;
};

export function StudentTaskItem({
  sub,
  canAssign,
  onComplete,
  onSaveScore,
  onRemove,
  isMutating = false,
}: Props) {
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [scoreVal, setScoreVal] = useState<string>(
    sub.score !== null && sub.score !== undefined ? String(sub.score) : "100"
  );

  const isCompleted = sub.status === "completed" || sub.status === "reviewed";
  const isInProgress = sub.status === "in_progress";
  const isAssigned = sub.status === "assigned";
  const isMinigame = sub.resourceType === "minigame";

  const handleScoreSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(scoreVal.trim(), 10);
    if (!isNaN(num) && num >= 0) {
      onSaveScore(sub, num);
    }
    setIsEditingScore(false);
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all text-xs">
      {/* Type Icon & Resource Title */}
      <div
        className="flex items-center gap-1 max-w-[140px] truncate"
        title={sub.resourceTitle || "Sarcină"}
      >
        <span className="text-xs select-none">{isMinigame ? "🎮" : "📄"}</span>
        <span className="font-semibold text-[11px] text-slate-800 truncate">
          {sub.resourceTitle || "Sarcină"}
        </span>
      </div>

      {/* Score / Status Display */}
      {isCompleted ? (
        isEditingScore ? (
          <form onSubmit={handleScoreSubmit} className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max={sub.maxScore || 100}
              value={scoreVal}
              onChange={(e) => setScoreVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsEditingScore(false);
              }}
              onBlur={() => handleScoreSubmit()}
              className="w-12 px-1 py-0.5 text-[11px] font-bold text-center border border-emerald-500 rounded bg-white text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <span className="text-[10px] font-bold text-emerald-700">p</span>
          </form>
        ) : (
          <button
            type="button"
            disabled={!canAssign}
            onClick={() => {
              setScoreVal(sub.score !== null && sub.score !== undefined ? String(sub.score) : "100");
              setIsEditingScore(true);
            }}
            className="px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer select-none"
            title="Click pentru a edita nota"
          >
            {sub.score !== null && sub.score !== undefined ? `${sub.score}p ✓` : "Predat ✓"}
          </button>
        )
      ) : isInProgress ? (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 select-none">
          În lucru ⚡
        </span>
      ) : (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 select-none">
          Alocat ⏳
        </span>
      )}

      {/* Quick Finish / Grade Button if not completed */}
      {!isCompleted && (
        <button
          type="button"
          disabled={!canAssign || isMutating}
          onClick={() => onComplete(sub, 100)}
          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition active:scale-[0.97] cursor-pointer shadow-2xs flex items-center gap-0.5 select-none"
          title="Marchează finalizat și acordă 100p"
        >
          <span>✓</span>
          <span>Predă</span>
        </button>
      )}

      {/* Remove Task Button */}
      {onRemove && (
        <button
          type="button"
          disabled={isMutating}
          onClick={() => onRemove(sub)}
          className="text-slate-400 hover:text-rose-600 text-[11px] font-bold px-0.5 py-0.5 transition cursor-pointer select-none"
          title="Elimină sarcina"
        >
          ✕
        </button>
      )}
    </div>
  );
}
