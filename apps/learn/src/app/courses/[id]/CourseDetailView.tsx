"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CourseHeaderCard } from "./CourseHeaderCard";
import { CourseTimelineList } from "./CourseTimelineList";
import { StudentActiveTaskCard } from "./StudentActiveTaskCard";
import { StudentSubmissionsHistory } from "./StudentSubmissionsHistory";

type Props = {
  courseId: number;
};

function getMaterialTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case "textbook":
      return { label: "Manual", className: "bg-slate-100 text-slate-700 border-slate-200" };
    case "manual":
      return { label: "Ghid", className: "bg-slate-100 text-slate-700 border-slate-200" };
    case "link":
      return { label: "Link extern", className: "bg-slate-100 text-slate-700 border-slate-200" };
    case "file":
    case "pdf":
      return { label: "Document", className: "bg-slate-100 text-slate-700 border-slate-200" };
    default:
      return { label: type, className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export function CourseDetailView({ courseId }: Props) {
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
      {/* Back navigation */}
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
      <CourseHeaderCard
        course={course}
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

      {/* Main Grid: Materials & History (Left) and Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          {/* Study Materials Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-slate-300 transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Materiale de Studiu</h2>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {course.materials.length} disponibile
              </span>
            </div>

            {course.materials.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">Nu există materiale atașate la acest curs.</p>
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
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition bg-white"
                    >
                      <div className="space-y-1 pr-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
                          {badge.label}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition line-clamp-1">
                          {material.title}
                        </h3>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-700 transition shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submissions History Component */}
          <StudentSubmissionsHistory
            submissions={mySubmissions}
            isLoading={isSubmissionsLoading}
          />
        </div>

        {/* Timeline Section */}
        <div className="lg:col-span-7">
          <CourseTimelineList
            sessionsList={sessionsList}
            total={total}
            courseStatus={course.progress?.status}
          />
        </div>
      </div>
    </div>
  );
}
