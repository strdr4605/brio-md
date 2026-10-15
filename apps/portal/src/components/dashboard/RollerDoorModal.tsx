"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import {
  DoorIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
} from "@/components/ui/icons";

export type RollerDoorModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function RollerDoorModal({ isOpen, onClose }: RollerDoorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const toggleMutation = trpc.door.toggle.useMutation({
    onSuccess: (_, variables) => {
      setFeedback({
        type: "success",
        message:
          variables.action === "open"
            ? "Comanda de deschidere a fost transmisă cu succes."
            : "Comanda de închidere a fost transmisă cu succes.",
      });
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error.message || "Eroare la transmiterea comenzii către roletă.",
      });
    },
  });

  const handleAction = (action: "open" | "close") => {
    setFeedback(null);
    toggleMutation.mutate({ action });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roller-door-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xl space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <DoorIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="roller-door-modal-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Control Roletă Intrare
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Releu IoT acces clădire
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Închide fereastra"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Center Status Visual */}
        <div className="py-2 flex flex-col items-center justify-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              toggleMutation.isPending
                ? "bg-slate-900 text-white animate-pulse"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <DoorIcon className="w-8 h-8" />
          </div>
          <span className="text-xs font-semibold text-slate-700 mt-3">
            {toggleMutation.isPending
              ? "Se procesează comanda..."
              : "Releu IoT Intrare Activ"}
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleAction("open")}
            disabled={toggleMutation.isPending}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>Deschide</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("close")}
            disabled={toggleMutation.isPending}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>Închide</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
