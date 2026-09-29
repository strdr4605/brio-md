"use client";

import { useState } from "react";

export type CourseGroupQuickCreateFormProps = {
  onSubmit: (data: { name: string; scheduleTime: string | null; room: string | null }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
};

export function CourseGroupQuickCreateForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: CourseGroupQuickCreateFormProps) {
  const [name, setName] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [room, setRoom] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      scheduleTime: scheduleTime.trim() || null,
      room: room.trim() || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-3 animate-fade-in-up"
    >
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
        Creează o nouă grupă pentru acest curs
      </h4>
      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Nume Grupă *
          </label>
          <input
            type="text"
            placeholder="ex: Grupa A - Marți 17:30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Program Orar
          </label>
          <input
            type="text"
            placeholder="ex: 17:30 - 19:00"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Sală / Clădire
          </label>
          <input
            type="text"
            placeholder="ex: Sala 3"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          {isSubmitting ? "Se creează..." : "Salvează Grupa"}
        </button>
      </div>
    </form>
  );
}
