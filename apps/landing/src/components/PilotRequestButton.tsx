"use client";

import { useState } from "react";
import { PilotRequestModal } from "./PilotRequestModal";

export type PilotRequestButtonProps = {
  className?: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
};

export function PilotRequestButton({
  className = "",
  variant = "primary",
  children,
}: PilotRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const baseStyle =
    variant === "primary"
      ? "inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all duration-150 shadow-xs cursor-pointer"
      : "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-150 cursor-pointer shadow-xs";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseStyle} ${className}`}
      >
        {children || "Solicită Acces Pilot"}
      </button>

      <PilotRequestModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

