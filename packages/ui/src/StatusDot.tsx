export type StatusType = "active" | "warning" | "error" | "neutral";

export type StatusDotProps = {
  status: StatusType;
  label?: string;
  pill?: boolean;
  className?: string;
};

const dotColors: Record<StatusType, string> = {
  active: "bg-[#10B981]",
  warning: "bg-[#F59E0B]",
  error: "bg-[#EF4444]",
  neutral: "bg-slate-400",
};

const pillStyles: Record<StatusType, string> = {
  active: "text-emerald-700 bg-emerald-50/70 border border-emerald-200/80",
  warning: "text-amber-800 bg-amber-50/70 border border-amber-200/80",
  error: "text-rose-700 bg-rose-50/70 border border-rose-200/80",
  neutral: "text-slate-600 bg-slate-100 border border-slate-200",
};

export function StatusDot({ status, label, pill = false, className = "" }: StatusDotProps) {
  if (pill) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${pillStyles[status]} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {label && <span>{label}</span>}
    </span>
  );
}
