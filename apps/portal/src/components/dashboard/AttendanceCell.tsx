"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/ui/icons";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | null;

type AttendanceCellProps = {
  studentId: number;
  date: string;
  isToday: boolean;
  status: AttendanceStatus;
  comment?: string | null;
  studentName: string;
  onUpdate: (status: AttendanceStatus, comment?: string | null) => void;
};

export function AttendanceCell({
  status,
  comment,
  studentName,
  date,
  isToday,
  onUpdate,
}: AttendanceCellProps) {
  const [mounted, setMounted] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [noteText, setNoteText] = useState(comment || "");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(status);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setPortalTarget(document.fullscreenElement || document.body);

    const handleFullscreenChange = () => {
      setPortalTarget(document.fullscreenElement || document.body);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    setNoteText(comment || "");
  }, [comment]);

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!popoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopoverOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popoverOpen]);

  // Fast 1-click & 2-click cycle: null -> present -> absent -> null (only enabled for today)
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!isToday || popoverOpen) return;

    if (!status) {
      // 1 click: Green Present
      onUpdate("present", comment);
    } else if (status === "present") {
      // 2 clicks: Red Absent
      onUpdate("absent", comment);
    } else {
      // 3 clicks: Clear back to unmarked
      onUpdate(null, null);
    }
  };

  // Right click opens comment / status modal (only enabled for today)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isToday) return;

    // Resolve current fullscreen container so portal is inside fullscreen top layer
    setPortalTarget(document.fullscreenElement || document.body);
    setSelectedStatus(status || "absent");
    setNoteText(comment || "");
    setPopoverOpen(true);
  };

  const handleSaveNote = () => {
    onUpdate(selectedStatus || status || "absent", noteText.trim() || null);
    setPopoverOpen(false);
  };

  return (
    <div
      className={`relative h-9 flex items-center justify-center p-0.5 select-none transition-colors border-r border-slate-200/80 ${
        isToday ? "bg-blue-50/20" : ""
      }`}
      onContextMenu={handleContextMenu}
    >
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        aria-disabled={!isToday}
        tabIndex={isToday ? 0 : -1}
        title={
          !isToday
            ? status
              ? `${status.toUpperCase()}: ${comment || "Fără comentariu"}\n(Arhivă: doar ziua de astăzi (${date}) se poate edita)`
              : `Arhivă (${date}): doar prezența de astăzi poate fi marcată`
            : status
              ? `${status.toUpperCase()}: ${comment || "Fără comentariu"}\n(Click pentru a schimba, click dreapta pentru notă)`
              : "Click: Prezent (P) | 2x: Absent (A) | Click dreapta: Notă"
        }
        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all relative ${
          isToday ? "cursor-pointer" : "cursor-not-allowed opacity-80 select-none"
        } ${
          status === "present"
            ? `bg-emerald-600 text-white shadow-xs ${isToday ? "hover:bg-emerald-700 active:scale-95" : ""}`
            : status === "absent"
              ? `bg-rose-600 text-white shadow-xs ${isToday ? "hover:bg-rose-700 active:scale-95" : ""}`
              : status === "late"
                ? `bg-amber-500 text-white shadow-xs ${isToday ? "hover:bg-amber-600 active:scale-95" : ""}`
                : status === "excused"
                  ? `bg-blue-600 text-white shadow-xs ${isToday ? "hover:bg-blue-700 active:scale-95" : ""}`
                  : isToday
                    ? "text-slate-300 hover:text-slate-700 hover:bg-slate-100/90 active:scale-95 font-medium"
                    : "text-slate-200 font-medium"
        }`}
      >
        {status === "present" && "P"}
        {status === "absent" && "A"}
        {status === "late" && "Î"}
        {status === "excused" && "M"}
        {!status && "•"}

        {/* Note indicator dot */}
        {Boolean(comment) && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white shadow-2xs" />
        )}
      </button>

      {/* Note & Advanced Status Modal Dialog (Portal target supports HTML5 fullscreen & regular view) */}
      {popoverOpen &&
        mounted &&
        portalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setPopoverOpen(false)}
          >
            <div
              ref={popoverRef}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-left animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[220px]">
                    {studentName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>{date}</span>
                    {isToday && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 rounded">
                        Astăzi
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  aria-label="Închide"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Quick status buttons */}
              <div className="space-y-1 mb-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Stare prezență
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("present")}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      selectedStatus === "present"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Prezent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("absent")}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      selectedStatus === "absent"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("late")}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      selectedStatus === "late"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Întârziat
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("excused")}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      selectedStatus === "excused"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    Motivat
                  </button>
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Motiv / Notă
                </label>
                <textarea
                  rows={3}
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSaveNote();
                    }
                  }}
                  placeholder="Ex: Bolnav, învoit de părinți, concurs..."
                  className="w-full p-2.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 text-right">
                  Apasă <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Ctrl+Enter</kbd> pentru salvare
                </p>
              </div>

              {/* Popover Actions */}
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onUpdate(null, null);
                    setPopoverOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-1 py-1"
                >
                  Șterge
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition active:scale-95"
                  >
                    Salvează
                  </button>
                </div>
              </div>
            </div>
          </div>,
          portalTarget
        )}
    </div>
  );
}
