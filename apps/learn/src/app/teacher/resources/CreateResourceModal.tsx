"use client";

import { trpc } from "@/lib/trpc";
import { FileUploadDropzone } from "./FileUploadDropzone";
import { MinigamePresets } from "./MinigamePresets";
import { CourseSessionAssigner } from "./CourseSessionAssigner";
import { ResourcePedagogicalFields } from "./ResourcePedagogicalFields";
import { useResourceForm, ResourceType } from "./useResourceForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateResourceModal({ isOpen, onClose }: Props) {
  const form = useResourceForm();
  const {
    inputMode, setInputMode,
    title, setTitle,
    description, setDescription,
    type, setType,
    url, setUrl,
    uploadedMeta, setUploadedMeta,
    instructions, setInstructions,
    guidelines, setGuidelines,
    maxScore, setMaxScore,
    level, setLevel,
    courseId, setCourseId,
    sessionNumber, setSessionNumber,
    orderIndex, setOrderIndex,
    showDetails, setShowDetails,
    resetForm, handleUrlChange, applyPreset, getPayload,
  } = form;

  const utils = trpc.useUtils();

  const { data: courses = [] } = trpc.teacher.getMyCourses.useQuery(undefined, {
    enabled: isOpen,
  });

  const createMutation = trpc.resource.createLearningResource.useMutation({
    onSuccess: () => {
      utils.resource.getLibraryResources.invalidate();
      utils.resource.getResourceAssignments.invalidate();
      handleClose();
    },
  });

  const handleClose = () => {
    resetForm();
    createMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    createMutation.mutate(getPayload());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Adaugă Resursă Didactică</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Încarcă un fișier sau adaugă un link extern pentru cursuri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Închide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {createMutation.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {createMutation.error.message}
            </div>
          )}

          {/* Source Selector: Upload or External Link */}
          <div className="space-y-2.5">
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
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Încarcă Fișier</span>
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
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Link Extern</span>
              </button>
            </div>

            {inputMode === "upload" ? (
              <div className="space-y-2">
                <FileUploadDropzone
                  currentFilename={uploadedMeta?.originalName}
                  onUploadSuccess={(data) => {
                    setUrl(data.url);
                    setUploadedMeta({ size: data.size, mimeType: data.contentType, originalName: data.filename });
                    if (!title.trim()) setTitle(data.filename.replace(/\.[^/.]+$/, ""));
                    setType(data.detectedType);
                  }}
                />
                {uploadedMeta && (type === "worksheet" || type === "manual" || type === "pdf") && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-medium text-slate-500">Destinație:</span>
                    <button
                      type="button"
                      onClick={() => setType("worksheet")}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                        type === "worksheet"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ✍️ Fișă & Practică
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("manual")}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                        type === "manual" || type === "pdf"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      📖 Lectură & Teorie
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link / URL Extern <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required={inputMode === "link"}
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titlu Resursă <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titlul resursei..."
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
            />
          </div>

          {/* Description (Prominently visible) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descriere Resursă (Opțional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scurtă descriere a materialului..."
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white resize-none"
            />
          </div>

          {/* Link Type (only in link mode - 4 pedagogical categories) */}
          {inputMode === "link" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tip Resursă Link <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              >
                <option value="worksheet">✍️ Fișă de Lucru & Practică</option>
                <option value="manual">📖 Lectură & Teorie (Manual)</option>
                <option value="video">🎥 Lecție Video (YouTube/Vimeo)</option>
                <option value="minigame">🎮 Joc & Interactiv (Scratch/Wordwall)</option>
              </select>
            </div>
          )}

          {/* Minigame Quick Presets */}
          {type === "minigame" && (
            <MinigamePresets onSelect={applyPreset} />
          )}

          {/* Course & Session Assignment (Prominently Visible) */}
          <CourseSessionAssigner
            courseId={courseId}
            setCourseId={setCourseId}
            courses={courses}
            sessionNumber={sessionNumber}
            setSessionNumber={setSessionNumber}
            orderIndex={orderIndex}
            setOrderIndex={setOrderIndex}
          />

          {/* Optional Pedagogical Details (Instructions, Guidelines, Score) */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>📝</span>
                <span>
                  {showDetails
                    ? "Ascunde instrucțiunile și ghidul"
                    : "+ Adaugă instrucțiuni, ghid sau barem (Opțional)"}
                </span>
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDetails && (
              <ResourcePedagogicalFields
                level={level} setLevel={setLevel}
                instructions={instructions} setInstructions={setInstructions}
                guidelines={guidelines} setGuidelines={setGuidelines}
                maxScore={maxScore} setMaxScore={setMaxScore}
                showScore={type === "worksheet" || type === "minigame"}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              Anulează
            </button>
            <button type="submit" disabled={createMutation.isPending || !title.trim() || !url.trim()} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2">
              {createMutation.isPending ? "Se salvează..." : "Salvează Resursa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
