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
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
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
  return daysText || time || "Schedule to be announced";
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
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{name}</h1>
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
          <div className="flex items-center gap-2 text-sm text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/60 shrink-0">
            <span className="font-semibold text-neutral-500">Instructor:</span>
            <span className="font-medium text-neutral-900">{instructorName}</span>
          </div>
        )}
      </div>

      <p className="text-neutral-600 leading-relaxed max-w-4xl mb-6">
        {description || "In-depth course curriculum with guided sessions and supporting study materials."}
      </p>

      {/* Schedule & Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Session Duration</p>
            <p className="text-sm font-semibold text-neutral-900">
              {sessionDurationMinutes ? `${sessionDurationMinutes} minutes` : "60 minutes"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Weekly Schedule</p>
            <p className="text-sm font-semibold text-neutral-900">
              {formatSchedule(scheduleDays, scheduleTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Plan Progress</p>
            <p className="text-sm font-semibold text-neutral-900">
              {completed} of {total} Sessions ({progressPct}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
