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
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
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
  return daysText || time || "Schedule TBA";
}

export function CourseList() {
  const { data: courses = [], isLoading } = trpc.course.list.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 animate-pulse space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-6 bg-neutral-200 rounded w-1/2" />
              <div className="h-5 bg-neutral-200 rounded w-16" />
            </div>
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-1/3" />
            <div className="h-2 bg-neutral-200 rounded w-full" />
            <div className="h-10 bg-neutral-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-12 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-1">No Courses Assigned Yet</h3>
        <p className="text-sm text-neutral-500">
          You are not enrolled in any active courses. Contact your administrator or teacher for assistance.
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

        return (
          <div
            key={course.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-neutral-200 p-6 flex flex-col justify-between transition"
          >
            <div>
              {/* Header: Title and Level */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-neutral-900 leading-snug">{course.name}</h3>
                {course.level && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${getLevelBadgeClass(
                      course.level,
                    )}`}
                  >
                    {course.level}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                {course.description || "Comprehensive curriculum and study materials."}
              </p>

              {/* Metadata Badges */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center text-xs text-neutral-600 gap-1.5">
                  <span className="font-medium text-neutral-500">⏱ Duration:</span>
                  <span>{course.sessionDurationMinutes ? `${course.sessionDurationMinutes} min` : "60 min"}</span>
                </div>

                <div className="flex items-center text-xs text-neutral-600 gap-1.5">
                  <span className="font-medium text-neutral-500">📅 Schedule:</span>
                  <span className="truncate">{formatSchedule(course.scheduleDays, course.scheduleTime)}</span>
                </div>

                <div className="flex items-center text-xs text-neutral-600 gap-1.5">
                  <span className="font-medium text-neutral-500">🔢 Total Sessions:</span>
                  <span>{course.totalSessions} sessions</span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-6 pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-neutral-700">Course Progress</span>
                  <span className="text-neutral-500 font-semibold">
                    {completed} of {total} completed ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <Link
              href={`/courses/${course.id}`}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              Open Course
            </Link>
          </div>
        );
      })}
    </div>
  );
}

