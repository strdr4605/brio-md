"use client";

import { ACADEMIC_LABELS } from "@brio-md/ui";

export type StudentNotesTabProps = {
  info?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
};

export function StudentNotesTab({
  info,
  parentName,
  parentPhone,
  emergencyContact,
}: StudentNotesTabProps) {
  return (
    <div className="space-y-4">
      {/* Pedagogical Observations Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {ACADEMIC_LABELS.tabs.notes} Didactice & Pedagogice
          </h3>
          <span className="text-xs text-slate-500 font-medium">Vizibilitate instructori</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/60 rounded-xl p-4 italic">
          {info || "Nu sunt menționate observații didactice speciale pentru acest elev."}
        </p>
      </div>

      {/* Emergency & Representative Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
          Contacte Urgență & Reprezentant Legal
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Reprezentant Principal
            </span>
            <p className="text-sm font-bold text-slate-900">{parentName || "Nespecificat"}</p>
            <p className="text-xs text-slate-600">{parentPhone || "Fără telefon"}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Contact Secundar / Urgență
            </span>
            <p className="text-sm font-bold text-slate-900">
              {emergencyContact || "Conform dosarului depus"}
            </p>
            <p className="text-xs text-slate-500">Apelare în caz de indisponibilitate reprezentant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
