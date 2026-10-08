"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { type AttachedResource } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  resource: AttachedResource;
  onSuccess: () => void;
};

export function ResourceSettingsModal({
  isOpen,
  onClose,
  resource,
  onSuccess,
}: Props) {
  const [sessionNumber, setSessionNumber] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [targetMinigamesCount, setTargetMinigamesCount] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resource) {
      setSessionNumber(
        resource.sessionNumber !== null && resource.sessionNumber !== undefined
          ? String(resource.sessionNumber)
          : "",
      );
      const settings = resource.settings;
      setMaxScore(
        settings?.maxScore !== undefined && settings?.maxScore !== null
          ? String(settings.maxScore)
          : "",
      );
      setTargetMinigamesCount(
        settings?.targetMinigamesCount !== undefined && settings?.targetMinigamesCount !== null
          ? String(settings.targetMinigamesCount)
          : "",
      );
      setInstructions(settings?.instructions || "");
      setDueDate(typeof settings?.dueDate === "string" ? settings.dueDate : "");
      setErrorMsg(null);
    }
  }, [resource, isOpen]);

  const updateMutation = trpc.resource.updateCourseResourceSettings.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "A apărut o eroare la salvarea setărilor.");
    },
  });

  if (!isOpen || !resource) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sessNum = sessionNumber.trim() ? parseInt(sessionNumber, 10) : null;
    const scoreVal = maxScore.trim() ? parseInt(maxScore, 10) : undefined;
    const minigamesVal = targetMinigamesCount.trim() ? parseInt(targetMinigamesCount, 10) : undefined;

    updateMutation.mutate({
      id: resource.id,
      sessionNumber: sessNum,
      settings: {
        maxScore: !isNaN(scoreVal!) ? scoreVal : undefined,
        targetMinigamesCount: !isNaN(minigamesVal!) ? minigamesVal : undefined,
        instructions: instructions.trim() || undefined,
        dueDate: dueDate.trim() || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Setări Resursă Sesiune
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
              {resource.resource.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Număr Sesiune
            </label>
            <input
              type="number"
              min={1}
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
              placeholder="Fără sesiune (lăsați gol)"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Modificarea sesiunii mută resursa în altă secțiune a syllabusului.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Punctaj Maxim
              </label>
              <input
                type="number"
                min={0}
                placeholder="ex. 100"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Țintă Minijocuri
              </label>
              <input
                type="number"
                min={1}
                placeholder="ex. 3 runde"
                value={targetMinigamesCount}
                onChange={(e) => setTargetMinigamesCount(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Termen Limită (Due Date)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Opțional: elevii vor vedea data și ora limită pentru finalizarea activității.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instrucțiuni Pedagogice Specifice Sesiunii
            </label>
            <textarea
              rows={3}
              placeholder="Instrucțiuni sau obiective pentru elevi la această sesiune..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition cursor-pointer shadow-2xs"
            >
              {updateMutation.isPending ? "Se salvează..." : "Salvează Setările"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
