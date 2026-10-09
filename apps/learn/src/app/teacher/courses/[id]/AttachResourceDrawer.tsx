"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { type LibraryResourceItem } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  initialSessionNumber: number | null;
  totalSessions: number;
  onSuccess: () => void;
};

type ResourceTypeFilter = "all" | "worksheet" | "minigame" | "textbook" | "pdf" | "video" | "link";

const FILTER_ITEMS = [
  { id: "all", label: "Toate" },
  { id: "worksheet", label: "Fișe" },
  { id: "minigame", label: "Minijocuri" },
  { id: "textbook", label: "Manuale" },
  { id: "pdf", label: "PDF" },
  { id: "video", label: "Video" },
] as const;

export function AttachResourceDrawer({
  isOpen,
  onClose,
  courseId,
  initialSessionNumber,
  totalSessions,
  onSuccess,
}: Props) {
  const [sessionNumber, setSessionNumber] = useState<string>("1");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceTypeFilter>("all");
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);

  const [maxScore, setMaxScore] = useState<string>("");
  const [targetMinigamesCount, setTargetMinigamesCount] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSessionNumber(
      initialSessionNumber !== null && initialSessionNumber !== undefined
        ? String(initialSessionNumber)
        : "1",
    );
    setSelectedResourceId(null);
    setErrorMsg(null);
  }, [initialSessionNumber, isOpen]);

  const { data: rawLibrary = [], isLoading } = trpc.resource.getLibraryResources.useQuery(
    { search: search.trim() || undefined, type: typeFilter !== "all" ? typeFilter : undefined },
    { enabled: isOpen },
  );

  const libraryResources = rawLibrary as LibraryResourceItem[];

  const assignMutation = trpc.resource.assignResourceToSession.useMutation({
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "A apărut o eroare la atașarea resursei.");
    },
  });

  const handleClose = () => {
    setSelectedResourceId(null);
    setMaxScore("");
    setTargetMinigamesCount("");
    setInstructions("");
    setErrorMsg(null);
    onClose();
  };

  const handleSelectResource = (res: LibraryResourceItem) => {
    if (selectedResourceId === res.id) {
      setSelectedResourceId(null);
      return;
    }
    setSelectedResourceId(res.id);
    const meta = (res.metadata || {}) as Record<string, unknown>;
    setMaxScore(meta.maxScore !== undefined ? String(meta.maxScore) : "");
    setInstructions(typeof meta.instructions === "string" ? meta.instructions : "");
    setTargetMinigamesCount(
      res.type === "minigame"
        ? meta.targetMinigamesCount !== undefined
          ? String(meta.targetMinigamesCount)
          : "3"
        : "",
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setErrorMsg("Selectați o resursă din listă.");
      return;
    }
    const sessNum = sessionNumber.trim() ? parseInt(sessionNumber, 10) : null;
    const scoreVal = maxScore.trim() ? parseInt(maxScore, 10) : undefined;
    const minigamesVal = targetMinigamesCount.trim() ? parseInt(targetMinigamesCount, 10) : undefined;

    assignMutation.mutate({
      courseId,
      resourceId: selectedResourceId,
      sessionNumber: sessNum,
      settings: {
        maxScore: !isNaN(scoreVal!) ? scoreVal : undefined,
        targetMinigamesCount: !isNaN(minigamesVal!) ? minigamesVal : undefined,
        instructions: instructions.trim() || undefined,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">Atașează Resursă la Curs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Selectează materiale din bibliotecă și asignează-le la o sesiune</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Session Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Număr Sesiune Țintă</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  >
                    {Array.from({ length: Math.max(totalSessions, 1) }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>Sesiunea {s}</option>
                    ))}
                    <option value="">Fără sesiune (General)</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(e.target.value)}
                    placeholder="Sau număr personalizat"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Caută resursă după titlu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <div className="flex flex-wrap gap-1">
                  {FILTER_ITEMS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTypeFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                        typeFilter === f.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Se încarcă resursele din bibliotecă...</div>
                ) : libraryResources.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Nicio resursă găsită. Creați materiale noi în Biblioteca Globală.
                  </div>
                ) : (
                  libraryResources.map((res) => {
                    const isSelected = selectedResourceId === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => handleSelectResource(res)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold truncate">
                            <span>{res.type === "minigame" ? "🎮" : res.type === "worksheet" ? "📝" : "📄"}</span>
                            <span className="truncate">{res.title}</span>
                          </div>
                          {res.description && (
                            <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                              {res.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                            isSelected ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {res.type}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Settings Form */}
              {selectedResourceId && (
                <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>Setări Specifice pentru această Sesiune</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Punctaj Maxim</label>
                      <input
                        type="number"
                        placeholder="ex. 100"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Țintă Minijocuri</label>
                      <input
                        type="number"
                        placeholder="ex. 3 runde"
                        value={targetMinigamesCount}
                        onChange={(e) => setTargetMinigamesCount(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Instrucțiuni / Recomandări Profesori</label>
                    <textarea
                      rows={2}
                      placeholder="Instrucțiuni vizibile pentru această sesiune..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={!selectedResourceId || assignMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition cursor-pointer shadow-2xs"
              >
                {assignMutation.isPending ? "Se atașează..." : "Atașează la Sesiune"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
