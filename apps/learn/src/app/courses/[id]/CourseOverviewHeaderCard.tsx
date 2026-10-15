"use client";

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

export function getLevelBadgeClass(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "intermediate":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "advanced":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
      : null;

  if (daysText && time) {
    return `${daysText} • ${time}`;
  }
  return daysText || time || "Program nespecificat";
}

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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-8 space-y-6">
      {/* Header with Title and Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{name}</h1>
          {level && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${getLevelBadgeClass(
                level,
              )}`}
            >
              {level}
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
    </div>
  );
}
