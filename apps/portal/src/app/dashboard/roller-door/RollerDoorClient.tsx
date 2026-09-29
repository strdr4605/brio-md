"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  DoorIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";

export function RollerDoorClient() {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toggleMutation = trpc.door.toggle.useMutation({
    onSuccess: (_, variables) => {
      setFeedback({
        type: "success",
        message:
          variables.action === "open"
            ? "Comanda de deschidere a roletei a fost transmisă cu succes."
            : "Comanda de închidere a roletei a fost transmisă cu succes.",
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

  return (
    <div className="space-y-6 max-w-xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <DoorIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Control Roletă Intrare
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comandă relay-ul Wi-Fi IoT pentru accesul securizat în clădire.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95 self-start sm:self-auto"
        >
          <span>← Înapoi la Panou</span>
        </Link>
      </div>

      {/* Main Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
              toggleMutation.isPending
                ? "bg-slate-900 text-white animate-pulse"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <DoorIcon className="w-10 h-10" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-4">
            {toggleMutation.isPending ? "Se procesează comanda..." : "Releu Intrare Conectat"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Receptor IoT activ prin protocol securizat MQTT / Tasmota.
          </p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleAction("open")}
            disabled={toggleMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-bold shadow-xs hover:shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span>Deschide Roleta</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("close")}
            disabled={toggleMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200/80 text-sm font-bold shadow-xs hover:shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span>Închide Roleta</span>
          </button>
        </div>
      </div>
    </div>
  );
}