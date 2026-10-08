"use client";

import { CourseSessionCard } from "./CourseSessionCard";
import type { AttachedResource } from "./types";

type CurriculumWeekSectionProps = {
  weekNumber: number;
  startSession: number;
  endSession: number;
  sessions: Array<{ number: number; title: string }>;
  resourcesBySession: Map<number | null, AttachedResource[]>;
  onAttachClick: (sessionNumber: number | null) => void;
  onEditSettingsClick: (resource: AttachedResource) => void;
  onDetachClick: (assignmentId: number, title: string) => void;
  onMoveUp: (index: number, sessionResources: AttachedResource[]) => void;
  onMoveDown: (index: number, sessionResources: AttachedResource[]) => void;
  onPreviewClick: (item: AttachedResource) => void;
}

export function CurriculumWeekSection({
  weekNumber,
  startSession,
  endSession,
  sessions,
  resourcesBySession,
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
      {/* Week Divider Banner (Monochrome Slate First) */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black shadow-2xs">
            W{weekNumber}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Săptămâna {weekNumber}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {startSession === endSession
                ? `Sesiunea ${startSession}`
                : `Sesiunile ${startSession} – ${endSession}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
            {weekResourcesCount} {weekResourcesCount === 1 ? "resursă" : "resurse"}
          </span>
        </div>
      </div>

      {/* Session Cards for this Week */}
      <div className="space-y-4">
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
    </div>
  );
}
