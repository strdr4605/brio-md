"use client";

import Link from "next/link";
import { ACADEMIC_LABELS } from "@brio-md/ui";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";

export type StudentProfileBreadcrumbProps = {
  onOpenEnroll: () => void;
  onOpenEdit: () => void;
};

export function StudentProfileBreadcrumb({
  onOpenEnroll,
  onOpenEdit,
}: StudentProfileBreadcrumbProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition truncate"
      >
        <ChevronLeftIcon className="w-4 h-4 shrink-0" />
        <span className="truncate">Înapoi la Catalog Studenți</span>
      </Link>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={onOpenEnroll}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition hover:border-slate-300"
        >
          <PlusIcon className="w-3.5 h-3.5 text-slate-700" />
          <span>Înrolare în Grupă</span>
        </button>
        <button
          type="button"
          onClick={onOpenEdit}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
        >
          <span>{ACADEMIC_LABELS.profile.editDossier}</span>
        </button>
      </div>
    </div>
  );
}
