"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

function getLevelBadgeClass(level: string | null | undefined) {
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

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
      : null;

  if (daysText && time) {
    return `${daysText} • ${time}`;
  }
  return daysText || time || "Program nespecificat";
}

export function CourseList() {
  const { data: courses = [], isLoading } = trpc.course.list.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-pulse space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-6 bg-slate-200 rounded-lg w-1/2" />
              <div className="h-5 bg-slate-200 rounded-full w-16" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-2 bg-slate-100 rounded-full w-full" />
            <div className="h-10 bg-slate-200 rounded-xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 sm:p-12 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1.5">Niciun Curs Alocat Momentan</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          Nu ești înrolat în niciun curs activ. Te rugăm să contactezi profesorul sau administrația școlii pentru atribuirea grupei.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const total = course.totalSessions || 1;
        const completed = course.progress?.completedSessions || 0;
        const progressPct = Math.min(100, Math.round((completed / total) * 100));
        const isFullyCompleted = progressPct === 100;

        return (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 p-6 flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Header: Title and Level */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-slate-700 transition">
                  {course.name}
                </h3>
                {course.level && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${getLevelBadgeClass(
                      course.level,
                    )}`}
                  >
                    {course.level}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {course.description || "Curriculum complet, sarcini interactive și resurse de studiu."}
              </p>

              {/* Metadata Badges */}
              <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Durată sesiune:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {course.sessionDurationMinutes ? `${course.sessionDurationMinutes} min` : "60 min"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Program:
                  </span>
                  <span className="font-semibold text-slate-800 truncate text-right">
                    {formatSchedule(course.scheduleDays, course.scheduleTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Total sesiuni:
                  </span>
                  <span className="font-semibold text-slate-800">{course.totalSessions} sesiuni</span>
                </div>
              </div>

              {/* Elevated Progress Indicator with Vibrant Accent */}
              <div className="mb-6 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-slate-700">Progres Curs</span>
                  {isFullyCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span>🎉</span>
                      <span>Finalizat (100%)</span>
                    </span>
                  ) : (
                    <span className="text-slate-600 font-semibold text-[11px]">
                      {completed} din {total} sesiuni ({progressPct}%)
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isFullyCompleted
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link
              href={`/courses/${course.id}`}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer gap-1.5"
            >
              <span>Accesează Cursul</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
