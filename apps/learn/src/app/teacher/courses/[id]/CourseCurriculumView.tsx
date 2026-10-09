"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CourseSessionCard } from "./CourseSessionCard";
import { AttachResourceDrawer } from "./AttachResourceDrawer";
import { type AttachedResource } from "./types";

type Props = {
  courseId: number;
};

export function CourseCurriculumView({ courseId }: Props) {
  const [selectedSessionForAttach, setSelectedSessionForAttach] = useState<number | null>(null);
  const [isAttachDrawerOpen, setIsAttachDrawerOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: courseProgressData, isLoading: isCourseLoading } =
    trpc.teacher.getCourseStudentsProgress.useQuery(
      { courseId },
      { retry: false },
    );

  const { data: rawResources = [], isLoading: isResourcesLoading } =
    trpc.resource.getCourseResources.useQuery(
      { courseId },
      { staleTime: 5000 },
    );

  const resources = rawResources as AttachedResource[];

  const reorderMutation = trpc.resource.reorderSessionResources.useMutation({
    onSuccess: () => {
      utils.resource.getCourseResources.invalidate({ courseId });
    },
    onError: (err) => {
      setFeedbackMsg(`Eroare la reordonare: ${err.message}`);
    },
  });

  const detachMutation = trpc.resource.detachResourceFromSession.useMutation({
    onSuccess: () => {
      utils.resource.getCourseResources.invalidate({ courseId });
      setFeedbackMsg("Resursa a fost detașată din sesiune.");
      setTimeout(() => setFeedbackMsg(null), 3000);
    },
    onError: (err) => {
      setFeedbackMsg(`Eroare la detașare: ${err.message}`);
    },
  });

  if (isCourseLoading || isResourcesLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-white rounded-2xl border border-slate-200" />
          <div className="h-24 bg-white rounded-2xl border border-slate-200" />
          <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const course = courseProgressData?.course;
  const totalSessions = course?.totalSessions || 1;

  // Find max session number present in assigned resources
  const assignedSessionNumbers = resources
    .map((r) => r.sessionNumber)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const maxAssignedSession = assignedSessionNumbers.length > 0 ? Math.max(...assignedSessionNumbers) : 0;
  const effectiveTotalSessions = Math.max(totalSessions, maxAssignedSession);

  // Group resources by session
  const resourcesBySession = new Map<number | null, AttachedResource[]>();
  for (const item of resources) {
    const list = resourcesBySession.get(item.sessionNumber) || [];
    list.push(item);
    resourcesBySession.set(item.sessionNumber, list);
  }

  // Session 1..N array
  const sessionList: Array<{ number: number | null; title: string }> = [];
  for (let i = 1; i <= effectiveTotalSessions; i++) {
    sessionList.push({ number: i, title: `Sesiunea ${i}` });
  }

  // If there are unassigned / global resources for this course
  const unassignedResources = resourcesBySession.get(null) || [];
  if (unassignedResources.length > 0) {
    sessionList.push({ number: null, title: "Resurse Generale / Fără sesiune alocată" });
  }

  // Count metrics
  const totalWorksheets = resources.filter((r) => r.resource.type === "worksheet").length;
  const totalMinigames = resources.filter((r) => r.resource.type === "minigame").length;

  const handleOpenAttachDrawer = (sessionNumber?: number | null) => {
    setSelectedSessionForAttach(sessionNumber ?? 1);
    setIsAttachDrawerOpen(true);
  };

  const handleDetach = (assignmentId: number, title: string) => {
    if (confirm(`Sigur doriți să detașați «${title}» din această sesiune?`)) {
      detachMutation.mutate({ id: assignmentId });
    }
  };

  const handleMove = (index: number, direction: "up" | "down", sessionResources: AttachedResource[]) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sessionResources.length) return;

    const reordered = [...sessionResources];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const items = reordered.map((item, idx) => ({
      id: item.id,
      orderIndex: idx,
    }));

    reorderMutation.mutate({
      courseId,
      sessionNumber: sessionResources[0]?.sessionNumber ?? null,
      items,
    });
  };

  return (
    <div className="space-y-6">
      {/* Course Curriculum Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {course?.name || "Plan de Învățământ & Resurse"}
            </h1>
            {course?.level && (
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700">
                {course.level}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {course?.description ||
              "Structura curriculară a sesiunilor de curs și materialele interactive atașate elevilor."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/teacher/resources"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200/70"
          >
            <span>📁</span>
            <span>Biblioteca Globală</span>
          </Link>
          <button
            type="button"
            onClick={() => handleOpenAttachDrawer(1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
          >
            <span>+</span>
            <span>Atașează Resursă</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner (Monochrome Slate First) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sesiuni
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {effectiveTotalSessions}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Planificat: {course?.totalSessions || 1} sesiuni
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Resurse Atașate
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {resources.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalWorksheets} fișe de lucru • {totalMinigames} minijocuri
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Acoperire Syllabus
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {Math.round(
              (sessionList.filter((s) => (resourcesBySession.get(s.number) || []).length > 0).length /
                effectiveTotalSessions) *
                100,
            )}
            %
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Sesiuni cu materiale configurate
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-800 animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Session List */}
      <div className="space-y-4">
        {sessionList.map((session) => {
          const sessionItems = (resourcesBySession.get(session.number) || []).sort(
            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
          );

          return (
            <CourseSessionCard
              key={session.number ?? "general"}
              sessionNumber={session.number}
              title={session.title}
              resources={sessionItems}
              onAttachClick={handleOpenAttachDrawer}
              onEditSettingsClick={() => {}}
              onDetachClick={handleDetach}
              onMoveUp={(idx, list) => handleMove(idx, "up", list)}
              onMoveDown={(idx, list) => handleMove(idx, "down", list)}
            />
          );
        })}
      </div>

      {/* Attach Resource Drawer */}
      <AttachResourceDrawer
        isOpen={isAttachDrawerOpen}
        onClose={() => setIsAttachDrawerOpen(false)}
        courseId={courseId}
        initialSessionNumber={selectedSessionForAttach}
        totalSessions={effectiveTotalSessions}
        onSuccess={() => {
          utils.resource.getCourseResources.invalidate({ courseId });
        }}
      />
    </div>
  );
}
