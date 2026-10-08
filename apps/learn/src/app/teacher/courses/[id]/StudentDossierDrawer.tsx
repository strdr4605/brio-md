"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { ResourcePreviewModal } from "@/app/teacher/resources/ResourcePreviewModal";
import { DossierSessionSidebar } from "./DossierSessionSidebar";
import { DossierHeader } from "./DossierHeader";
import { DossierResourceCard } from "./DossierResourceCard";

export type DossierStudentItem = {
  id: number;
  name: string;
  status: string;
  currentSession: number;
  completedSessions: number;
  progressPercentage: number;
  notes: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  totalSessions: number;
  students: DossierStudentItem[];
  selectedStudentId: number | null;
  onSelectStudentId: (id: number | null) => void;
};

type PreviewItem = {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function StudentDossierDrawer({
  isOpen,
  onClose,
  courseId,
  totalSessions,
  students,
  selectedStudentId,
  onSelectStudentId,
}: Props) {
  const currentIndex = useMemo(() => {
    return students.findIndex((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const currentStudent = currentIndex !== -1 ? students[currentIndex] : null;

  const [activeSession, setActiveSession] = useState<number>(1);
  const [previewResource, setPreviewResource] = useState<PreviewItem | null>(null);
  const [localNotes, setLocalNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (currentStudent) {
      setActiveSession(currentStudent.currentSession || 1);
      setLocalNotes(currentStudent.notes || "");
    }
  }, [currentStudent?.id]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectStudentId(students[currentIndex - 1].id);
    }
  }, [currentIndex, students, onSelectStudentId]);

  const handleNext = useCallback(() => {
    if (currentIndex < students.length - 1) {
      onSelectStudentId(students[currentIndex + 1].id);
    }
  }, [currentIndex, students, onSelectStudentId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const inInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName);
      if (e.key === "ArrowLeft" && !inInput) handlePrev();
      if (e.key === "ArrowRight" && !inInput) handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  const { data: allCourseResources = [], isLoading: isLoadingResources } =
    trpc.resource.getCourseResources.useQuery({ courseId }, { enabled: isOpen });

  const { data: studentSubmissions = [], isLoading: isLoadingSubmissions } =
    trpc.lesson.getLessonSubmissions.useQuery(
      { courseId, studentId: selectedStudentId ?? undefined },
      { enabled: isOpen && Boolean(selectedStudentId) },
    );

  const recordMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      if (selectedStudentId) {
        utils.lesson.getLessonSubmissions.invalidate({ courseId, studentId: selectedStudentId });
      }
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  const updateProgressMutation = trpc.teacher.updateStudentProgress.useMutation({
    onSuccess: () => {
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  if (!isOpen || !currentStudent) return null;

  const submissionsByResource = new Map(
    studentSubmissions.map((s) => [s.resourceId, s]),
  );

  const sessionStatsMap = new Map<number, { total: number; completed: number }>();
  for (let s = 1; s <= totalSessions; s++) {
    const resForS = allCourseResources.filter((r) => r.sessionNumber === s);
    const completedCount = resForS.filter(
      (r) => submissionsByResource.get(r.resource.id)?.status === "completed",
    ).length;
    sessionStatsMap.set(s, { total: resForS.length, completed: completedCount });
  }

  const sessionResources = allCourseResources.filter(
    (cr) => cr.sessionNumber === activeSession,
  );

  const sessionCompletedCount = sessionResources.filter(
    (cr) => submissionsByResource.get(cr.resource.id)?.status === "completed",
  ).length;

  const handleToggleComplete = async (resourceId: number) => {
    if (!selectedStudentId) return;
    const sub = submissionsByResource.get(resourceId);
    const currentlyCompleted = sub?.status === "completed" || sub?.status === "reviewed";

    await recordMutation.mutateAsync({
      courseId,
      studentId: selectedStudentId,
      resourceId,
      status: currentlyCompleted ? "assigned" : "completed",
    });
  };

  const handleSaveNotes = async () => {
    if (!selectedStudentId) return;
    setIsSavingNotes(true);
    try {
      await updateProgressMutation.mutateAsync({
        courseId,
        studentId: selectedStudentId,
        notes: localNotes.trim() || null,
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAdvanceToActiveSession = () => {
    if (!selectedStudentId) return;
    updateProgressMutation.mutate({
      courseId,
      studentId: selectedStudentId,
      currentSession: activeSession,
      completedSessions: Math.max(currentStudent.completedSessions, activeSession - 1),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-in slide-in-from-right duration-200">
        {/* Modular Header with Sequential Navigation */}
        <DossierHeader
          studentName={currentStudent.name}
          studentStatus={currentStudent.status}
          currentSession={currentStudent.currentSession}
          totalSessions={totalSessions}
          progressPercentage={currentStudent.progressPercentage}
          currentIndex={currentIndex}
          totalStudents={students.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={onClose}
        />

        {/* Master-Detail Split Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left: Vertical Sessions Sidebar */}
          <DossierSessionSidebar
            totalSessions={totalSessions}
            activeSession={activeSession}
            onSelectSession={setActiveSession}
            sessionStatsMap={sessionStatsMap}
          />

          {/* Right: Selected Session Resources & Actions */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Session Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📖</span>
                    <span>Sesiunea {activeSession}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resurse didactice atașate și evaluarea sarcinilor
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {sessionCompletedCount} din {sessionResources.length} promovate
                  </span>

                  {currentStudent.currentSession !== activeSession && (
                    <button
                      type="button"
                      onClick={handleAdvanceToActiveSession}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Setează ca sesiune curentă
                    </button>
                  )}
                </div>
              </div>

              {/* Resources List */}
              {isLoadingResources || isLoadingSubmissions ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 bg-slate-100 rounded-xl" />
                  <div className="h-20 bg-slate-100 rounded-xl" />
                </div>
              ) : sessionResources.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-700">
                    Nicio resursă atașată pentru Sesiunea {activeSession}
                  </p>
                  <p className="text-xs text-slate-400">
                    Puteți atașa materiale din secțiunea Plan Curs & Resurse.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionResources.map((cr) => {
                    const res = cr.resource;
                    const sub = submissionsByResource.get(res.id);
                    const isCompleted = sub?.status === "completed" || sub?.status === "reviewed";

                    return (
                      <DossierResourceCard
                        key={cr.id}
                        title={res.title}
                        type={res.type}
                        description={res.description}
                        isCompleted={isCompleted}
                        score={sub?.score}
                        isUpdating={recordMutation.isPending}
                        onPreview={() =>
                          setPreviewResource({
                            id: res.id,
                            title: res.title,
                            type: res.type,
                            url: res.url,
                            description: res.description,
                            metadata: (res.metadata || {}) as Record<string, unknown>,
                          })
                        }
                        onToggleComplete={() => handleToggleComplete(res.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Teacher Notes inside Drawer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label htmlFor="student-notes" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>💬</span>
                <span>Note & Observații Profesor</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="student-notes"
                  type="text"
                  placeholder="Scrie o notă rapidă despre progresul elevului..."
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-slate-400"
                />
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSavingNotes ? "..." : "Salvează"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Preview Modal with Completion Hook */}
      <ResourcePreviewModal
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
        completionState={
          previewResource
            ? {
                isCompleted:
                  submissionsByResource.get(previewResource.id)?.status === "completed" ||
                  submissionsByResource.get(previewResource.id)?.status === "reviewed",
                studentName: currentStudent.name,
                onToggleComplete: () => handleToggleComplete(previewResource.id),
                isUpdating: recordMutation.isPending,
              }
            : undefined
        }
        promptOnClose={true}
      />
    </div>
  );
}
