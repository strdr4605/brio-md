"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Card,
  EmptyState,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  formatSchedule,
  getLevelBadgeClass,
  getLevelBadgeLabel,
} from "@brio-md/ui";

export function CourseList() {
  const { data: courses = [], isLoading } = trpc.course.list.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-slate-200 rounded-lg w-1/2" />
              <div className="h-5 bg-slate-200 rounded-full w-16" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-2 bg-slate-100 rounded-full w-full" />
            <div className="h-10 bg-slate-200 rounded-xl w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <EmptyState
          icon={<BookOpenIcon className="w-6 h-6 text-indigo-600" />}
          title="Niciun Curs Alocat Momentan"
          description="Nu ești înrolat în niciun curs activ. Te rugăm să contactezi profesorul sau administrația școlii pentru atribuirea grupei."
        />
      </Card>
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
          <Card
            key={course.id}
            className="p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
          >
            {/* Playful Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />

            <div>
              {/* Header: Title and Level */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-950 transition">
                  {course.name}
                </h3>
                {course.level && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${getLevelBadgeClass(
                      course.level,
                    )}`}
                  >
                    {getLevelBadgeLabel(course.level)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {course.description || "Curriculum complet, sarcini interactive și resurse de studiu."}
              </p>

              {/* Metadata Badges with Vibrant Icons */}
              <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    Durată sesiune:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {course.sessionDurationMinutes ? `${course.sessionDurationMinutes} min` : "60 min"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Program:
                  </span>
                  <span className="font-semibold text-slate-800 truncate text-right">
                    {formatSchedule(course.scheduleDays, course.scheduleTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    <BookOpenIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                    <span className="text-indigo-700 font-semibold text-[11px]">
                      {completed} din {total} sesiuni ({progressPct}%)
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isFullyCompleted
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs"
                        : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xs"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Button: Vibrant Student Theme */}
            <Link
              href={`/courses/${course.id}`}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-[0.99] cursor-pointer gap-1.5"
            >
              <span>Continuă Cursul</span>
              <span aria-hidden="true">→</span>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
