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

export function TeacherDashboard() {
  const { data: courses = [], isLoading } = trpc.teacher.getMyCourses.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 h-24" />
          ))}
        </div>

        {/* Courses Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 h-80" />
          ))}
        </div>
      </div>
    );
  }

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
  const activeStudents = courses.reduce((acc, c) => acc + (c.activeStudents || 0), 0);
  const overallAvgCompletion =
    totalCourses > 0
      ? Math.round(courses.reduce((acc, c) => acc + (c.averageCompletionRate || 0), 0) / totalCourses)
      : 0;

  return (
    <div className="space-y-8">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Workspace</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Monitor course performance, view enrolled students, and track learning progress.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            📚
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Assigned Courses</p>
            <p className="text-2xl font-bold text-neutral-900">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            👥
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-2xl font-bold text-neutral-900">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Active Learners</p>
            <p className="text-2xl font-bold text-neutral-900">{activeStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            📈
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg Completion</p>
            <p className="text-2xl font-bold text-neutral-900">{overallAvgCompletion}%</p>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Assigned Courses</h3>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center text-2xl">
              📖
            </div>
            <h4 className="text-lg font-bold text-neutral-900 mb-1">No Courses Assigned</h4>
            <p className="text-sm text-neutral-500">
              You are currently not assigned to any active courses. Contact your school administrator to be assigned to classes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const completionRate = course.averageCompletionRate || 0;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-lg font-bold text-neutral-900 leading-snug">{course.name}</h4>
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

                    <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                      {course.description || "Course curriculum and session progression."}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4 text-xs text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-500">📅 Schedule:</span>
                        <span className="truncate">{formatSchedule(course.scheduleDays, course.scheduleTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-500">⏱ Duration:</span>
                        <span>{course.sessionDurationMinutes || 60} min • {course.totalSessions} sessions</span>
                      </div>
                    </div>

                    {/* Status Chips Breakdown */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-medium">
                        {course.activeStudents || 0} In Progress
                      </span>
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                        {course.completedStudents || 0} Completed
                      </span>
                      {course.pausedStudents > 0 && (
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                          {course.pausedStudents} On Pause
                        </span>
                      )}
                    </div>

                    {/* Average Completion Bar */}
                    <div className="mb-6 pt-3 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-medium text-neutral-700">Cohort Average Completion</span>
                        <span className="text-neutral-600 font-semibold">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer gap-1.5"
                  >
                    <span>View Progress</span>
                    <span>→</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
