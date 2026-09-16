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

  // Normalize phone number to standard E.164 (+373...) for tel: link
  const normalizedPhone = parentPhone ? normalizePhone(parentPhone) : "";
  const cleanPhone = normalizedPhone ? normalizedPhone.replace(/[^\d+]/g, "") : "";

  if (compact) {
    if (!hasPhone) {
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs text-slate-400 ${className}`}>
          <PhoneIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="truncate">{parentName || "Fără contact"}</span>
        </span>
      );
    }

    return (
      <a
        href={`tel:${cleanPhone}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100 hover:text-emerald-800 transition shadow-xs active:scale-95 ${className}`}
        title={`Sună părintele: ${parentName || ""} (${formattedPhone})`}
        aria-label={`Sună părintele ${parentName || ""}: ${formattedPhone}`}
      >
        <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-emerald-600 animate-pulse" />
        <span className="truncate">{parentName ? `${parentName}: ` : ""}{formattedPhone}</span>
      </a>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 ${className}`}>
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
          {parentName || "Părinte nespecificat"}
        </span>
        <span className="text-[11px] text-slate-500 font-mono tracking-tight">
          {formattedPhone}
        </span>
      </div>

      {hasPhone ? (
        <a
          href={`tel:${cleanPhone}`}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-600/20 transition shrink-0"
          title={`Sună acum: ${formattedPhone}`}
          aria-label={`Sună părintele: ${formattedPhone}`}
        >
          <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Sună</span>
        </a>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 shrink-0"
          title="Nu există număr de telefon"
        >
          Lipsă număr
        </span>
      )}
    </div>
  );
}
