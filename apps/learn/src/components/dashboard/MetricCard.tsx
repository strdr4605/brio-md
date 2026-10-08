import Link from "next/link";
import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  footer?: ReactNode;
  href?: string;
};

export function MetricCard({ title, value, icon, footer, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 [&>svg]:w-6 [&>svg]:h-6">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums mt-2">
          {value}
        </div>
      </div>
      {footer && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
