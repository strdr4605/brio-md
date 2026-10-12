"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FileUploadDropzone } from "@/app/teacher/resources/FileUploadDropzone";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  initialSessionNumber?: number | null;
  totalSessions?: number;
  onSuccess?: () => void;
};

type ResourceType =
  | "pdf"
  | "presentation"
  | "worksheet"
  | "minigame"
  | "link"
  | "video";

export function AddResourceModal({
  isOpen,
  onClose,
  courseId,
  initialSessionNumber,
  totalSessions = 24,
  onSuccess,
}: Props) {
  const [inputMode, setInputMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("pdf");
  const [url, setUrl] = useState("");
  const [uploadedMeta, setUploadedMeta] = useState<{
    size?: number;
    mimeType?: string;
    originalName?: string;
  } | null>(null);
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [selectedSession, setSelectedSession] = useState<string>(
    initialSessionNumber ? String(initialSessionNumber) : "",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.resource.createLearningResource.useMutation({
    onSuccess: () => {
      utils.resource.getCourseResources.invalidate({ courseId });
      utils.resource.getLibraryResources.invalidate();
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "A apărut o eroare la salvarea resursei.");
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setInputMode("upload");
    setTitle("");
    setType("pdf");
    setUrl("");
    setUploadedMeta(null);
    setDescription("");
    setMaxScore("100");
    setSelectedSession(initialSessionNumber ? String(initialSessionNumber) : "");
    setErrorMsg(null);
    createMutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Titlul resursei este obligatoriu.");
      return;
    }
    if (!url.trim()) {
      setErrorMsg(
        inputMode === "upload"
          ? "Te rugăm să încarci un fișier (PDF, PPTX sau alt format)."
          : "URL-ul sau linkul resursei este obligatoriu.",
      );
      return;
    }

    const scoreNum = parseInt(maxScore, 10);
    const sessionNum = selectedSession ? parseInt(selectedSession, 10) : undefined;

    createMutation.mutate({
      courseId,
      sessionNumber: isNaN(sessionNum as number) ? undefined : sessionNum,
      title: title.trim(),
      type,
      url: url.trim(),
      description: description.trim() || null,
      metadata: {
        maxScore: isNaN(scoreNum) ? 100 : scoreNum,
        fileSize: uploadedMeta?.size,
        mimeType: uploadedMeta?.mimeType,
        originalName: uploadedMeta?.originalName,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
              <span className="text-base font-bold">+</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Adaugă Resursă la Curs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Încarcă PDF, PPTX sau adaugă linkuri interactive pentru elevi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Închide"
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mode Switcher: Upload File or External Link */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl gap-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === "upload"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span>📁</span>
              <span>Încarcă PDF / PPTX</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("link")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === "link"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span>🔗</span>
              <span>Link Extern</span>
            </button>
          </div>

          {/* Upload Area or Link Input */}
          {inputMode === "upload" ? (
            <div className="space-y-2">
              <FileUploadDropzone
                currentFilename={uploadedMeta?.originalName}
                onUploadSuccess={(data) => {
                  setUrl(data.url);
                  setUploadedMeta({
                    size: data.size,
                    mimeType: data.contentType,
                    originalName: data.filename,
                  });
                  if (!title.trim()) {
                    setTitle(data.filename.replace(/\.[^/.]+$/, ""));
                  }
                  if (data.detectedType === "presentation") {
                    setType("presentation");
                  } else if (data.detectedType === "pdf") {
                    setType("pdf");
                  } else if (data.detectedType === "video") {
                    setType("video");
                  } else {
                    setType("worksheet");
                  }
                  setErrorMsg(null);
                }}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                URL / Link Resursă <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required={inputMode === "link"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition font-mono bg-white"
              />
            </div>
          )}

          {/* Titlu Resursă */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Titlu Resursă <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Prezentare Curs A1 sau Fişă de Lucru #2"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition bg-white"
            />
          </div>

          {/* Tip, Sesiune & Scor Maxim */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tip Resursă
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition bg-white cursor-pointer"
              >
                <option value="pdf">📑 Document PDF</option>
                <option value="presentation">📽️ Prezentare PPTX</option>
                <option value="worksheet">✍️ Fișă de Lucru</option>
                <option value="minigame">🎮 Minijoc Interactiv</option>
                <option value="video">🎥 Video Educațional</option>
                <option value="link">🔗 Link Extern</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Sesiune
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition bg-white cursor-pointer"
              >
                <option value="">Toate Sesiunile</option>
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map((sNum) => (
                  <option key={sNum} value={String(sNum)}>
                    Sesiunea {sNum}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Scor (Puncte)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition bg-white"
              />
            </div>
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition resize-none bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !url.trim()}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
