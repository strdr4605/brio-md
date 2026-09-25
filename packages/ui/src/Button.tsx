import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "warning" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#020617] text-white border border-[#0F172A]",
  secondary: "bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] hover:border-slate-300",
  warning: "bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white border border-[#D97706]",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2.5 py-1 text-xs font-medium",
  md: "px-3 py-1.5 text-xs font-medium",
  lg: "px-4 py-2 text-sm font-medium",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
