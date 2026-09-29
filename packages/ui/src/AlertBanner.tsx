import type { ReactNode } from "react";

export type AlertBannerProps = {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AlertBanner({ children, action, className = "" }: AlertBannerProps) {
  return (
    <div
      className={`bg-[#FFFBEB] border border-[#FEF08A] rounded-[8px] p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 animate-pulse" />
        <div className="text-xs sm:text-sm text-[#78350F] font-medium leading-relaxed">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
