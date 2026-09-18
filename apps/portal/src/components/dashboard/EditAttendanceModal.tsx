"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon } from "@/components/ui/icons";

export type EditAttendanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  studentId: number;
  studentName: string;
  date: string;
  initialStatus: "present" | "absent" | "late" | "excused";
  initialComment?: string | null;
  onSaved: () => void;
};

const STATUS_OPTIONS: {
  value: "present" | "absent" | "late" | "excused";
  label: string;
  activeColor: string;
}[] = [
  { value: "present", label: "Prezent", activeColor: "bg-emerald-600 text-white shadow-xs" },
  { value: "absent", label: "Absent", activeColor: "bg-rose-600 text-white shadow-xs" },
  { value: "late", label: "Întârziat", activeColor: "bg-amber-500 text-white shadow-xs" },
  { value: "excused", label: "Motivat", activeColor: "bg-blue-600 text-white shadow-xs" },
];

const PRESET_COMMENTS = ["Bolnav", "Familie", "Avertizat", "Motivat", "Fără motiv"];

export function EditAttendanceModal({
  isOpen,
  onClose,
  groupId,
  studentId,
  studentName,
  date,
  initialStatus,
  initialComment,
  onSaved,
}: EditAttendanceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"present" | "absent" | "late" | "excused">(initialStatus);
  const [comment, setComment] = useState(initialComment || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus);
      setComment(initialComment || "");
      setError(null);
    }
  }, [isOpen, initialStatus, initialComment]);

  const updateMutation = trpc.attendance.updateCell.useMutation({
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "A apărut o eroare la salvarea prezenței.");
    },
  });

  if (!mounted || !isOpen) return null;

  const handleSave = () => {
    setError(null);
    updateMutation.mutate({
      groupId,
      studentId,
      date,
      status,
      comment: comment.trim() || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Modificare Prezență
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {studentName} • Sesiunea din {date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Statut Prezență
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg text-center transition active:scale-95 ${
                    status === opt.value
                      ? opt.activeColor
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment / Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Motiv / Comentariu
            </label>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COMMENTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setComment(preset)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    comment === preset
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adaugă un comentariu sau motiv..."
              rows={3}
              className="w-full text-xs text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Se salvează..." : "Salvează Modificarea"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
