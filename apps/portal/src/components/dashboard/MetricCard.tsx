import Link from "next/link";
import React from "react";

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
};

export function MetricCard({ title, value, icon, footer, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-[8px] p-5 border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:border-slate-300 transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <div className="w-10 h-10 rounded-[6px] bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums mt-2">
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
