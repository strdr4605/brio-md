"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { notes: string; fileUrl?: string }) => Promise<void>;
  resourceTitle: string;
  resourceType?: string;
  isSubmitting?: boolean;
};

export function StudentTaskSubmitModal({
  isOpen,
  onClose,
  onSubmit,
  resourceTitle,
  resourceType,
  isSubmitting = false,
}: Props) {
  const [notes, setNotes] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        notes: notes.trim(),
        fileUrl: linkUrl.trim() || undefined,
      });
      setNotes("");
      setLinkUrl("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Eroare la trimiterea sarcinii. Te rugăm să încerci din nou.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-800">Predare sarcină</h3>
              {resourceType && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  {resourceType}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{resourceTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Închide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Notițe / Răspuns sarcină
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scrie răspunsul, observațiile sau descrierea rezolvării tale aici..."
              className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Link fișier extern / Document de predare (opțional)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/... sau link document"
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Dacă ai realizat tema pe Google Docs/Drive, poți lipi link-ul aici.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              i
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prin trimitere, profesorul tău va primi sarcina pentru evaluare și va putea acorda feedback și notă.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Se trimite...
                </>
              ) : (
                "Finalizează și trimite"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
