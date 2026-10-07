"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MinigameActivityCard } from "./MinigameActivityCard";
import { ResourcePreviewModal } from "@/app/teacher/resources/ResourcePreviewModal";

type MaterialItem = {
  id: number;
  title: string;
  type: string;
  url: string;
};

type Props = {
  courseId: number;
  materials: MaterialItem[];
  notes?: string | null;
};

type PreviewTarget = {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getMaterialTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case "video":
      return { label: "Lecție Video", className: "bg-blue-50 text-blue-700 border-blue-200" };
    case "pdf":
      return { label: "Document PDF", className: "bg-rose-50 text-rose-700 border-rose-200" };
    case "worksheet":
      return { label: "Fișă de Lucru", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "textbook":
      return { label: "Manual Școlar", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "manual":
      return { label: "Ghid / Suport", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "link":
      return { label: "Link Web", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "file":
      return { label: "Document", className: "bg-purple-50 text-purple-700 border-purple-200" };
    default:
      return { label: type, className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export function CourseResourcesSection({ courseId, materials, notes }: Props) {
  const [previewItem, setPreviewItem] = useState<PreviewTarget | null>(null);

  const { data: courseResources = [] } = trpc.resource.getCourseResources.useQuery({
    courseId,
  });

  const { data: mySubmissions = [] } = trpc.lesson.getMyCourseSubmissions.useQuery({
    courseId,
  });

  const submissionsByResource = new Map(
    mySubmissions.map((s) => [s.resourceId, s]),
  );

  const minigames = courseResources.filter((cr) => cr.resource.type === "minigame");
  const learningItems = courseResources.filter((cr) => cr.resource.type !== "minigame");

  return (
    <div className="space-y-6">
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
              const badge = getMaterialTypeBadge(res.type);
              const isVideo = res.type === "video";

              return (
                <div
                  key={cr.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition bg-white gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {cr.sessionNumber && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Sesiunea {cr.sessionNumber}
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
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shrink-0 cursor-pointer"
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
              );
            })}
          </div>
        </div>
      )}

      {/* Course Materials Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Materiale de Curs</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {materials.length} disponibile
          </span>
        </div>

        {materials.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs sm:text-sm text-slate-500">
              Nu există materiale adiționale atașate acestui curs.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {materials.map((material) => {
              const badge = getMaterialTypeBadge(material.type);
              return (
                <a
                  key={material.id}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition bg-white"
                >
                  <div className="space-y-1 pr-3 min-w-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
                      {badge.label}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {material.title}
                    </h3>
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-600 transition shrink-0">
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

      {/* Embedded Preview Modal */}
      <ResourcePreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        resource={previewItem}
      />
    </div>
  );
}
