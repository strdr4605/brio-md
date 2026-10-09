"use client";

import { useEffect, useRef } from "react";

type Props = {
  totalSessions: number;
  activeSession: number;
  onSelectSession: (sessionNumber: number) => void;
  sessionStatsMap: Map<number, { total: number; completed: number }>;
};

export function DossierSessionSidebar({
  totalSessions,
  activeSession,
  onSelectSession,
  sessionStatsMap,
}: Props) {
  const sessions = Array.from({ length: totalSessions }, (_, i) => i + 1);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSession]);

  return (
    <div className="w-full sm:w-64 md:w-72 border-r border-slate-200/80 bg-slate-50/50 flex flex-col shrink-0">
      <div className="p-3.5 border-b border-slate-200/80 bg-white/60 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Programa ({totalSessions} Sesiuni)
        </span>
        {totalSessions > 5 && (
          <span className="text-[10px] text-slate-400 font-medium">5 vizibile</span>
        )}
      </div>

      {/* Constrained to first 5 items, scrollable for the rest */}
      <div className="max-h-[220px] overflow-y-auto p-2 space-y-1 scrollbar-thin scroll-smooth">
        {sessions.map((sNum) => {
          const stats = sessionStatsMap.get(sNum) || { total: 0, completed: 0 };
          const isSelected = activeSession === sNum;
          const isAllCompleted = stats.total > 0 && stats.completed === stats.total;
          const isPartiallyCompleted = stats.completed > 0 && stats.completed < stats.total;

          return (
            <button
              key={sNum}
              ref={isSelected ? activeItemRef : undefined}
              type="button"
              onClick={() => onSelectSession(sNum)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                isSelected
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Status indicator bullet */}
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected
                      ? "bg-emerald-400"
                      : isAllCompleted
                        ? "bg-emerald-500"
                        : isPartiallyCompleted
                          ? "bg-amber-400"
                          : "bg-slate-300"
                  }`}
                />
                <span className="truncate">Sesiunea {sNum}</span>
              </div>

              {stats.total > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : isAllCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : isPartiallyCompleted
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {stats.completed}/{stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {totalSessions > 5 && (
        <div className="px-3.5 py-2 border-t border-slate-200/60 bg-white/40 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Derulează pentru mai multe</span>
          <span>↓</span>
        </div>
      )}
    </div>
  );
}
