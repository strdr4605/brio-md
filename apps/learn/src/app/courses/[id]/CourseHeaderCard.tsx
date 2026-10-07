"use client";

type Props = {
  course: {
    name: string;
    level?: string | null;
    instructorName?: string | null;
    description?: string | null;
    sessionDurationMinutes?: number | null;
    scheduleDays?: string[] | null;
    scheduleTime?: string | null;
    totalSessions?: number | null;
  };
  completed: number;
  total: number;
  progressPct: number;
};

function getLevelBadgeClass(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "intermediate":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "advanced":
      return "bg-slate-200 text-slate-800 border-slate-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
      : null;

  if (daysText && time) {
    return `${daysText} • ${time}`;
  }
  return daysText || time || "Programul va fi anunțat în curând";
}

export function CourseHeaderCard({ course, completed, total, progressPct }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-8 hover:border-slate-300 transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {course.name}
          </h1>
          {course.level && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${getLevelBadgeClass(
                course.level,
              )}`}
            >
              {course.level}
            </span>
          )}
        </div>
        {course.instructorName && (
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
            <span className="font-semibold text-slate-500">Instructor:</span>
            <span className="font-semibold text-slate-900">{course.instructorName}</span>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-sm leading-relaxed max-w-4xl mb-6">
        {course.description || "Curriculum structurat cu sesiuni ghidate și materiale didactice interactive."}
      </p>

      {/* Schedule & Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Durată sesiune</p>
            <p className="text-sm font-bold text-slate-900">
              {course.sessionDurationMinutes ? `${course.sessionDurationMinutes} minute` : "60 minute"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Orar săptămânal</p>
            <p className="text-sm font-bold text-slate-900">
              {formatSchedule(course.scheduleDays, course.scheduleTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Progres plan</p>
            <p className="text-sm font-bold text-slate-900">
              {completed} din {total} sesiuni ({progressPct}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
