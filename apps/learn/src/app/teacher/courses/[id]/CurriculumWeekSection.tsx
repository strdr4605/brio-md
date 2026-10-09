"use client";

import { CourseSessionCard } from "./CourseSessionCard";
import type { AttachedResource } from "./types";

type CurriculumWeekSectionProps = {
  weekNumber: number;
  startSession: number;
  endSession: number;
  sessions: Array<{ number: number; title: string }>;
  resourcesBySession: Map<number | null, AttachedResource[]>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAttachClick: (sessionNumber: number | null) => void;
  onEditSettingsClick: (resource: AttachedResource) => void;
  onDetachClick: (assignmentId: number, title: string) => void;
  onMoveUp: (index: number, sessionResources: AttachedResource[]) => void;
  onMoveDown: (index: number, sessionResources: AttachedResource[]) => void;
  onPreviewClick: (item: AttachedResource) => void;
};

export function CurriculumWeekSection({
  weekNumber,
  startSession,
  endSession,
  sessions,
  resourcesBySession,
  isCollapsed,
  onToggleCollapse,
  onAttachClick,
  onEditSettingsClick,
  onDetachClick,
  onMoveUp,
  onMoveDown,
  onPreviewClick,
}: CurriculumWeekSectionProps) {
  // Count total resources across all sessions in this week
  const weekResourcesCount = sessions.reduce((sum, s) => {
    return sum + (resourcesBySession.get(s.number)?.length || 0);
  }, 0);

  return (
    <div className="space-y-4 pt-2">
      {/* Week Accordion Header (Canvas LMS Competitor Inspired) */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between gap-3 pb-2 border-b border-slate-200/90 text-left cursor-pointer group transition select-none"
      >
        <div className="flex items-center gap-3">
          {/* Circle chevron matching competitor screenshot */}
          <div
            className={`w-7 h-7 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform duration-200 shrink-0 ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black shadow-2xs">
              W{weekNumber}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide group-hover:text-blue-600 transition">
                Săptămâna {weekNumber}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {startSession === endSession
                  ? `Sesiunea ${startSession}`
                  : `Sesiunile ${startSession} – ${endSession}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
            {weekResourcesCount} {weekResourcesCount === 1 ? "resursă" : "resurse"}
          </span>
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition hidden sm:inline">
            {isCollapsed ? "Extinde" : "Restrânge"}
          </span>
        </div>
      </button>

      {/* Session Cards for this Week (Collapsible) */}
      {!isCollapsed && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {sessions.map((session) => {
            const sessionItems = (resourcesBySession.get(session.number) || []).sort(
              (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
            );

            return (
              <CourseSessionCard
                key={session.number}
                sessionNumber={session.number}
                title={session.title}
                resources={sessionItems}
                onAttachClick={onAttachClick}
                onEditSettingsClick={onEditSettingsClick}
                onDetachClick={onDetachClick}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onPreviewClick={onPreviewClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
