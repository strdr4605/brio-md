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
      return { label: "Fișă de lucru", class: "bg-slate-100 text-slate-700 border-slate-200" };
    case "minigame":
      return { label: "Minijoc interactiv", class: "bg-slate-100 text-slate-700 border-slate-200" };
    case "pdf":
    case "manual":
      return { label: "Material / Manual", class: "bg-slate-100 text-slate-700 border-slate-200" };
    default:
      return { label: type, class: "bg-slate-100 text-slate-700 border-slate-200" };
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
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
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Lecția curentă #{currentSession}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.class}`}>
                  {badge.label}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{resource.title}</h3>
            </div>
          </div>

          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {existingSubmission?.status === "reviewed" ? "Evaluat de profesor" : "Sarcină predată"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
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
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Deschide materialul interactiv
          </a>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <button
                type="button"
                onClick={() => setActiveModalResource(resource)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Predă sarcina
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModalResource(resource)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                Actualizează predarea
              </button>
            )}
          </div>
        </div>
      </div>

      {activeModalResource && (
        <StudentTaskSubmitModal
          isOpen={true}
          onClose={() => setActiveModalResource(null)}
          resourceTitle={activeModalResource.title}
          resourceType={activeModalResource.type}
          isSubmitting={isSubmitting}
          onSubmit={async ({ notes, fileUrl }) => {
            await onSubmitTask(activeModalResource.id, notes, fileUrl);
          }}
        />
      )}
    </>
  );
}
