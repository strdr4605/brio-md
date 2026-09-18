"use client";

import { PhoneIcon } from "@/components/ui/icons";
import { formatPhone, normalizePhone } from "@/lib/phone";

export type ParentCallWidgetProps = {
  parentName?: string | null;
  parentPhone?: string | null;
  className?: string;
  compact?: boolean;
};

/**
 * Instant One-Click Parent Contact Widget
 * Displays parent name and a clickable 'tel:' link for mobile dialing.
 */
export function ParentCallWidget({
  parentName,
  parentPhone,
  className = "",
  compact = false,
}: ParentCallWidgetProps) {
  const hasPhone = Boolean(parentPhone && parentPhone.trim());
  const formattedPhone = hasPhone ? formatPhone(parentPhone) : "Fără telefon";

  // Normalize phone number to international E.164 format (e.g. 068123456 -> +37368123456) for tel: link
  const normalized = parentPhone ? normalizePhone(parentPhone) : "";
  const cleanPhone = normalized
    ? normalized.replace(/[^\d+]/g, "")
    : parentPhone
      ? parentPhone.replace(/[^\d+]/g, "")
      : "";

  if (compact) {
    if (!hasPhone) {
      return (
        <span className={`inline-flex items-center gap-1 text-[11px] text-slate-400 ${className}`}>
          <PhoneIcon className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="truncate">{parentName || "Fără contact"}</span>
        </span>
      );
    }

    return (
      <a
        href={`tel:${cleanPhone}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100 hover:text-emerald-800 transition active:scale-95 ${className}`}
        title={`Sună părintele: ${parentName || ""} (${formattedPhone})`}
        aria-label={`Sună părintele ${parentName || ""}: ${formattedPhone}`}
      >
        <PhoneIcon className="w-3 h-3 shrink-0 text-emerald-600" />
        <span className="truncate">{parentName ? `${parentName}: ` : ""}{formattedPhone}</span>
      </a>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${className}`}>
      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
          {parentName || "Părinte nespecificat"}
        </span>
        <span className="text-xs text-slate-500 font-mono tracking-tight mt-0.5">
          {formattedPhone}
        </span>
      </div>

      {hasPhone ? (
        <a
          href={`tel:${cleanPhone}`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-600/20 transition shrink-0"
          title={`Sună acum: ${formattedPhone}`}
          aria-label={`Sună părintele: ${formattedPhone}`}
        >
          <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Sună Părinte</span>
        </a>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-400 bg-slate-100 shrink-0"
          title="Nu există număr de telefon"
        >
          Lipsă număr
        </span>
      )}
    </div>
  );
}
