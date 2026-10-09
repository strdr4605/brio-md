"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MinigameActivityCard } from "./MinigameActivityCard";
import { ResourcePreviewModal } from "@/app/teacher/resources/ResourcePreviewModal";
import {
  CourseMaterialsList,
  getMaterialTypeBadge,
  type MaterialItem,
} from "./CourseMaterialsList";

type Props = {
  courseId: number;
  materials: MaterialItem[];
  notes?: string | null;
  selectedSessionNumber?: number | null;
  onSelectSession?: (session: number | null) => void;
  totalSessions?: number;
};

type PreviewTarget = {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function CourseResourcesSection({
  courseId,
  materials,
  notes,
  selectedSessionNumber = null,
  onSelectSession,
  totalSessions = 1,
}: Props) {
  const [previewItem, setPreviewItem] = useState<PreviewTarget | null>(null);

  const utils = trpc.useUtils();

  const { data: courseResources = [] } = trpc.resource.getCourseResources.useQuery({
    courseId,
  });

  const { data: mySubmissions = [] } = trpc.lesson.getMyCourseSubmissions.useQuery({
    courseId,
  });

  const recordMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getMyCourseSubmissions.invalidate({ courseId });
      utils.course.getById.invalidate({ id: courseId });
    },
  });

  const submissionsByResource = new Map(
    mySubmissions.map((s) => [s.resourceId, s]),
  );

  const allFilteredResources = selectedSessionNumber
    ? courseResources.filter((cr) => cr.sessionNumber === selectedSessionNumber)
    : courseResources;

  const minigames = allFilteredResources.filter((cr) => cr.resource.type === "minigame");
  const learningItems = allFilteredResources.filter((cr) => cr.resource.type !== "minigame");

  return (
    <div className="space-y-6">
      {/* Session Filter Bar */}
      {totalSessions > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider">Filtrează după sesiune</span>
            <span className="text-slate-500 font-medium">
              {selectedSessionNumber ? `Sesiunea ${selectedSessionNumber}` : "Toate sesiunile"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => onSelectSession?.(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedSessionNumber === null
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              Toate
            </button>
            {Array.from({ length: totalSessions }, (_, i) => i + 1).map((sNum) => (
              <button
                key={sNum}
                type="button"
                onClick={() => onSelectSession?.(sNum)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedSessionNumber === sNum
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                Sesiunea {sNum}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for selected session */}
      {selectedSessionNumber && minigames.length === 0 && learningItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-500">
            Nu există resurse atașate pentru Sesiunea {selectedSessionNumber}.
          </p>
          <button
            type="button"
            onClick={() => onSelectSession?.(null)}
            className="text-xs font-semibold text-slate-900 hover:underline cursor-pointer"
          >
            Vezi toate resursele cursului →
          </button>
        </div>
      )}

      {/* Minigames Section */}
      {minigames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🎮</span>
              <span>Minijocuri & Activități Interactive</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {minigames.length} {minigames.length === 1 ? "activitate" : "activități"}
            </span>
          </div>

          <div className="space-y-3">
            {minigames.map((cr) => {
              const res = cr.resource;
              const sub = submissionsByResource.get(res.id);
              const meta = (res.metadata || {}) as Record<string, unknown>;
              const instructions = typeof meta.instructions === "string" ? meta.instructions : null;
              const maxScore = typeof meta.maxScore === "number" ? meta.maxScore : null;

              return (
                <MinigameActivityCard
                  key={cr.id}
                  courseId={courseId}
                  resourceId={res.id}
                  title={res.title}
                  url={res.url}
                  sessionNumber={cr.sessionNumber}
                  instructions={instructions}
                  maxScore={maxScore}
                  submissionStatus={sub?.status as any}
                  submissionScore={sub?.score}
                  onPreview={() =>
                    setPreviewItem({
                      id: res.id,
                      title: res.title,
                      type: res.type,
                      url: res.url,
                      description: res.description,
                      metadata: meta,
                    })
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Learning Resources & Video Lessons Section */}
      {learningItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📚</span>
              <span>Lecții Video & Materiale Didactice</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {learningItems.length} {learningItems.length === 1 ? "resursă" : "resurse"}
            </span>
          </div>

          <div className="space-y-2.5">
            {learningItems.map((cr) => {
              const res = cr.resource;
              const sub = submissionsByResource.get(res.id);
              const isCompleted = sub?.status === "completed" || sub?.status === "reviewed";
              const badge = getMaterialTypeBadge(res.type);
              const isVideo = res.type === "video";

              return (
                <div
                  key={cr.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition bg-white gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {cr.sessionNumber && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Sesiunea {cr.sessionNumber}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Finalizat
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {res.title}
                    </h3>
                    {res.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{res.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={recordMutation.isPending}
                      onClick={() =>
                        recordMutation.mutate({
                          courseId,
                          resourceId: res.id,
                          status: isCompleted ? "assigned" : "completed",
                        })
                      }
                      className={`p-1.5 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1 ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                      title={isCompleted ? "Marchează ca nefinalizat" : "Marchează ca finalizat"}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewItem({
                          id: res.id,
                          title: res.title,
                          type: res.type,
                          url: res.url,
                          description: res.description,
                          metadata: (res.metadata || {}) as Record<string, unknown>,
                        })
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shrink-0 cursor-pointer shadow-2xs"
                    >
                      {isVideo ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Vizionează</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Deschide</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course Materials Card */}
      <CourseMaterialsList materials={materials} />

      {/* Teacher Feedback / Progress Notes Card if available */}
      {notes && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Feedback și Observații Profesor
          </div>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Embedded Preview Modal with Completion Prompt */}
      <ResourcePreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        resource={previewItem}
        completionState={
          previewItem
            ? {
                isCompleted:
                  submissionsByResource.get(previewItem.id)?.status === "completed" ||
                  submissionsByResource.get(previewItem.id)?.status === "reviewed",
                onToggleComplete: async () => {
                  const currentlyCompleted =
                    submissionsByResource.get(previewItem.id)?.status === "completed" ||
                    submissionsByResource.get(previewItem.id)?.status === "reviewed";
                  await recordMutation.mutateAsync({
                    courseId,
                    resourceId: previewItem.id,
                    status: currentlyCompleted ? "assigned" : "completed",
                  });
                },
                isUpdating: recordMutation.isPending,
              }
            : undefined
        }
        promptOnClose={true}
      />
    </div>
  );
}
