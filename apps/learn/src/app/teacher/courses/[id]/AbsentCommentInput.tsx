"use client";

import { useState } from "react";

type Props = {
  comment?: string | null;
  onSaveComment: (comment: string | null) => void;
  disabled?: boolean;
  studentName: string;
};

const PRESET_REASONS = [
  "Motive medicale",
  "Motive familiale",
  "Fără răspuns",
  "Concurs / Proiect",
];

export function AbsentCommentInput({
  comment,
  onSaveComment,
  disabled = false,
  studentName,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment || "");

  const handleSave = () => {
    const trimmed = text.trim();
    onSaveComment(trimmed.length > 0 ? trimmed : null);
    setIsEditing(false);
  };

  const handleSelectPreset = (reason: string) => {
    setText(reason);
    onSaveComment(reason);
    setIsEditing(false);
  };

  const handleRemove = () => {
    setText("");
    onSaveComment(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setText(comment || "");
      setIsEditing(false);
    }
  };

  // If not editing and a comment is already saved:
  if (!isEditing && comment) {
    return (
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Motiv absență:
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-rose-50 text-rose-800 border border-rose-200 font-medium">
          <span>„{comment}”</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              title="Șterge comentariul"
              className="text-rose-400 hover:text-rose-700 ml-1 cursor-pointer transition font-bold"
            >
              ✕
            </button>
          )}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setText(comment);
              setIsEditing(true);
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline decoration-slate-300 transition cursor-pointer"
          >
            Modifică
          </button>
        )}
      </div>
    );
  }

  // If not editing and no comment is saved: show subtle trigger button
  if (!isEditing && !comment) {
    return (
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
          title={`Adaugă motivul absenței pentru ${studentName}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Adaugă motiv absență (opțional)</span>
        </button>
      </div>
    );
  }

  // Editing mode:
  return (
    <div className="pt-2.5 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-150">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Motivul absenței:
        </label>
        <div className="flex items-center gap-1">
          {PRESET_REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset)}
              className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="ex. A sunat părintele, răcit, plecat din localitate..."
          maxLength={250}
          autoFocus
          className="flex-1 px-3 py-1.5 rounded-[4px] border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={handleSave}
          className="px-3 py-1.5 rounded-[4px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-2xs transition cursor-pointer flex items-center gap-1"
        >
          <span>Salvează</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setText(comment || "");
            setIsEditing(false);
          }}
          className="px-2.5 py-1.5 rounded-[4px] border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
        >
          Anulează
        </button>
      </div>
    </div>
  );
}
