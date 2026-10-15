"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";

export function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Parola a fost schimbată cu succes. Toate celelalte sesiuni au fost deconectate.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setFeedback(null), 6000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.message || "Eroare la schimbarea parolei.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setFeedback({ type: "error", message: "Introduceți parola curentă." });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({
        type: "error",
        message: "Parola nouă trebuie să aibă cel puțin 6 caractere.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        message: "Parola nouă și confirmarea nu coincid.",
      });
      return;
    }

    setFeedback(null);
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Collapsible Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/70 transition cursor-pointer gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-800 truncate">
              Securitate Cont: Schimbă Parola
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Actualizează datele de acces pentru contul tău de utilizator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            {isOpen ? "Ascunde" : "Extinde"}
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 bg-slate-100/70 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-slate-700" : ""
            }`}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Collapsible Form Body */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 animate-fade-in-up">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Parola Curentă <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Parola Nouă <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Confirmă Parola Nouă <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Reintroduceți parola nouă"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
              >
                {changePasswordMutation.isPending ? "Se actualizează..." : "Actualizează Parola"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
