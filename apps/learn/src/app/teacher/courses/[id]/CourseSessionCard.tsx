"use client";

import Link from "next/link";
import { FileTypeIcon } from "./FileTypeIcon";
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

function formatDueDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("ro-RO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:border-slate-300 overflow-hidden">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-slate-800 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 shadow-2xs">
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
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200/90 shadow-2xs"
        >
          <span>+</span>
          <span>Atașează Resursă</span>
        </button>
      </div>

      {/* Session Resources List (Modern LMS Divider Rows) */}
      <div>
        {resources.length === 0 ? (
          <div className="py-8 px-4 text-center bg-white text-xs text-slate-400">
            Sesiune fără materiale configurate. Apăsați pe{" "}
            <span className="font-semibold text-slate-600">«Atașează Resursă»</span>{" "}
            pentru a adăuga fișe sau minijocuri.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resources.map((item, index) => {
              const settings = item.settings;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5 hover:bg-slate-50/70 transition"
                >
                  {/* Left info: Icon + Title + Due Date + Subtitle */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onPreviewClick?.(item)}
                      title="Previzualizează resursa"
                      className="p-1 rounded-lg hover:bg-slate-200/60 transition shrink-0 cursor-pointer mt-0.5"
                    >
                      <FileTypeIcon type={item.resource.type} className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreviewClick?.(item)}
                          title="Previzualizează resursa"
                          className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition text-left cursor-pointer truncate max-w-md"
                        >
                          {item.resource.title}
                        </button>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/70 text-slate-600">
                          {item.resource.type}
                        </span>
                      </div>

                      {/* Instructions / Description Subtitle (Competitor pattern) */}
                      {(settings?.instructions || item.resource.description) && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {settings?.instructions || item.resource.description}
                        </p>
                      )}

                      {/* Due Date Context (Competitor pattern: Due Tuesday, April 21...) */}
                      {settings?.dueDate && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500">
                          <span className="text-slate-400">📅</span>
                          <span>Termen limită: {formatDueDate(settings.dueDate)}</span>
                        </div>
                      )}

                      {/* Score / Target Badges */}
                      {(settings?.maxScore !== undefined && settings.maxScore !== null) ||
                      (settings?.targetMinigamesCount !== undefined &&
                        settings.targetMinigamesCount !== null) ? (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {settings?.maxScore !== undefined && settings.maxScore !== null && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                              <span>🎯</span>
                              <span>Max: {settings.maxScore} pct</span>
                            </span>
                          )}

                          {settings?.targetMinigamesCount !== undefined &&
                            settings.targetMinigamesCount !== null && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                <span>🕹️</span>
                                <span>Țintă: {settings.targetMinigamesCount} jocuri</span>
                              </span>
                            )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Right actions: Reorder & Settings & Preview & Detach */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveUp(index, resources)}
                      title="Mută mai sus"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      ↑
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === resources.length - 1}
                      onClick={() => onMoveDown(index, resources)}
                      title="Mută mai jos"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      ↓
                    </button>

                    {/* Edit Settings (Clean Gear Icon Only) */}
                    <button
                      type="button"
                      onClick={() => onEditSettingsClick(item)}
                      title="Setări resursă sesiune"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
                    >
                      ⚙️
                    </button>

                    {/* View external resource */}
                    {item.resource.url && (
                      <Link
                        href={item.resource.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Deschide resursa externă"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center text-xs transition shadow-2xs"
                      >
                        ↗
                      </Link>
                    )}

                    {/* Detach Button */}
                    <button
                      type="button"
                      onClick={() => onDetachClick(item.id, item.resource.title)}
                      title="Detașează resursa din această sesiune"
                      className="w-7 h-7 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center text-xs font-bold transition cursor-pointer shadow-2xs"
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
