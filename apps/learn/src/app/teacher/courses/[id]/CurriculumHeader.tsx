"use client";

import Link from "next/link";

type CurriculumHeaderProps = {
  name?: string;
  level?: string | null;
  description?: string | null;
  onAttachClick: () => void;
}

export function CurriculumHeader({
  name,
  level,
  description,
  onAttachClick,
}: CurriculumHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            {name || "Plan de Învățământ & Resurse"}
          </h1>
          {level && (
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700">
              {level}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          {description ||
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
          onClick={onAttachClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
        >
          <span>+</span>
          <span>Atașează Resursă</span>
        </button>
      </div>
    </div>
  );
}
