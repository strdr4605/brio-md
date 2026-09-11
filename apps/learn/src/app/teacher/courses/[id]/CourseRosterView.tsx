"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { TeacherNotesModal } from "./TeacherNotesModal";

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

function cleanPhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 8 ? digits : null;
}

export function CourseRosterView({ courseId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgressStatus>("all");
  const [editingStudent, setEditingStudent] = useState<{
    id: number;
    name: string;
    notes: string | null;
    currentSession: number;
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
        <div className="h-6 bg-neutral-200 rounded w-40" />
        <div className="h-32 bg-white rounded-2xl border border-neutral-200" />
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
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-neutral-900 mb-1">Unable to Load Roster</h3>
        <p className="text-sm text-neutral-600 mb-6">{error?.message || "Course not found or unauthorized."}</p>
        <Link
          href="/teacher"
          className="inline-flex items-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          ← Back to My Workspace
        </Link>
      </div>
    );
  }

  const { course, students } = data;
  const total = course.totalSessions || 1;

  // Filter students
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

  const handleStatusChange = (studentId: number, newStatus: "not_started" | "in_progress" | "completed" | "on_pause") => {
    updateMutation.mutate({
      courseId,
      studentId,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Workspace
        </Link>
      </div>

      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{course.name}</h1>
              {course.level && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 capitalize">
                  {course.level}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600 max-w-3xl">
              {course.description || "Student learning progress tracker and stage management."}
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
            <span className="text-xs font-medium text-neutral-500">Class Size</span>
            <span className="text-lg font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-xl">
              {students.length} Enrolled
            </span>
          </div>
        </div>

        {/* Schedule details bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-neutral-100 text-xs text-neutral-600">
          <div>
            <span className="font-semibold text-neutral-500">📅 Schedule:</span>{" "}
            <span>{course.scheduleDays && course.scheduleDays.length > 0 ? course.scheduleDays.join(", ") : "TBA"}</span>
            {course.scheduleTime && <span> • {course.scheduleTime}</span>}
          </div>
          <div>
            <span className="font-semibold text-neutral-500">⏱ Session Length:</span>{" "}
            <span>{course.sessionDurationMinutes || 60} minutes</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-500">🔢 Total Plan:</span>{" "}
            <span>{total} sessions</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search student by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter Pills */}
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
            <p className="text-neutral-500 text-sm">
              {students.length === 0
                ? "No students enrolled in this course yet."
                : "No students matching your filter criteria."}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const badge = getStatusBadge(student.status);
            const isFinished = student.status === "completed" || student.completedSessions >= total;
            const waStudent = cleanPhoneForWhatsApp(student.phone);
            const waParent = cleanPhoneForWhatsApp(student.parentPhone);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Student Info & Contacts */}
                  <div className="space-y-2 flex-1 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-neutral-900">{student.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {/* Quick Status Select */}
                          <select
                            value={student.status}
                            onChange={(e) =>
                              handleStatusChange(
                                student.id,
                                e.target.value as "not_started" | "in_progress" | "completed" | "on_pause",
                              )
                            }
                            className="text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-0.5 text-neutral-700 cursor-pointer focus:outline-none"
                          >
                            <option value="in_progress">Set In Progress</option>
                            <option value="on_pause">Set On Pause</option>
                            <option value="completed">Set Completed</option>
                            <option value="not_started">Set Not Started</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="text-xs text-neutral-600 space-y-1 pl-13">
                      {student.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">Phone:</span>
                          <a href={`tel:${student.phone}`} className="font-medium hover:underline text-neutral-800">
                            {student.phone}
                          </a>
                          {waStudent && (
                            <a
                              href={`https://wa.me/${waStudent}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                              title="Message on WhatsApp"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      ) : null}

                      {student.parentName || student.parentPhone ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-neutral-400">Parent:</span>
                          {student.parentName && <span>{student.parentName}</span>}
                          {student.parentPhone && (
                            <>
                              <a href={`tel:${student.parentPhone}`} className="font-medium hover:underline text-neutral-800">
                                {student.parentPhone}
                              </a>
                              {waParent && (
                                <a
                                  href={`https://wa.me/${waParent}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                                  title="Message Parent on WhatsApp"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Stage Progress Tracker */}
                  <div className="flex-1 max-w-sm w-full space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-900">
                        Session {student.currentSession} of {total}
                      </span>
                      <span className="text-neutral-500 font-semibold">{student.progressPercentage}%</span>
                    </div>

                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${student.progressPercentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-neutral-500">
                      {student.completedSessions} completed sessions
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* +1 Session Quick Action */}
                    <button
                      type="button"
                      disabled={isFinished || updateMutation.isPending}
                      onClick={() =>
                        handleAdvanceSession(student.id, student.currentSession, student.completedSessions)
                      }
                      className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Advance to next session"
                    >
                      <span>+1 Session</span>
                    </button>

                    {/* Mark Completed Button */}
                    <button
                      type="button"
                      disabled={isFinished || updateMutation.isPending}
                      onClick={() => handleMarkCompleted(student.id)}
                      className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Mark full course completed"
                    >
                      Mark Completed
                    </button>

                    {/* Teacher Notes Button */}
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
                      className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>Notes</span>
                      {student.notes && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Has feedback notes" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline preview of teacher notes if present */}
                {student.notes && (
                  <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-600 bg-amber-50/40 p-3 rounded-xl border border-amber-200/50 flex items-start gap-2">
                    <span className="text-amber-600 font-semibold shrink-0">Note:</span>
                    <p className="line-clamp-2">{student.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Teacher Notes Modal */}
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
    </div>
  );
}
