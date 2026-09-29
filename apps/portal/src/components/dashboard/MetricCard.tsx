import Link from "next/link";
import React from "react";

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
}

export function MetricCard({ title, value, icon, footer, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-slate-800">{title}</span>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7">
            {icon}
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
          {value}
        </div>
      </div>
      {footer && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
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
