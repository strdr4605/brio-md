"use client";

export type AttendanceStatus = "present" | "late" | "absent" | "excused" | null;

type Props = {
  currentStatus: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
  hasComment?: boolean;
};

export function AttendanceStatusPills({
  currentStatus,
  onStatusChange,
  disabled = false,
  hasComment = false,
}: Props) {
  const handlePillClick = (status: "present" | "late" | "absent") => {
    if (disabled) return;
    // Toggle: if already selected, clear it
    if (currentStatus === status) {
      onStatusChange(null);
    } else {
      onStatusChange(status);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* ✓ PRESENT */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handlePillClick("present")}
        className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer select-none flex items-center gap-1.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:outline-none ${
          currentStatus === "present"
            ? "bg-[#15803d] text-white border border-[#15803d]"
            : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Marchează Prezent (PRESENT)"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span>PRESENT</span>
      </button>

      {/* ✕ ABSENT */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handlePillClick("absent")}
        className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer select-none flex items-center gap-1.5 relative shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-1 focus:outline-none ${
          currentStatus === "absent"
            ? "bg-[#e11d48] text-white border border-[#e11d48]"
            : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Marchează Absent (ABSENT)"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>ABSENT</span>
        {hasComment && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-white ring-2 ring-rose-600"
            title="Are motiv atașat"
          />
        )}
      </button>

      {/* ⏱ LATE */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handlePillClick("late")}
        className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer select-none flex items-center gap-1.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1 focus:outline-none ${
          currentStatus === "late"
            ? "bg-[#d97706] text-white border border-[#d97706]"
            : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Marchează Întârziat (LATE) - contează ca prezent"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>LATE</span>
      </button>
    </div>
  );
}
