import type { ReactNode } from "react";

export type StatCardProps = {
  title: string;
  value: string | number;
  deltaBadge?: ReactNode;
  detail?: ReactNode;
  sparkline?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function StatCard({
  title,
  value,
  deltaBadge,
  detail,
  sparkline,
  footer,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-slate-300 transition-colors ${className}`}
    >
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500 font-medium">{title}</span>
          {deltaBadge && <div className="text-xs">{deltaBadge}</div>}
        </div>
        <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums my-1">
          {value}
        </div>
        {detail && <div className="text-xs text-slate-600 mt-1 mb-2">{detail}</div>}
        {sparkline && <div className="py-1">{sparkline}</div>}
      </div>
      {footer && <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">{footer}</div>}
    </div>
  );
}
