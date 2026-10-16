"use client";

import {
  Card,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  formatSchedule,
  getLevelBadgeClass,
  getLevelBadgeLabel,
} from "@brio-md/ui";

type Props = {
  name: string;
  level?: string | null;
  instructorName?: string | null;
  description?: string | null;
  sessionDurationMinutes?: number | null;
  scheduleDays?: string[] | null;
  scheduleTime?: string | null;
  completed: number;
  total: number;
  progressPct: number;
};

export function CourseOverviewHeaderCard({
  name,
  level,
  instructorName,
  description,
  sessionDurationMinutes,
  scheduleDays,
  scheduleTime,
  completed,
  total,
  progressPct,
}: Props) {
  const isFullyCompleted = progressPct === 100;

  return (
    <Card className="p-5 sm:p-8 space-y-6">
      {/* Header with Title and Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{name}</h1>
          {level && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${getLevelBadgeClass(
                level,
              )}`}
            >
              {getLevelBadgeLabel(level)}
            </span>
          )}
        </div>
        {instructorName && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shrink-0 shadow-2xs">
            <span className="font-semibold text-slate-500">Profesor:</span>
            <span className="font-bold text-slate-900">{instructorName}</span>
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
        {description || "Curriculum structurat, materiale interactive de învățare și exerciții practice."}
      </p>

      {/* Schedule & Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-5 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Durată Sesiune</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {sessionDurationMinutes ? `${sessionDurationMinutes} minute` : "60 minute"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Program Săptămânal</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {formatSchedule(scheduleDays, scheduleTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Progres General</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {completed} din {total} Sesiuni ({progressPct}%)
            </p>
          </div>
        </div>
      </div>

      {/* Motivating Completion Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Parcurs Didactic</span>
          {isFullyCompleted ? (
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span>🎉</span> Felicitări! Curs finalizat
            </span>
          ) : (
            <span className="font-semibold text-slate-500">
              {completed} / {total} lecții finalizate
            </span>
          )}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              isFullyCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs"
                : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-xs"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
