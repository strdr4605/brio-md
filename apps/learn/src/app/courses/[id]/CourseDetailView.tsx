"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CourseResourcesSection } from "./CourseResourcesSection";
import { CourseOverviewHeaderCard } from "./CourseOverviewHeaderCard";
import { StudentActiveTaskCard } from "./StudentActiveTaskCard";
import { StudentSubmissionsHistory } from "./StudentSubmissionsHistory";

type Props = {
  courseId: number;
};

export function CourseDetailView({ courseId }: Props) {
  const [selectedSessionNumber, setSelectedSessionNumber] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const {
    data: course,
    isLoading: isCourseLoading,
    error,
  } = trpc.course.getById.useQuery(
    { id: courseId },
    {
      retry: false,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  );

  const { data: courseResources = [] } = trpc.course.getCourseResources.useQuery(
    { courseId },
    { enabled: !!courseId },
  );

  const { data: mySubmissions = [], isLoading: isSubmissionsLoading } =
    trpc.lesson.getMySubmissions.useQuery(
      { courseId },
      { enabled: !!courseId },
    );

  const recordSubmissionMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getMySubmissions.invalidate({ courseId });
      utils.course.getById.invalidate({ id: courseId });
    },
  });

  if (isCourseLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48 mb-6" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Curs Indisponibil</h3>
        <p className="text-sm text-slate-600 mb-6">
          {error?.message || "Este posibil să nu fii înrolat în acest curs sau cursul nu există."}
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
        >
          ← Înapoi la Cursuri
        </Link>
      </div>
    );
  }

  const total = course.totalSessions || 1;
  const completed = course.progress?.completedSessions || 0;
  const currentSession = course.progress?.currentSession || 1;
  const progressPct = Math.min(100, Math.round((completed / total) * 100));

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
    return { sessionNumber: sessionNum, status };
  });

  const latestActiveSubmission = mySubmissions[0] || null;

  async function handleStudentSubmitTask(resourceId: number, notes?: string, fileUrl?: string) {
    let combinedFeedback = notes || "";
    if (fileUrl) {
      combinedFeedback = combinedFeedback ? `${combinedFeedback}\n[Link]: ${fileUrl}` : fileUrl;
    }

    await recordSubmissionMutation.mutateAsync({
      courseId,
      resourceId,
      status: "completed",
      teacherFeedback: combinedFeedback || undefined,
    });
  }

  return (
    <div className="space-y-8">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Înapoi la toate cursurile
        </Link>
      </div>

      {/* Course Overview Header Card */}
      <CourseOverviewHeaderCard
        name={course.name}
        level={course.level}
        instructorName={course.instructorName}
        description={course.description}
        sessionDurationMinutes={course.sessionDurationMinutes}
        scheduleDays={course.scheduleDays}
        scheduleTime={course.scheduleTime}
        completed={completed}
        total={total}
        progressPct={progressPct}
      />

      {/* Active Session Interactive Task Banner */}
      {courseResources.length > 0 && (
        <StudentActiveTaskCard
          currentSession={currentSession}
          resources={courseResources}
          existingSubmission={latestActiveSubmission}
          onSubmitTask={handleStudentSubmitTask}
          isSubmitting={recordSubmissionMutation.isPending}
        />
      )}

      {/* Main Grid: Materials & History (Left) and Interactive Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Resources, Materials & Submissions */}
        <div className="lg:col-span-5 space-y-6">
          <CourseResourcesSection
            courseId={courseId}
            materials={course.materials}
            notes={course.progress?.notes}
            selectedSessionNumber={selectedSessionNumber}
            onSelectSession={setSelectedSessionNumber}
            totalSessions={total}
          />

          <StudentSubmissionsHistory
            submissions={mySubmissions}
            isLoading={isSubmissionsLoading}
          />
        </div>

        {/* Right Column: Interactive Session Plan & Timeline */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Session Plan & Timeline</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ordered lesson roadmap from Session 1 to {total}
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg shrink-0 w-fit">
                Status: <span className="capitalize">{course.progress?.status?.replace("_", " ") || "In Progress"}</span>
              </div>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {sessionsList.map((session) => {
                const isCompleted = session.status === "completed";
                const isCurrent = session.status === "current";
                const isSelected = selectedSessionNumber === session.sessionNumber;

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

                    {/* Interactive Session Box */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSessionNumber(
                          isSelected ? null : session.sessionNumber,
                        )
                      }
                      className={`flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl border transition text-left cursor-pointer ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                          : isCurrent
                            ? "border-blue-400 bg-blue-50/50 shadow-2xs"
                            : isCompleted
                              ? "border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/40"
                              : "border-neutral-100 bg-neutral-50/60 hover:bg-neutral-100/60"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-white font-bold"
                              : isCurrent
                                ? "text-blue-900 font-bold"
                                : isCompleted
                                  ? "text-neutral-800"
                                  : "text-neutral-600"
                          }`}
                        >
                          Session {session.sessionNumber}
                        </p>
                        <p
                          className={`text-xs ${
                            isSelected ? "text-slate-300" : "text-neutral-500"
                          }`}
                        >
                          {isCompleted
                            ? "Completed lesson"
                            : isCurrent
                              ? "Current active session"
                              : "Upcoming scheduled session"}
                        </p>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                            Selectat
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                            Current
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-600">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </button>
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
