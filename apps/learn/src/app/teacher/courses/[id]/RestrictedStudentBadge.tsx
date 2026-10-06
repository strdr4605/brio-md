"use client";

import { useState } from "react";

type Props = {
  isRestricted?: boolean;
  restrictionReason?: string | null;
  studentName?: string;
};

export function RestrictedStudentBadge({
  isRestricted,
  restrictionReason,
  studentName = "Elev",
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isRestricted) return null;

  const reasonText = restrictionReason || "Restanță financiară";

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition shadow-2xs cursor-pointer select-none"
        title={`Restricție: ${reasonText}`}
      >
        <svg className="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Restanță / Interzis</span>
      </button>

      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-bold text-rose-300">
            <span>Atenție: Elev Restricționat</span>
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-slate-300">
            Elevul <strong className="text-white">{studentName}</strong> are accesul restricționat.
          </p>
          <div className="bg-slate-800/90 px-2 py-1.5 rounded-lg text-amber-300 font-medium">
            Cauză: {reasonText}
          </div>
          <p className="text-[10px] text-slate-400">
            Verifică situația facturilor restante în portalul de facturare.
          </p>
        </div>
      )}
    </div>
  );
}
