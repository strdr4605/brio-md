"use client";

import { ACADEMIC_LABELS } from "@brio-md/ui";
import { formatPhone } from "@/lib/phone";
import { PhoneIcon, SchoolIcon } from "@/components/ui/icons";

export type StudentDossierSidebarProps = {
  student: {
    id: number;
    name: string;
    active: boolean | null;
    phone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    age?: number | null;
    schoolName?: string | null;
    info?: string | null;
    createdAt?: string | Date | null;
  };
  balanceSummary?: {
    currentDebt: number;
    overdueCount: number;
  } | null;
  createdDateFormatted: string;
  onOpenBillingTab: () => void;
};

export function StudentDossierSidebar({
  student,
  balanceSummary,
  createdDateFormatted,
  onOpenBillingTab,
}: StudentDossierSidebarProps) {
  const initials = student.name
    ? student.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("")
    : "S";

  const rawPhone = student.parentPhone || student.phone || "";
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const waNumber = digitsOnly.startsWith("0")
    ? `373${digitsOnly.slice(1)}`
    : digitsOnly.startsWith("373")
    ? digitsOnly
    : `373${digitsOnly}`;

  const currentDebt = balanceSummary?.currentDebt ?? 0;
  const isOverdue = (balanceSummary?.overdueCount ?? 0) > 0;
  const contractNumber = `CTR-2024-${student.id.toString().padStart(3, "0")}`;

  return (
    <aside className="col-span-12 lg:col-span-4 space-y-4">
      {/* 1. Core Student Identity Dossier */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 font-bold text-lg flex items-center justify-center border border-slate-200 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate">{student.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.age ? `${student.age} ani` : "Vârstă Nespecificată"}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <SchoolIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{student.schoolName || "Campus Principal"}</span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
              student.active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {student.active ? "Activ" : "Inactiv"}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium">Număr Contract</span>
            <span className="font-mono font-semibold text-slate-900">{contractNumber}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium">Înscris la</span>
            <span className="font-semibold text-slate-900">{createdDateFormatted}</span>
          </div>
        </div>

        {/* Legal Representative Details */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            {ACADEMIC_LABELS.profile.parentSection}
          </span>
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {student.parentName || "Reprezentant Nespecificat"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                Contact Primar
              </span>
            </div>
            {student.parentPhone ? (
              <p className="text-xs font-semibold text-slate-700 font-mono">
                {formatPhone(student.parentPhone)}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">Fără număr înregistrat</p>
            )}
          </div>

          {/* Quick Action Buttons (44px touch height) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={rawPhone ? `tel:${rawPhone}` : undefined}
              className={`min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-xs ${
                !rawPhone ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <PhoneIcon className="w-4 h-4 text-slate-700" />
              <span>{ACADEMIC_LABELS.profile.callAction}</span>
            </a>
            <a
              href={rawPhone ? `https://wa.me/${waNumber}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-xs ${
                !rawPhone ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <span className="text-emerald-600 font-bold text-sm">💬</span>
              <span>{ACADEMIC_LABELS.profile.whatsAppAction}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Financial Summary Card */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {ACADEMIC_LABELS.profile.balanceSection}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              currentDebt > 0
                ? isOverdue
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentDebt > 0
                  ? isOverdue
                    ? "bg-rose-500 animate-pulse"
                    : "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span>{currentDebt > 0 ? (isOverdue ? "Restanță" : "De plată") : "La zi"}</span>
          </span>
        </div>

        <div className="pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 tracking-tight">
              {currentDebt > 0 ? `${currentDebt} MDL` : ACADEMIC_LABELS.profile.zeroDebt}
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 ${
              currentDebt > 0 ? "text-rose-600 font-medium" : "text-emerald-700"
            }`}
          >
            {currentDebt > 0
              ? `${currentDebt} MDL datorie activă`
              : ACADEMIC_LABELS.profile.paidCurrentMonth}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onOpenBillingTab}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition inline-flex items-center gap-1"
          >
            <span>Vezi istoricul plăților & facturi</span>
            <span>→</span>
          </button>
        </div>
      </section>
    </aside>
  );
}
