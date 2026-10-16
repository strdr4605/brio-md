"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Card,
  EmptyState,
  BookOpenIcon,
  UsersIcon,
  ZapIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  formatSchedule,
  getLevelBadgeClass,
  getLevelBadgeLabel,
} from "@brio-md/ui";

export function TeacherDashboard() {
  const { data: courses = [], isLoading } = trpc.teacher.getMyCourses.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 h-24" />
          ))}
        </div>

        {/* Courses Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 h-80" />
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Spațiul Meu de Lucru</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Monitorizează activitatea grupelor, progresul elevilor și desfășurarea lecțiilor.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards: Sleek Slate Monochrome */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 hover:border-slate-300 transition shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center shrink-0">
            <BookOpenIcon className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cursuri Atribuite</p>
            <p className="text-2xl font-black text-slate-900">{totalCourses}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:border-slate-300 transition shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Elevi Înrolați</p>
            <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:border-slate-300 transition shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center shrink-0">
            <ZapIcon className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Elevi Activi</p>
            <p className="text-2xl font-black text-slate-900">{activeStudents}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:border-slate-300 transition shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center shrink-0">
            <TrendingUpIcon className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rată Finalizare</p>
            <p className="text-2xl font-black text-slate-900">{overallAvgCompletion}%</p>
          </div>
        </Card>
      </div>

      {/* Courses List */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 tracking-tight">Cursuri Alocate</h3>

        {courses.length === 0 ? (
          <Card className="p-10 text-center max-w-lg mx-auto">
            <EmptyState
              icon={<BookOpenIcon className="w-6 h-6 text-slate-700" />}
              title="Niciun Curs Atribuit Momentan"
              description="Nu ești asignat niciunui curs activ. Te rugăm să contactezi conducerea școlii pentru a primi grupe și clase."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const completionRate = course.averageCompletionRate || 0;

              return (
                <Card
                  key={course.id}
                  className="p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
                >
                  <div>
                    {/* Header: Title & Level */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{course.name}</h4>
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

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {course.description || "Curriculumul cursului, progresia sesiunilor și catalogul activ."}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Program:
                        </span>
                        <span className="truncate text-slate-800 font-semibold text-right">
                          {formatSchedule(course.scheduleDays, course.scheduleTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-500 flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Durată sesiune:
                        </span>
                        <span className="text-slate-800 font-semibold">
                          {course.sessionDurationMinutes || 60} min • {course.totalSessions} sesiuni
                        </span>
                      </div>
                    </div>

                    {/* Status Chips Breakdown */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                        {course.activeStudents || 0} În desfășurare
                      </span>
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold shadow-2xs">
                        {course.completedStudents || 0} Finalizate
                      </span>
                      {course.pausedStudents > 0 && (
                        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          {course.pausedStudents} În pauză
                        </span>
                      )}
                    </div>

                    {/* Average Completion Bar: Slate Monochrome */}
                    <div className="mb-6 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">Rată Medie Finalizare Grupe</span>
                        <span className="text-slate-900 font-bold">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                        <div
                          className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button: Slate Monochrome */}
                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer gap-1.5"
                  >
                    <span>Deschide Cursul & Catalogul</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
