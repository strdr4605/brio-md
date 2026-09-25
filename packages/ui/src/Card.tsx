import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-[8px] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`px-5 py-3 border-t border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 ${className}`} {...props}>
      {children}
    </div>
  );
}
