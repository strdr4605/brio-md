"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { LiveLessonWorkspace } from "./LiveLessonWorkspace";
import { CourseProgressView } from "./CourseProgressView";

type Props = {
  courseId: number;
};

export function CourseRosterView({ courseId }: Props) {
  const [viewMode, setViewMode] = useState<"live" | "progress">("live");

  const { data, isLoading, error } = trpc.teacher.getCourseStudentsProgress.useQuery(
    { courseId },
    { retry: false },
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-48" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Eroare la încărcarea cursului</h3>
        <p className="text-sm text-slate-600 mb-6">{error?.message || "Curs inexistent sau neautorizat."}</p>
        <Link
          href="/teacher"
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-[4px] transition cursor-pointer"
        >
          ← Înapoi la cursuri
        </Link>
      </div>
    );
  }

  const { course, students } = data;
  const total = course.totalSessions || 1;

  return (
    <div className="space-y-4">
      {/* Sleek Top Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("live")}
            className={`py-1.5 px-3.5 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "live"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>⚡</span>
            <span>Daily Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("progress")}
            className={`py-1.5 px-3.5 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "progress"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>📊</span>
            <span>Progres General ({students.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-3 px-2">
          <span>Plan: <strong className="text-slate-700">{total} sesiuni</strong></span>
          {course.scheduleTime && <span>• {course.scheduleTime}</span>}
        </div>
      </div>

      {/* Progress view course header when in progress mode */}
      {viewMode === "progress" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{course.name}</h1>
            {course.level && (
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-[4px] border border-slate-300 bg-slate-50 text-slate-700">
                {course.level}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {course.description || "Evidența generală a progresului elevilor în cadrul cursului."}
          </p>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === "live" ? (
        <LiveLessonWorkspace courseId={courseId} />
      ) : (
        <CourseProgressView courseId={courseId} />
      )}
    </div>
  );
}
