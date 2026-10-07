"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  onSuccess?: () => void;
};

type ResourceType = "minigame" | "worksheet" | "link" | "pdf" | "video";

export function AddResourceModal({ isOpen, onClose, courseId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("minigame");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.resource.createLearningResource.useMutation({
    onSuccess: () => {
      utils.resource.getCourseResources.invalidate({ courseId });
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "A apărut o eroare la salvarea resursei.");
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setTitle("");
    setType("minigame");
    setUrl("");
    setDescription("");
    setMaxScore("100");
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Titlul resursei este obligatoriu.");
      return;
    }
    if (!url.trim()) {
      setErrorMsg("URL-ul sau linkul resursei este obligatoriu.");
      return;
    }

    const scoreNum = parseInt(maxScore, 10);

    createMutation.mutate({
      courseId,
      title: title.trim(),
      type,
      url: url.trim(),
      description: description.trim() || null,
      metadata: {
        maxScore: isNaN(scoreNum) ? 100 : scoreNum,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
              +
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Adaugă Resursă la Curs</h3>
              <p className="text-xs text-slate-500">
                Fișe de lucru, minijocuri interactive sau linkuri pentru elevi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Titlu */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Titlu Resursă <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Vocabulary Challenge A1 sau Fișă de Lucru #2"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
            />
          </div>

          {/* Tip & Scor Maxim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tip Resursă
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition bg-white cursor-pointer"
              >
                <option value="minigame">🎮 Minijoc Interactiv</option>
                <option value="worksheet">📄 Fișă de Lucru</option>
                <option value="link">🔗 Link Extern / Quizlet</option>
                <option value="pdf">📑 Document PDF</option>
                <option value="video">🎥 Video Educațional</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Scor Maxim (Puncte)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
              />
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              URL / Link Resursă <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://learn.brio.md/games/... sau https://..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition font-mono"
            />
          </div>

          {/* Descriere */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Descriere & Instrucțiuni (Opțional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucțiuni scurte pentru elevi..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <span>Se salvează...</span>
              ) : (
                <>
                  <span>✓</span>
                  <span>Salvează Resursa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
