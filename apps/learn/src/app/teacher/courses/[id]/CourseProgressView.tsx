"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TeacherNotesModal } from "./TeacherNotesModal";
import { StudentSubmissionsDrawer } from "./StudentSubmissionsDrawer";

type Props = {
  courseId: number;
};

type ProgressStatus = "all" | "not_started" | "in_progress" | "completed" | "on_pause";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "on_pause":
      return {
        label: "On Pause",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Not Started",
        className: "bg-neutral-100 text-neutral-600 border-neutral-200",
      };
  }
}

export function CourseProgressView({ courseId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgressStatus>("all");
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

  const { data, isLoading, error } = trpc.teacher.getCourseStudentsProgress.useQuery(
    { courseId },
    { retry: false },
  );

  const updateMutation = trpc.teacher.updateStudentProgress.useMutation({
    onSuccess: () => {
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
      utils.teacher.getMyCourses.invalidate();
      utils.course.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white rounded-xl border border-neutral-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto">
        <p className="text-red-600 font-semibold mb-2">Eroare la încărcarea progresului cursului.</p>
        <p className="text-xs text-neutral-500 mb-4">{error?.message || "Curs inexistent."}</p>
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

  const handleAdvanceSession = (studentId: number, current: number, completed: number) => {
    const nextSession = Math.min(total, current + 1);
    const nextCompleted = Math.min(total, Math.max(completed, current));
    updateMutation.mutate({
      courseId,
      studentId,
      currentSession: nextSession,
      completedSessions: nextCompleted,
    });
  };

  const handleMarkCompleted = (studentId: number) => {
    updateMutation.mutate({
      courseId,
      studentId,
      currentSession: total,
      completedSessions: total,
      status: "completed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <input
          type="text"
          placeholder="Caută elev..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3.5 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex flex-wrap gap-1.5 text-xs">
          {(["all", "in_progress", "completed", "on_pause", "not_started"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer capitalize ${
                statusFilter === st
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Students Roster */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
            <p className="text-neutral-500 text-sm">Niciun elev nu corespunde filtrelor.</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const badge = getStatusBadge(student.status);
            const isFinished = student.status === "completed" || student.completedSessions >= total;

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-neutral-900">{student.name}</h3>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-sm w-full space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-900">
                        Sesiune {student.currentSession} din {total}
                      </span>
                      <span className="text-neutral-500 font-semibold">{student.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${student.progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">{student.completedSessions} sesiuni completate</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      disabled={isFinished || updateMutation.isPending}
                      onClick={() => handleAdvanceSession(student.id, student.currentSession, student.completedSessions)}
                      className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                      +1 Sesiune
                    </button>
                    <button
                      type="button"
                      disabled={isFinished || updateMutation.isPending}
                      onClick={() => handleMarkCompleted(student.id)}
                      className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                      Finalizat
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDrawerStudent({
                          id: student.id,
                          name: student.name,
                        })
                      }
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                      title="Vezi și evaluează sarcinile elevului"
                    >
                      📝 Sarcini & Note
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingStudent({
                          id: student.id,
                          name: student.name,
                          notes: student.notes,
                          currentSession: student.currentSession,
                        })
                      }
                      className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition cursor-pointer"
                    >
                      💬 Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingStudent && (
        <TeacherNotesModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          courseId={courseId}
          studentId={editingStudent.id}
          studentName={editingStudent.name}
          initialNotes={editingStudent.notes}
          currentSession={editingStudent.currentSession}
          totalSessions={total}
        />
      )}

      {drawerStudent && (
        <StudentSubmissionsDrawer
          isOpen={!!drawerStudent}
          onClose={() => setDrawerStudent(null)}
          courseId={courseId}
          studentId={drawerStudent.id}
          studentName={drawerStudent.name}
        />
      )}
    </div>
  );
}
