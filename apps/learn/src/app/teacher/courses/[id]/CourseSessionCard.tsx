"use client";

import Link from "next/link";
import { type AttachedResource } from "./types";

type Props = {
  sessionNumber: number | null;
  title: string;
  resources: AttachedResource[];
  onAttachClick: (sessionNumber: number | null) => void;
  onEditSettingsClick: (resource: AttachedResource) => void;
  onDetachClick: (assignmentId: number, title: string) => void;
  onMoveUp: (index: number, sessionResources: AttachedResource[]) => void;
  onMoveDown: (index: number, sessionResources: AttachedResource[]) => void;
  onPreviewClick?: (resource: AttachedResource) => void;
};

function getResourceTypeLabel(type: string): { label: string; icon: string } {
  switch (type) {
    case "worksheet":
      return { label: "Fișă de lucru", icon: "📝" };
    case "minigame":
      return { label: "Minijoc", icon: "🎮" };
    case "textbook":
      return { label: "Manual / Curs", icon: "📖" };
    case "pdf":
      return { label: "PDF Document", icon: "📄" };
    case "video":
      return { label: "Video", icon: "🎬" };
    case "link":
      return { label: "Link Extern", icon: "🔗" };
    case "manual":
      return { label: "Ghid Manual", icon: "📘" };
    default:
      return { label: "Resursă", icon: "📦" };
  }
}

export function CourseSessionCard({
  sessionNumber,
  title,
  resources,
  onAttachClick,
  onEditSettingsClick,
  onDetachClick,
  onMoveUp,
  onMoveDown,
  onPreviewClick,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs transition-all hover:border-slate-300">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200/60">
            {sessionNumber ? `#${sessionNumber}` : "★"}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {resources.length === 0
                ? "Nicio resursă atașată încă"
                : `${resources.length} ${
                    resources.length === 1 ? "resursă atașată" : "resurse atașate"
                  }`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAttachClick(sessionNumber)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200/70"
        >
          <span>+</span>
          <span>Atașează Resursă</span>
        </button>
      </div>

      {/* Session Resources List */}
      <div className="mt-4">
        {resources.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-xs text-slate-400">
            Sesiune fără materiale configurate. Apăsați pe{" "}
            <span className="font-semibold text-slate-600">«Atașează Resursă»</span>{" "}
            pentru a adăuga fișe sau minijocuri.
          </div>
        ) : (
          <div className="space-y-2.5">
            {resources.map((item, index) => {
              const meta = getResourceTypeLabel(item.resource.type);
              const settings = item.settings;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onPreviewClick?.(item)}
                      title="Previzualizează resursa"
                      className="text-base shrink-0 select-none mt-0.5 cursor-pointer"
                    >
                      {meta.icon}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.resource.title}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {meta.label}
                        </span>
                      </div>

                      {item.resource.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.resource.description}
                        </p>
                      )}

                      {/* Settings Badges */}
                      {settings && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {settings.maxScore !== undefined && settings.maxScore !== null && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <span>🎯</span>
                              <span>Punctaj max: {settings.maxScore}</span>
                            </span>
                          )}

                          {settings.targetMinigamesCount !== undefined &&
                            settings.targetMinigamesCount !== null && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300/80">
                                <span>🕹️</span>
                                <span>Țintă: {settings.targetMinigamesCount} jocuri</span>
                              </span>
                            )}

                          {settings.instructions && (
                            <span
                              title={settings.instructions}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 max-w-xs truncate"
                            >
                              <span>💬</span>
                              <span className="truncate">{settings.instructions}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions: Reorder & Settings & Detach */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveUp(index, resources)}
                      title="Mută mai sus"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    >
                      ↑
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === resources.length - 1}
                      onClick={() => onMoveDown(index, resources)}
                      title="Mută mai jos"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    >
                      ↓
                    </button>

                    {/* Edit Settings */}
                    <button
                      type="button"
                      onClick={() => onEditSettingsClick(item)}
                      title="Setări resursă sesiune"
                      className="px-2.5 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 flex items-center gap-1 text-xs font-medium transition cursor-pointer"
                    >
                      <span>⚙️</span>
                      <span className="hidden md:inline text-[11px]">Setări</span>
                    </button>

                    {/* View external resource */}
                    {item.resource.url && (
                      <Link
                        href={item.resource.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Deschide resursa"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center text-xs transition"
                      >
                        ↗
                      </Link>
                    )}

                    {/* Detach Button */}
                    <button
                      type="button"
                      onClick={() => onDetachClick(item.id, item.resource.title)}
                      title="Detașează resursa din această sesiune"
                      className="w-7 h-7 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
