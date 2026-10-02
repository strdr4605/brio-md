import { type HTMLAttributes } from "react";

export type StatusDotStatus = "active" | "inactive" | "pending" | "warning" | "danger" | "neutral" | string;

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  status: StatusDotStatus;
  label?: string;
  pill?: boolean;
  className?: string;
};

const STATUS_THEMES: Record<
  string,
  {
    dot: string;
    pill: string;
  }
> = {
  active: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  inactive: {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 border-slate-200/80",
  },
  pending: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  warning: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  danger: {
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  neutral: {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 border-slate-200/80",
  },
};

export function StatusDot({
  status,
  label,
  pill = false,
  className = "",
  ...props
}: StatusDotProps) {
  const theme = STATUS_THEMES[status] || STATUS_THEMES.neutral;

  if (pill) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.pill} ${className}`}
        {...props}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} aria-hidden="true" />
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-700 ${className}`} {...props}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} aria-hidden="true" />
      {label && <span className="font-medium">{label}</span>}
    </span>
  );
}

