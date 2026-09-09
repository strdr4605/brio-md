"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

type Props = {
  courseId: number;
};

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

function getMaterialTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case "textbook":
      return {
        label: "Textbook",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "manual":
      return {
        label: "Manual",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "link":
      return {
        label: "External Link",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "file":
      return {
        label: "Document",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      };
    default:
      return {
        label: type,
        className: "bg-neutral-100 text-neutral-700 border-neutral-200",
      };
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
  return daysText || time || "Schedule to be announced";
}

export function CourseDetailView({ courseId }: Props) {
  const {
    data: course,
    isLoading,
    error,
  } = trpc.course.getById.useQuery(
    { id: courseId },
    {
      retry: false,
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-48 mb-6" />
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 rounded w-2/3" />
          <div className="h-20 bg-neutral-100 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/3" />
            <div className="h-16 bg-neutral-100 rounded" />
            <div className="h-16 bg-neutral-100 rounded" />
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/3" />
            <div className="h-16 bg-neutral-100 rounded" />
            <div className="h-16 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Course Unavailable</h3>
        <p className="text-sm text-neutral-600 mb-6">
          {error?.message || "You may not be enrolled in this course or it does not exist."}
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition cursor-pointer"
        >
          ← Back to All Courses
        </Link>
      </div>
    );
  }

  const total = course.totalSessions || 1;
  const completed = course.progress?.completedSessions || 0;
  const currentSession = course.progress?.currentSession || 1;
  const progressPct = Math.min(100, Math.round((completed / total) * 100));

  // Generate sessions list from 1 to total
  const sessionsList = Array.from({ length: total }, (_, i) => {
    const sessionNum = i + 1;
    let status: "completed" | "current" | "upcoming";

    if (sessionNum <= completed) {
      status = "completed";
    } else if (sessionNum === currentSession) {
      status = "current";
    } else {
      status = "upcoming";
    }

    return {
      sessionNumber: sessionNum,
      status,
    };
  });

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all courses
        </Link>
      </div>

      {/* Course Overview Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{course.name}</h1>
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
            <div className="flex items-center gap-2 text-sm text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/60 shrink-0">
              <span className="font-semibold text-neutral-500">Instructor:</span>
              <span className="font-medium text-neutral-900">{course.instructorName}</span>
            </div>
          )}
        </div>

        <p className="text-neutral-600 leading-relaxed max-w-4xl mb-6">
          {course.description || "In-depth course curriculum with guided sessions and supporting study materials."}
        </p>

        {/* Schedule & Metadata Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-100">
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
                {course.sessionDurationMinutes ? `${course.sessionDurationMinutes} minutes` : "60 minutes"}
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
                {formatSchedule(course.scheduleDays, course.scheduleTime)}
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

      {/* Main Grid: Materials (Left/Top) and Timeline (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Study Materials Section (5 columns on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Learning Materials</h2>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {course.materials.length} available
              </span>
            </div>

            {course.materials.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                <p className="text-sm text-neutral-500">No study materials attached to this course yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.materials.map((material) => {
                  const badge = getMaterialTypeBadge(material.type);
                  return (
                    <a
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-blue-400 hover:shadow-sm transition bg-white"
                    >
                      <div className="space-y-1.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition line-clamp-1">
                          {material.title}
                        </h3>
                      </div>

                      <div className="text-neutral-400 group-hover:text-blue-600 transition shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teacher Feedback / Progress Notes Card if available */}
          {course.progress?.notes && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-semibold text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                Teacher Feedback & Notes
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{course.progress.notes}</p>
            </div>
          )}
        </div>

        {/* Session Timeline Section (7 columns on large screens) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Session Plan & Timeline</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ordered lesson roadmap from Session 1 to {total}
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg">
                Status: <span className="capitalize">{course.progress?.status?.replace("_", " ") || "In Progress"}</span>
              </div>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {sessionsList.map((session) => {
                const isCompleted = session.status === "completed";
                const isCurrent = session.status === "current";

                return (
                  <div key={session.sessionNumber} className="relative flex items-center gap-4">
                    {/* Timeline Node Bullet */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-blue-600 text-white animate-pulse"
                            : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-[10px]">{session.sessionNumber}</span>
                      )}
                    </div>

                    {/* Session Box */}
                    <div
                      className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isCurrent
                          ? "border-blue-400 bg-blue-50/50 shadow-sm"
                          : isCompleted
                            ? "border-emerald-100 bg-emerald-50/20"
                            : "border-neutral-100 bg-neutral-50/60"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent
                              ? "text-blue-900 font-bold"
                              : isCompleted
                                ? "text-neutral-800"
                                : "text-neutral-600"
                          }`}
                        >
                          Session {session.sessionNumber}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {isCompleted
                            ? "Completed lesson"
                            : isCurrent
                              ? "Current active session"
                              : "Upcoming scheduled session"}
                        </p>
                      </div>

                      <div>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                            Current
                          </span>
                        )}
                        {!isCompleted && !isCurrent && (
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-600">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
