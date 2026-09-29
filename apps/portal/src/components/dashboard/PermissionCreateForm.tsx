"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export type PermissionCreateFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function PermissionCreateForm({
  onSuccess,
  onCancel,
}: PermissionCreateFormProps) {
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const utils = trpc.useUtils();
  const createMutation = trpc.permissionDefinition.create.useMutation({
    onSuccess: () => {
      utils.permissionDefinition.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newLabel.trim()) return;
    createMutation.mutate({
      key: newKey.trim(),
      label: newLabel.trim(),
      description: newDesc.trim() || undefined,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-fade-in">
      <h2 className="text-sm font-bold text-slate-900">Definire Permisiune Nouă</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cheie permisiune (cod unic)
          </label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono text-slate-800"
            placeholder="ex: open-front-door"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Etichetă descriptivă
          </label>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
            placeholder="ex: Acces Roletă Intrare"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Descriere rol (opțional)
          </label>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
            placeholder="Permite acționarea releului IoT la intrarea principală..."
          />
        </div>
        {createMutation.error && (
          <p className="text-rose-600 text-xs font-medium">{createMutation.error.message}</p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || !newKey.trim() || !newLabel.trim()}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {createMutation.isPending ? "Se salvează..." : "Salvează"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  );
}
