import { type ReactNode, type HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs transition hover:border-slate-300/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function CardHeader({
  title,
  description,
  action,
  children,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

