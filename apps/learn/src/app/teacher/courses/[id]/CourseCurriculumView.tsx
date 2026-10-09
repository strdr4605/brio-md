"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { CourseSessionCard } from "./CourseSessionCard";
import { CurriculumWeekSection } from "./CurriculumWeekSection";
import { CurriculumOverviewBanner } from "./CurriculumOverviewBanner";
import { CurriculumHeader } from "./CurriculumHeader";
import { CurriculumModals } from "./CurriculumModals";
import {
  CurriculumLoadingSkeleton,
  CurriculumErrorBanner,
} from "./CurriculumStateFeedback";
import { type AttachedResource } from "./types";

type Props = {
  courseId: number;
};

export function CourseCurriculumView({ courseId }: Props) {
  const [selectedSessionForAttach, setSelectedSessionForAttach] = useState<number | null>(null);
  const [isAttachDrawerOpen, setIsAttachDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AttachedResource | null>(null);
  const [detachingItem, setDetachingItem] = useState<{ id: number; title: string } | null>(null);
  const [previewResource, setPreviewResource] = useState<{
    id: number;
    title: string;
    type: string;
    url: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [customSessionsPerWeek, setCustomSessionsPerWeek] = useState<number | null>(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());

  // Load collapsed weeks preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`course_${courseId}_collapsed_weeks`);
      if (saved) {
        setCollapsedWeeks(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, [courseId]);

  const utils = trpc.useUtils();

  const { data: courseProgressData, isLoading: isCourseLoading, error: courseError } =
    trpc.teacher.getCourseStudentsProgress.useQuery(
      { courseId },
      { retry: false, staleTime: 30000 },
    );

  const { data: rawResources = [], isLoading: isResourcesLoading, error: resourcesError } =
    trpc.resource.getCourseResources.useQuery(
      { courseId },
      { retry: false, staleTime: 30000 },
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
    return <CurriculumLoadingSkeleton />;
  }

  if (courseError || resourcesError) {
    return (
      <CurriculumErrorBanner
        message={resourcesError?.message || courseError?.message}
        onRetry={() => {
          utils.resource.getCourseResources.invalidate({ courseId });
          utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
        }}
      />
    );
  }

  const course = courseProgressData?.course;
  const totalSessions = course?.totalSessions || 1;

  // Determine cadence (sessions per week) from course schedule days (default: 2)
  const scheduleDaysCount = course?.scheduleDays?.length || 0;
  const defaultSessionsPerWeek = scheduleDaysCount > 0 ? scheduleDaysCount : 2;
  const sessionsPerWeek = customSessionsPerWeek ?? defaultSessionsPerWeek;

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

  // Divide sessions into weeks based on sessionsPerWeek
  const totalWeeks = Math.ceil(effectiveTotalSessions / sessionsPerWeek);
  const weeks: Array<{
    weekNumber: number;
    startSession: number;
    endSession: number;
    sessions: Array<{ number: number; title: string }>;
  }> = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const start = (w - 1) * sessionsPerWeek + 1;
    const end = Math.min(w * sessionsPerWeek, effectiveTotalSessions);
    const weekSessions: Array<{ number: number; title: string }> = [];
    for (let s = start; s <= end; s++) {
      weekSessions.push({ number: s, title: `Sesiunea ${s}` });
    }
    weeks.push({
      weekNumber: w,
      startSession: start,
      endSession: end,
      sessions: weekSessions,
    });
  }

  const unassignedResources = resourcesBySession.get(null) || [];

  // Count metrics
  const totalWorksheets = resources.filter((r) => r.resource.type === "worksheet").length;
  const totalMinigames = resources.filter((r) => r.resource.type === "minigame").length;
  const coveredSessionsCount = weeks
    .flatMap((w) => w.sessions)
    .filter((s) => (resourcesBySession.get(s.number) || []).length > 0).length;
  const syllabusCoveragePercent = Math.round((coveredSessionsCount / effectiveTotalSessions) * 100);

  const toggleWeekCollapse = (weekNum: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      try {
        localStorage.setItem(`course_${courseId}_collapsed_weeks`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const toggleAllCollapse = (collapseAll: boolean) => {
    if (collapseAll) {
      const all = new Set(weeks.map((w) => w.weekNumber));
      setCollapsedWeeks(all);
      try {
        localStorage.setItem(`course_${courseId}_collapsed_weeks`, JSON.stringify(Array.from(all)));
      } catch {}
    } else {
      setCollapsedWeeks(new Set());
      try {
        localStorage.removeItem(`course_${courseId}_collapsed_weeks`);
      } catch {}
    }
  };

  const handleConfirmDetach = () => {
    if (!detachingItem) return;
    detachMutation.mutate(
      { id: detachingItem.id },
      {
        onSettled: () => setDetachingItem(null),
      },
    );
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
      <CurriculumHeader
        name={course?.name}
        level={course?.level}
        description={course?.description}
        onAttachClick={() => {
          setSelectedSessionForAttach(1);
          setIsAttachDrawerOpen(true);
        }}
      />

      {/* Metrics Banner & Cadence Control */}
      <CurriculumOverviewBanner
        effectiveTotalSessions={effectiveTotalSessions}
        plannedSessions={course?.totalSessions || 1}
        totalWeeks={totalWeeks}
        sessionsPerWeek={sessionsPerWeek}
        totalResources={resources.length}
        totalWorksheets={totalWorksheets}
        totalMinigames={totalMinigames}
        syllabusCoveragePercent={syllabusCoveragePercent}
        scheduleDays={course?.scheduleDays}
        onSessionsPerWeekChange={(val) => setCustomSessionsPerWeek(val)}
        onToggleAllCollapse={toggleAllCollapse}
        allCollapsed={weeks.length > 0 && collapsedWeeks.size === weeks.length}
      />

      {feedbackMsg && (
        <div className="p-3 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-800 animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Session List Grouped By Week (Collapsible Dropdowns) */}
      <div className="space-y-6">
        {weeks.map((week) => (
          <CurriculumWeekSection
            key={week.weekNumber}
            weekNumber={week.weekNumber}
            startSession={week.startSession}
            endSession={week.endSession}
            sessions={week.sessions}
            resourcesBySession={resourcesBySession}
            isCollapsed={collapsedWeeks.has(week.weekNumber)}
            onToggleCollapse={() => toggleWeekCollapse(week.weekNumber)}
            onAttachClick={(sNum) => {
              setSelectedSessionForAttach(sNum);
              setIsAttachDrawerOpen(true);
            }}
            onEditSettingsClick={(res) => setEditingResource(res)}
            onDetachClick={(id, title) => setDetachingItem({ id, title })}
            onMoveUp={(idx, list) => handleMove(idx, "up", list)}
            onMoveDown={(idx, list) => handleMove(idx, "down", list)}
            onPreviewClick={(item) =>
              setPreviewResource({
                id: item.resource.id,
                title: item.resource.title,
                type: item.resource.type,
                url: item.resource.url,
                description: item.resource.description,
                metadata: (item.resource.metadata as Record<string, unknown>) || null,
              })
            }
          />
        ))}

        {/* Unassigned / Global Resources Section */}
        {unassignedResources.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resurse Generale (Fără sesiune alocată)
              </h3>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
            <div className="mt-4">
              <CourseSessionCard
                sessionNumber={null}
                title="Resurse Generale / Globale"
                resources={unassignedResources}
                onAttachClick={(sNum) => {
                  setSelectedSessionForAttach(sNum);
                  setIsAttachDrawerOpen(true);
                }}
                onEditSettingsClick={(res) => setEditingResource(res)}
                onDetachClick={(id, title) => setDetachingItem({ id, title })}
                onMoveUp={(idx, list) => handleMove(idx, "up", list)}
                onMoveDown={(idx, list) => handleMove(idx, "down", list)}
                onPreviewClick={(item) =>
                  setPreviewResource({
                    id: item.resource.id,
                    title: item.resource.title,
                    type: item.resource.type,
                    url: item.resource.url,
                    description: item.resource.description,
                    metadata: (item.resource.metadata as Record<string, unknown>) || null,
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <CurriculumModals
        courseId={courseId}
        isAttachDrawerOpen={isAttachDrawerOpen}
        onCloseAttachDrawer={() => setIsAttachDrawerOpen(false)}
        selectedSessionForAttach={selectedSessionForAttach}
        totalSessions={effectiveTotalSessions}
        editingResource={editingResource}
        onCloseSettingsModal={() => setEditingResource(null)}
        detachingItem={detachingItem}
        onCloseDetachModal={() => setDetachingItem(null)}
        onConfirmDetach={handleConfirmDetach}
        isDetachPending={detachMutation.isPending}
        previewResource={previewResource}
        onClosePreviewModal={() => setPreviewResource(null)}
        onMutationSuccess={() => {
          utils.resource.getCourseResources.invalidate({ courseId });
        }}
      />
    </div>
  );
}
