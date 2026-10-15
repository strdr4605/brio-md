"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import { PermissionCreateForm } from "@/components/dashboard/PermissionCreateForm";

export type PermissionDefinitionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PermissionDefinitionsDrawer({
  isOpen,
  onClose,
}: PermissionDefinitionsDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const utils = trpc.useUtils();
  const { data: definitions = [], isLoading } = trpc.permissionDefinition.list.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const updateMutation = trpc.permissionDefinition.update.useMutation({
    onSuccess: () => {
      utils.permissionDefinition.list.invalidate();
      setEditingId(null);
      setEditLabel("");
      setEditDesc("");
    },
  });

  const deleteMutation = trpc.permissionDefinition.delete.useMutation({
    onSuccess: () => utils.permissionDefinition.list.invalidate(),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleEdit = (def: (typeof definitions)[number]) => {
    setEditingId(def.id);
    setEditLabel(def.label);
    setEditDesc(def.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditDesc("");
  };

  const handleSaveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      label: editLabel,
      description: editDesc || undefined,
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-drawer-title"
      className="fixed inset-0 z-[100] flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Header - Pinned */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="permission-drawer-title"
                  className="text-base font-bold text-slate-900 leading-tight"
                >
                  Definiții Permisiuni
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                  {definitions.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dicționar permisiuni și etichete sistem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Adaugă</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Închide"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showForm && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <PermissionCreateForm
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              Se încarcă definițiile permisiunilor...
            </div>
          ) : definitions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Nu există permisiuni definite în sistem.
            </div>
          ) : (
            <div className="space-y-3">
              {definitions.map((def) => (
                <div
                  key={def.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  {editingId === def.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Etichetă
                        </label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Descriere
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                        />
                      </div>
                      {updateMutation.error && (
                        <p className="text-rose-600 text-xs font-medium">
                          {updateMutation.error.message}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(def.id)}
                          disabled={updateMutation.isPending}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          Salvează
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                            {def.key}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-slate-900 mt-1.5">
                          {def.label}
                        </p>
                        {def.description && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {def.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(def)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                        >
                          Editează
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Sigur doriți să ștergeți permisiunea "${def.label}" (${def.key})?`
                              )
                            ) {
                              deleteMutation.mutate({ id: def.id });
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Șterge permisiune"
                          aria-label="Șterge"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pinned */}
        <div className="p-4 px-6 border-t border-slate-200/80 bg-slate-50/95 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition"
          >
            Închide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
