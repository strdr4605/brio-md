"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, CheckCircleIcon } from "@/components/ui/icons";

export type AbsenceCommentWidgetProps = {
  initialComment?: string | null;
  studentName: string;
  isOpen: boolean;
  onSave: (comment: string) => void;
  onClose: () => void;
};

// Quick preset chips for rapid absence classification
export const ABSENCE_PRESET_CHIPS = [
  { label: "Bolnav", emoji: "🤒", text: "Bolnav" },
  { label: "Avertizat", emoji: "⚠️", text: "Avertizat de părinți" },
  { label: "Nemotivat", emoji: "❌", text: "Nemotivat" },
  { label: "Familie", emoji: "🚗", text: "Motive familiale" },
  { label: "Vacanță", emoji: "🏖️", text: "În vacanță" },
];

/**
 * Absence Comment Popover / Inline Input
 * Allows fast 1-click preset chip selection and freeform text notes when marking a student absent.
 */
export function AbsenceCommentWidget({
  initialComment = "",
  studentName,
  isOpen,
  onSave,
  onClose,
}: AbsenceCommentWidgetProps) {
  const [comment, setComment] = useState(initialComment || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setComment(initialComment || "");
  }, [initialComment]);

  useEffect(() => {
    if (isOpen) {
      // Focus input field automatically when opened
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChipClick = (chipText: string) => {
    if (!comment.trim()) {
      setComment(chipText);
    } else if (!comment.includes(chipText)) {
      setComment(`${comment}; ${chipText}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave(comment.trim());
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 shadow-sm animate-fade-in-down"
      role="dialog"
      aria-label={`Comentariu absență pentru ${studentName}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <span>Notă / Motiv absență:</span>
          <span className="text-amber-700 font-normal truncate max-w-[160px]">
            {studentName}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 transition"
          aria-label="Închide"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        {ABSENCE_PRESET_CHIPS.map((chip) => {
          const isSelected = comment.includes(chip.text);
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 ${
                isSelected
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-amber-200 hover:border-amber-300 hover:bg-amber-50/60"
              }`}
            >
              <span className="text-xs">{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Freeform input and action buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Sunat mama, vine săptămâna viitoare..."
          className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => {
            onSave(comment.trim());
            onClose();
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition active:scale-95 shrink-0"
        >
          <CheckCircleIcon className="w-3.5 h-3.5" />
          <span>Salvează</span>
        </button>
      </div>
    </div>
  );
}
