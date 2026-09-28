"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  widthClassName?: string;
  ariaLabel?: string;
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className = "",
  widthClassName = "w-full sm:max-w-xl",
  ariaLabel,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={ariaLabel || title || "Drawer"}>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex h-full flex-col bg-white border-l border-[#E2E8F0] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200 ${widthClassName} ${className}`}
      >
        {(title || description) && (
          <DrawerHeader title={title} description={description} onClose={onClose} />
        )}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </div>
    </div>,
    document.body,
  );
}

export type DrawerHeaderProps = {
  title?: string;
  description?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
};

export function DrawerHeader({
  title,
  description,
  onClose,
  children,
  className = "",
}: DrawerHeaderProps) {
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0 bg-white ${className}`}>
      {children ? (
        children
      ) : (
        <div className="min-w-0 flex-1">
          {title && <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{title}</h2>}
          {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
        </div>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] -mr-2 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DrawerFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sticky bottom-0 bg-white border-t border-[#E2E8F0] px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-end gap-3 shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
