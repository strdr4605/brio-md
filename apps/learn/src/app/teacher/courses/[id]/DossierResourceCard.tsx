"use client";

import { getMaterialTypeBadge } from "@/app/courses/[id]/CourseMaterialsList";

type Props = {
  title: string;
  type: string;
  description?: string | null;
  isCompleted: boolean;
  score?: number | null;
  isUpdating: boolean;
  onPreview: () => void;
  onToggleComplete: () => void;
};

export function DossierResourceCard({
  title,
  type,
  description,
  isCompleted,
  score,
  isUpdating,
  onPreview,
  onToggleComplete,
}: Props) {
  const badge = getMaterialTypeBadge(type);

  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
            {badge.label}
          </span>
          {isCompleted ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Promovat
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Nepromovat
            </span>
          )}
          {score !== null && score !== undefined && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Scor: {score}
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 truncate">{title}</h4>
        {description && (
          <p className="text-xs text-slate-500 line-clamp-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
        >
          Deschide
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={onToggleComplete}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
            isCompleted
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{isCompleted ? "Anulează" : "Marchează Promovat"}</span>
        </button>
      </div>
    </div>
  );
}
