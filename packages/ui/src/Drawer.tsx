"use client";

import { useEffect, useState, useRef, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Shared reference-counted scroll manager preventing multi-modal lock collisions
let scrollLockCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

function lockScroll() {
  if (typeof document === "undefined" || !document.body) return () => {};
  if (scrollLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  scrollLockCount++;
  return () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
    }
  };
}

export type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  widthClassName?: string;
  bodyClassName?: string;
  ariaLabel?: string;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
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
  bodyClassName = "p-5 sm:p-6",
  ariaLabel,
  closeOnEsc = true,
  closeOnBackdropClick = true,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const titleId = useId();
  const descId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 2-phase mount and unmount animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll lock & Focus restoration
  useEffect(() => {
    if (!shouldRender) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();

    const focusTimer = setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable && focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        panelRef.current?.focus();
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      unlock();
      previousFocusRef.current?.focus();
    };
  }, [shouldRender]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === "Escape") {
        if (event.defaultPrevented) return;
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc]);

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop with smooth opacity fade */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Slide-over panel with native CSS translation */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? ariaLabel || "Panou lateral" : undefined}
        tabIndex={-1}
        className={`relative z-10 flex h-full flex-col bg-white border-l border-slate-200 shadow-2xl overflow-hidden transition-transform duration-200 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        } ${widthClassName} ${className}`}
      >
        {(title || description) && (
          <DrawerHeader
            title={title}
            description={description}
            onClose={onClose}
            titleId={titleId}
            descId={descId}
          />
        )}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
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
  titleId?: string;
  descId?: string;
};

export function DrawerHeader({
  title,
  description,
  onClose,
  children,
  className = "",
  titleId,
  descId,
}: DrawerHeaderProps) {
  return (
    <div
      className={`px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white ${className}`}
    >
      {children ? (
        children
      ) : (
        <div className="min-w-0 flex-1">
          {title && (
            <h2 id={titleId} className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {title}
            </h2>
          )}
          {description && (
            <p id={descId} className="text-xs text-slate-500 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] -mr-2 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DrawerFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-end gap-3 shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
