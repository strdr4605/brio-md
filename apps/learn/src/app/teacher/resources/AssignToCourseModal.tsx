"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

type ResourceItem = {
  id: number;
  title: string;
  type: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
};

export function AssignToCourseModal({ isOpen, onClose, resource }: Props) {
  const [courseId, setCourseId] = useState<string>("");
  const [sessionNumber, setSessionNumber] = useState<string>("1");
  const [orderIndex, setOrderIndex] = useState<string>("0");

  const utils = trpc.useUtils();

  const { data: courses = [] } = trpc.teacher.getMyCourses.useQuery(undefined, {
    enabled: isOpen,
  });

  const assignMutation = trpc.resource.assignResourceToSession.useMutation({
    onSuccess: () => {
      utils.resource.getResourceAssignments.invalidate();
      handleClose();
    },
  });

  const handleClose = () => {
    setCourseId("");
    setSessionNumber("1");
    setOrderIndex("0");
    assignMutation.reset();
    onClose();
  };

  if (!isOpen || !resource) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    assignMutation.mutate({
      courseId: parseInt(courseId, 10),
      resourceId: resource.id,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : null,
      orderIndex: orderIndex ? parseInt(orderIndex, 10) : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Asignează Resursă la Curs</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
              {resource.title}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {assignMutation.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {assignMutation.error.message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selectează Cursul <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
            >
              <option value="">Alege cursul din lista ta...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.totalSessions} sesiuni)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Număr Sesiune
              </label>
              <input
                type="number"
                min={1}
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                placeholder="Ex: 2"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ordine Afișare
              </label>
              <input
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                placeholder="0"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Resursa va deveni vizibilă elevilor înscriși în acest curs pentru sesiunea specificată.
          </p>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || !courseId}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {assignMutation.isPending ? "Se asignează..." : "Asignează la Curs"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
