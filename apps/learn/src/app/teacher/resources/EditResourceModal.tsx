"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { normalizeGameUrl } from "@/lib/gameUrlHelper";
import { CourseSessionAssigner } from "./CourseSessionAssigner";
import { ResourcePedagogicalFields } from "./ResourcePedagogicalFields";

type ResourceType =
  | "pdf"
  | "manual"
  | "textbook"
  | "worksheet"
  | "minigame"
  | "link"
  | "video"
  | "vdr";

export type EditableResource = {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  url: string;
  metadata?: Record<string, unknown> | null;
  assignedCourseId?: number | null;
  assignedSessionNumber?: number | null;
  assignedOrderIndex?: number | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  resource: EditableResource | null;
};

export function EditResourceModal({ isOpen, onClose, resource }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("worksheet");
  const [url, setUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [sessionNumber, setSessionNumber] = useState<string>("");
  const [orderIndex, setOrderIndex] = useState<number>(10);
  const [showDetails, setShowDetails] = useState(false);

  const utils = trpc.useUtils();

  const { data: courses = [] } = trpc.teacher.getMyCourses.useQuery(undefined, {
    enabled: isOpen,
  });

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || "");
      setDescription(resource.description || "");
      setType((resource.type as ResourceType) || "worksheet");
      setUrl(resource.url || "");

      const meta = (resource.metadata || {}) as Record<string, unknown>;
      setLevel(typeof meta.level === "string" ? meta.level : "");
      setMaxScore(typeof meta.maxScore === "number" ? String(meta.maxScore) : "");
      setInstructions(typeof meta.instructions === "string" ? meta.instructions : "");
      setGuidelines(typeof meta.guidelines === "string" ? meta.guidelines : "");

      setCourseId(resource.assignedCourseId ? String(resource.assignedCourseId) : "");
      setSessionNumber(resource.assignedSessionNumber ? String(resource.assignedSessionNumber) : "");
      setOrderIndex(typeof resource.assignedOrderIndex === "number" ? resource.assignedOrderIndex : 10);

      setShowDetails(Boolean(meta.level || meta.maxScore || meta.instructions || meta.guidelines));
    }
  }, [resource]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const updateMutation = trpc.resource.updateLearningResource.useMutation({
    onSuccess: () => {
      utils.resource.getLibraryResources.invalidate();
      utils.resource.getResourceAssignments.invalidate();
      utils.resource.getCourseResources.invalidate();
      onClose();
    },
  });

  if (!isOpen || !resource) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const normalized = type === "minigame" ? normalizeGameUrl(url.trim()) : null;

    updateMutation.mutate({
      id: resource.id,
      title: title.trim(),
      description: description.trim() || null,
      type,
      url: normalized?.url || url.trim(),
      courseId: courseId ? parseInt(courseId, 10) : undefined,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : undefined,
      orderIndex: courseId ? orderIndex : undefined,
      metadata: {
        embedUrl: normalized?.embedUrl || undefined,
        provider: normalized?.provider || undefined,
        instructions: instructions.trim() || undefined,
        guidelines: guidelines.trim() || undefined,
        level: level.trim() || undefined,
        maxScore: maxScore ? parseInt(maxScore, 10) : undefined,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Editează Resursă Didactică</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                Modifică titlul, descrierea, link-ul sau sesiunea la care este asignată.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
          {updateMutation.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {updateMutation.error.message}
            </div>
          )}

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
              placeholder="ex. Fișă de lucru: Fracții zecimale"
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

          {/* Type and URL in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tip Resursă <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              >
                <option value="worksheet">✍️ Fișă & Practică</option>
                <option value="manual">📖 Lectură & Teorie</option>
                <option value="video">🎥 Lecție Video</option>
                <option value="minigame">🎮 Joc & Interactiv</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link / URL Fișier sau Joc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Course and Session Assigner */}
          <CourseSessionAssigner
            courseId={courseId}
            setCourseId={setCourseId}
            courses={courses}
            sessionNumber={sessionNumber}
            setSessionNumber={setSessionNumber}
            orderIndex={orderIndex}
            setOrderIndex={setOrderIndex}
          />

          {/* Toggle pedagogical details */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <span>{showDetails ? "− Ascunde detalii metodice" : "+ Detalii metodice (Nivel, Punctaj, Ghid, Instrucțiuni)"}</span>
            </button>
          </div>

          {showDetails && (
            <ResourcePedagogicalFields
              level={level}
              setLevel={setLevel}
              instructions={instructions}
              setInstructions={setInstructions}
              guidelines={guidelines}
              setGuidelines={setGuidelines}
              maxScore={maxScore}
              setMaxScore={setMaxScore}
              showScore={type === "worksheet" || type === "minigame"}
            />
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !title.trim() || !url.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Se salvează...</span>
                </>
              ) : (
                <span>Salvează Modificările</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
