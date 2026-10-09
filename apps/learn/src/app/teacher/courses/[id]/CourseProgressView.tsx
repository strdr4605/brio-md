"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
<<<<<<< HEAD
import { StudentDossierDrawer } from "./StudentDossierDrawer";
=======
import { TeacherNotesModal } from "./TeacherNotesModal";
import { StudentSubmissionsDrawer } from "./StudentSubmissionsDrawer";
>>>>>>> origin/feat/learn-teacher-grading-drawer

type Props = {
  courseId: number;
};

type ProgressStatus = "all" | "not_started" | "in_progress" | "completed" | "on_pause";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completat",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "in_progress":
      return {
        label: "În Curs",
        className: "bg-slate-100 text-slate-800 border-slate-200",
      };
    case "on_pause":
      return {
        label: "Pe Pauză",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Neînceput",
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
}

export function CourseProgressView({ courseId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgressStatus>("all");
<<<<<<< HEAD
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
=======
  const [editingStudent, setEditingStudent] = useState<{
    id: number;
    name: string;
    notes: string | null;
    currentSession: number;
  } | null>(null);
  const [drawerStudent, setDrawerStudent] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const utils = trpc.useUtils();
>>>>>>> origin/feat/learn-teacher-grading-drawer

  const { data, isLoading, error } = trpc.teacher.getCourseStudentsProgress.useQuery(
    { courseId },
    { retry: false },
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-white rounded-2xl border border-slate-200/80" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200/80" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto">
        <p className="text-rose-600 font-semibold mb-2">Eroare la încărcarea progresului cursului.</p>
        <p className="text-xs text-slate-500 mb-4">{error?.message || "Curs inexistent."}</p>
      </div>
    );
  }

  const { course, students } = data;
  const total = course.totalSessions || 1;

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Caută elev după nume..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-slate-400 transition"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status Filter Dropdown with proper padding */}
        <div className="relative min-w-[170px] sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProgressStatus)}
            aria-label="Filtrează după status"
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-slate-400 transition appearance-none cursor-pointer hover:bg-slate-100/70"
          >
            <option value="all">Toți elevii</option>
            <option value="in_progress">În Curs</option>
            <option value="completed">Completat</option>
            <option value="on_pause">Pe Pauză</option>
            <option value="not_started">Neînceput</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modern Student Roster (SpeedGrader Master Row) */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200/80 p-12 text-center">
            <p className="text-slate-500 text-sm font-medium">Niciun elev nu corespunde filtrelor.</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const badge = getStatusBadge(student.status);

            return (
              <div
                key={student.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedStudentId(student.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedStudentId(student.id);
                  }
                }}
                className="group bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Avatar + Identity */}
                <div className="flex items-center gap-3.5 min-w-0 md:w-1/3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate group-hover:text-slate-950 transition">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {student.notes && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={student.notes}>
                          💬 {student.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Progress Bar & Session Metrics */}
                <div className="md:w-1/3 w-full space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">
                      Sesiune {student.currentSession} din {total}
                    </span>
                    <span className="font-bold text-slate-900">{student.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${student.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {student.completedSessions} sesiuni finalizate
                  </p>
                </div>

                {/* Right: Clean Master-Detail Trigger */}
                <div className="flex items-center justify-end shrink-0 md:w-1/4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 group-hover:text-slate-950 bg-slate-100 group-hover:bg-slate-200/80 border border-slate-200/80 px-3.5 py-1.5 rounded-xl transition">
                    <span>Vezi Dosar</span>
                    <svg
                      className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-over Academic Dossier Drawer */}
      <StudentDossierDrawer
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
        courseId={courseId}
        totalSessions={total}
        students={filteredStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudentId={setSelectedStudentId}
      />
    </div>
  );
}
