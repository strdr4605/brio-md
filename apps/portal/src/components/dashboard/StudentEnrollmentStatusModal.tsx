"use client";

import { useState, useEffect } from "react";
import { XIcon } from "@/components/ui/icons";

export type EnrollmentStatusItem = {
  id: number;
  courseName: string;
  groupName: string;
  status: string | null;
  notes?: string | null;
};

export type StudentEnrollmentStatusModalProps = {
  enrollment: EnrollmentStatusItem | null;
  onClose: () => void;
  onSave: (payload: {
    enrollmentId: number;
    status: "active" | "inactive" | "archived" | "completed";
    notes: string | null;
  }) => void;
  isSaving: boolean;
};

export function StudentEnrollmentStatusModal({
  enrollment,
  onClose,
  onSave,
  isSaving,
}: StudentEnrollmentStatusModalProps) {
  const [newStatus, setNewStatus] = useState<
    "active" | "inactive" | "archived" | "completed"
  >("completed");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    if (enrollment) {
      setNewStatus(
        (enrollment.status === "active" ? "completed" : "active") as
          | "active"
          | "inactive"
          | "archived"
          | "completed",
      );
      setStatusNote(enrollment.notes || "");
    }
  }, [enrollment]);

  if (!enrollment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      enrollmentId: enrollment.id,
      status: newStatus,
      notes: statusNote.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Modifică Status Înscriere
            </h3>
            <p className="text-xs text-slate-500">
              {enrollment.courseName} • {enrollment.groupName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status Nou
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
            >
              <option value="active">Activ (Grupă în derulare)</option>
              <option value="completed">Finalizat (A absolvit nivelul cursului)</option>
              <option value="archived">Arhivat (Retras / Trecut în arhivă)</option>
              <option value="inactive">Inactiv (Pauză temporară)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Notă sau Motivare (opțional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              placeholder="Ex: A finalizat modulul cu succes, recomandare pentru nivelul următor..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition disabled:opacity-50"
            >
              {isSaving ? "Se salvează..." : "Salvează Modificările"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
