"use client";

import { useState } from "react";
import { StudentTaskSubmitModal } from "./StudentTaskSubmitModal";

type Resource = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  url: string;
  metadata?: any;
};

type Props = {
  currentSession: number;
  resources: Array<{
    id: number;
    resource: Resource;
    sessionNumber: number | null;
  }>;
  existingSubmission?: {
    status: string;
    score: number | null;
    maxScore: number | null;
    teacherFeedback: string | null;
  } | null;
  onSubmitTask: (resourceId: number, notes?: string, fileUrl?: string) => Promise<void>;
  isSubmitting?: boolean;
};

function getResourceBadge(type: string) {
  switch (type.toLowerCase()) {
    case "worksheet":
    case "task":
      return {
        label: "Fișă de lucru",
        class: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      };
    case "minigame":
    case "game":
      return {
        label: "Minijoc interactiv",
        class: "bg-amber-50 text-amber-700 border-amber-200",
        iconBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      };
    case "pdf":
    case "manual":
    case "textbook":
      return {
        label: "Material / Manual",
        class: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    case "video":
      return {
        label: "Lecție Video",
        class: "bg-rose-50 text-rose-700 border-rose-200",
        iconBg: "bg-rose-50 text-rose-700 border-rose-200/80",
      };
    case "presentation":
    case "pptx":
    case "ppt":
      return {
        label: "Prezentare PPTX",
        class: "bg-amber-50 text-amber-700 border-amber-200",
        iconBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      };
    default:
      return {
        label: type,
        class: "bg-slate-100 text-slate-700 border-slate-200",
        iconBg: "bg-slate-100 text-slate-700 border-slate-200/80",
      };
  }
}

export function StudentActiveTaskCard({
  currentSession,
  resources,
  existingSubmission,
  onSubmitTask,
  isSubmitting = false,
}: Props) {
  const [activeModalResource, setActiveModalResource] = useState<Resource | null>(null);

  // Filter resources for current session or general course resources
  const sessionResources = resources.filter(
    (r) => r.sessionNumber === currentSession || r.sessionNumber === null,
  );

  if (sessionResources.length === 0) {
    return null;
  }

  // Pick the primary interactive resource (worksheet or minigame first, or first item)
  const primaryItem =
    sessionResources.find((r) => r.resource.type === "worksheet" || r.resource.type === "minigame") ||
    sessionResources[0];

  const resource = primaryItem.resource;
  const badge = getResourceBadge(resource.type);
  const isCompleted = existingSubmission?.status === "completed" || existingSubmission?.status === "reviewed";

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${badge.iconBg}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lecția curentă #{currentSession}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.class}`}>
                  {badge.label}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{resource.title}</h3>
            </div>
          </div>

          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {existingSubmission?.status === "reviewed" ? "Evaluat de profesor" : "Sarcină predată"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                În desfășurare
              </span>
            )}
          </div>
        </div>

        {resource.description && (
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            {resource.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Deschide Resursa</span>
          </a>

          <button
            type="button"
            onClick={() => setActiveModalResource(resource)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{isCompleted ? "Re-trimite Rezolvarea" : "Predă Tema / Rezolvarea"}</span>
          </button>
        </div>
      </div>

      {activeModalResource && (
        <StudentTaskSubmitModal
          isOpen={!!activeModalResource}
          onClose={() => setActiveModalResource(null)}
          resourceTitle={activeModalResource.title}
          resourceType={activeModalResource.type}
          onSubmit={async ({ notes, fileUrl }) => {
            await onSubmitTask(activeModalResource.id, notes, fileUrl);
            setActiveModalResource(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
