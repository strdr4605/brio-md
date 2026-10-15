"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AddResourceModal } from "./AddResourceModal";

export type SessionResourceItem = {
  id: number;
  courseId: number;
  resourceId: number;
  sessionNumber: number | null;
  orderIndex: number | null;
  resource: {
    id: number;
    title: string;
    description: string | null;
    type: "pdf" | "manual" | "textbook" | "worksheet" | "minigame" | "link" | "video" | "vdr" | "presentation";
    url: string;
    metadata: unknown;
    schoolId: number | null;
  };
};

type Props = {
  courseId: number;
  groupId?: number;
  resources: SessionResourceItem[];
  selectedResourceId: number | null;
  onSelectResource: (resourceId: number | null) => void;
  activeBroadcastResourceId?: number | null;
  onCloseBroadcast?: () => void;
  onBroadcastSuccess?: (resourceTitle: string, count: number) => void;
};

const TYPE_BADGES: Record<string, { bg: string; label: string }> = {
  worksheet: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Fișă" },
  minigame: { bg: "bg-purple-50 text-purple-800 border-purple-200", label: "Minijoc" },
  link: { bg: "bg-blue-50 text-blue-800 border-blue-200", label: "Link" },
  pdf: { bg: "bg-rose-50 text-rose-800 border-rose-200", label: "PDF" },
  presentation: { bg: "bg-amber-50 text-amber-800 border-amber-200", label: "PPTX" },
  manual: { bg: "bg-amber-50 text-amber-800 border-amber-200", label: "Manual" },
  textbook: { bg: "bg-amber-50 text-amber-800 border-amber-200", label: "Manual" },
  video: { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "Video" },
  vdr: { bg: "bg-cyan-50 text-cyan-800 border-cyan-200", label: "VDR" },
};

const FILTER_LABELS: Record<string, string> = { all: "Toate", worksheet: "Fișe", minigame: "Minijocuri", pdf: "PDF", presentation: "PPTX", link: "Linkuri" };

export function SessionResourceBroadcastBar({
  courseId,
  groupId,
  resources,
  selectedResourceId,
  onSelectResource,
  activeBroadcastResourceId,
  onCloseBroadcast,
  onBroadcastSuccess,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | "worksheet" | "minigame" | "pdf" | "presentation" | "link">("all");
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [internalActiveBroadcastId, setInternalActiveBroadcastId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activeBroadcastId =
    activeBroadcastResourceId !== undefined ? activeBroadcastResourceId : internalActiveBroadcastId;

  const utils = trpc.useUtils();

  const broadcastMutation = trpc.lesson.broadcastResourceToGroup.useMutation({
    onSuccess: (res) => {
      const target = resources.find((r) => r.resource.id === selectedResourceId);
      const title = target?.resource.title || "Resursa";
      setInternalActiveBroadcastId(selectedResourceId);
      setBroadcastFeedback(`Resursa «${title}» a fost deschisă pentru ${res.assignedCount} elevi.`);
      utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId });
      utils.attendance.getLessonAttendance.invalidate({ courseId });
      if (onBroadcastSuccess) {
        onBroadcastSuccess(title, res.assignedCount);
      }
      setTimeout(() => setBroadcastFeedback(null), 4000);
    },
  });

  const handleCloseBroadcast = () => {
    setInternalActiveBroadcastId(null);
    onCloseBroadcast?.();
  };

  const filteredResources = resources.filter((item) => {
    if (activeFilter === "all") return true;
    return item.resource.type === activeFilter;
  });

  const selectedItem = resources.find((r) => r.resource.id === selectedResourceId);

  const handleBroadcast = () => {
    if (!groupId || !selectedResourceId) return;
    broadcastMutation.mutate({
      groupId,
      courseId,
      resourceId: selectedResourceId,
    });
  };

  if (resources.length === 0) {
    return (
      <>
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Nu există încă resurse sau fișe atașate acestui curs.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
          >
            <span>+ Adaugă Primul Material</span>
          </button>
        </div>
        <AddResourceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} courseId={courseId} />
      </>
    );
  }

  const activeResource = resources.find((r) => r.resource.id === activeBroadcastId);

  return (
    <>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-3.5">
        {/* Currently Broadcasting Banner */}
        {activeResource && (
          <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    În difuzare activă
                  </span>
                  <span className="text-[10px] text-slate-400">• Pe ecranele elevilor</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeResource.resource.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedResourceId && selectedResourceId !== activeResource.resource.id && (
                <button
                  type="button"
                  disabled={broadcastMutation.isPending}
                  onClick={handleBroadcast}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Comută difuzarea la resursa selectată"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{broadcastMutation.isPending ? "Se comută..." : "Comută difuzarea"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseBroadcast}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition border border-white/20 cursor-pointer"
                title="Închide starea de difuzare activă"
              >
                <span>Închide difuzarea</span>
              </button>
            </div>
          </div>
        )}

        {/* Header and Type Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resurse Sesiune Activă ({resources.length})
            </h3>
          </div>

          {/* Filter Pills + Add Button */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-wrap">
            {(["all", "worksheet", "minigame", "pdf", "presentation", "link"] as const).map((filter) => {
              const count =
                filter === "all"
                  ? resources.length
                  : resources.filter((r) => r.resource.type === filter).length;
              if (filter !== "all" && count === 0) return null;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === filter
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  <span>{FILTER_LABELS[filter]}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1 shadow-2xs cursor-pointer select-none ml-1"
              title="Adaugă o nouă fișă sau minijoc pentru acest curs"
            >
              <span>+</span>
              <span>Adaugă Resursă</span>
            </button>
          </div>
        </div>

        {/* Resource Cards Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredResources.map((item) => {
            const isSelected = item.resource.id === selectedResourceId;
            const isBroadcasting = item.resource.id === activeBroadcastId;
            const typeBadge = TYPE_BADGES[item.resource.type] || {
              bg: "bg-slate-50 text-slate-700 border-slate-200",
              label: item.resource.type,
            };

            return (
              <button
                key={item.resource.id}
                type="button"
                onClick={() => onSelectResource(isSelected ? null : item.resource.id)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none relative ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                    : isBroadcasting
                      ? "bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-300 text-slate-800 ring-1 ring-emerald-400/50"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                        isSelected ? "bg-white/20 text-white border-white/30" : typeBadge.bg
                      }`}
                    >
                      {typeBadge.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {isBroadcasting && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.2 rounded border ${
                          isSelected
                            ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/40"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Difuzat</span>
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[11px] font-bold text-emerald-400">Selectat ✓</span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-xs line-clamp-1">{item.resource.title}</div>
                </div>

                {item.resource.description && (
                  <p
                    className={`text-[11px] line-clamp-1 ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {item.resource.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Broadcast to All Action Bar */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {selectedItem ? (
              <span>
                Resursă selectată: <strong className="text-slate-800">{selectedItem.resource.title}</strong>
              </span>
            ) : (
              <span className="italic">Selectează o resursă de mai sus pentru a o transmite întregii clase.</span>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedResourceId || !groupId || broadcastMutation.isPending || activeBroadcastId === selectedResourceId}
            onClick={handleBroadcast}
            className={`px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${
              !selectedResourceId || !groupId || activeBroadcastId === selectedResourceId
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white border-slate-900 active:scale-[0.98]"
            }`}
            title="Deschide și alocă această resursă simultan pentru toți elevii din clasă"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span>
              {broadcastMutation.isPending
                ? "Se transmite..."
                : activeBroadcastId && selectedResourceId && activeBroadcastId !== selectedResourceId
                  ? "Comută difuzarea la resursa selectată"
                  : activeBroadcastId === selectedResourceId
                    ? "Resursa este deja în difuzare"
                    : "Deschide resursa pentru toți elevii"}
            </span>
          </button>
        </div>

        {/* Broadcast Feedback Toast Notification */}
        {broadcastFeedback && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{broadcastFeedback}</span>
          </div>
        )}
      </div>

      <AddResourceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        courseId={courseId}
      />
    </>
  );
}
