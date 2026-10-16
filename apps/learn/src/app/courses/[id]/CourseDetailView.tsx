"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Card,
  ArrowLeftIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@brio-md/ui";
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
        <div className="h-6 bg-slate-200 rounded-lg w-48 mb-6" />
        <Card className="p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </Card>
      </div>
    );
  }

  if (error || !course) {
    return (
      <Card className="p-10 sm:p-12 text-center max-w-lg mx-auto mt-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertTriangleIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1.5">Curs Indisponibil</h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          {error?.message || "Este posibil să nu fii înrolat în acest curs sau cursul nu există."}
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
        >
          ← Înapoi la Cursuri
        </Link>
      </Card>
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
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs"
        >
          <ArrowLeftIcon className="w-4 h-4 text-slate-400" />
          <span>Înapoi la toate cursurile</span>
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
          <Card className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Plan & Cronologie Sesiuni</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parcursul structurat al lecțiilor de la Sesiunea 1 până la {total}
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shrink-0 w-fit">
                Status: <span className="capitalize">{course.progress?.status?.replace("_", " ") || "În desfășurare"}</span>
              </div>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {sessionsList.map((session) => {
                const isCompleted = session.status === "completed";
                const isCurrent = session.status === "current";
                const isSelected = selectedSessionNumber === session.sessionNumber;

                return (
                  <div key={session.sessionNumber} className="relative flex items-center gap-4">
                    {/* Timeline Node Bullet */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
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
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : isCurrent
                            ? "border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50/80 shadow-2xs"
                            : isCompleted
                              ? "border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/50"
                              : "border-slate-100 bg-slate-50/60 hover:bg-slate-100/60"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-white font-bold"
                              : isCurrent
                                ? "text-indigo-950 font-bold"
                                : isCompleted
                                  ? "text-slate-800"
                                  : "text-slate-600"
                          }`}
                        >
                          Sesiunea {session.sessionNumber}
                        </p>
                        <p
                          className={`text-xs ${
                            isSelected ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {isCompleted
                            ? "Lecție finalizată"
                            : isCurrent
                              ? "Lecția curentă activă"
                              : "Lecție programată viitoare"}
                        </p>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                            Selectat
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Finalizat
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Curent
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-600">
                            Viitor
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
