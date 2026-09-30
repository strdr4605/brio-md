"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { PermissionCreateForm } from "@/components/dashboard/PermissionCreateForm";

export default function PermissionsPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";

  const utils = trpc.useUtils();
  const { data: definitions = [], isLoading } = trpc.permissionDefinition.list.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheckIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu ai permisiuni suficiente pentru a gestiona permisiunile sistemului.
        </p>
      </div>
    );
  }

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
    updateMutation.mutate({ id, label: editLabel, description: editDesc || undefined });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Permisiuni & Privilegii
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                {definitions.length} definiții
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestionează definițiile permisiunilor de securitate și acces în cadrul tenant-ului.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all active:scale-[0.99] self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Adaugă Permisiune</span>
        </button>
      </div>

      {/* Creation Drawer / Card */}
      {showForm && (
        <PermissionCreateForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 animate-pulse">
          <p className="text-sm font-semibold text-slate-400">Se încarcă permisiunile...</p>
        </div>
      ) : definitions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <p className="text-sm font-semibold text-slate-500">Nu există permisiuni definite în sistem.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {definitions.map((def) => (
              <div key={def.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                {editingId === def.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Etichetă</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Descriere</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                    {updateMutation.error && (
                      <p className="text-rose-600 text-xs font-medium">{updateMutation.error.message}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(def.id)}
                        disabled={updateMutation.isPending}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
                      >
                        Salvează
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {def.key}
                      </span>
                      <p className="font-semibold text-sm text-slate-900 mt-1.5">{def.label}</p>
                      {def.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(def)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Sigur ștergi această permisiune?")) {
                            deleteMutation.mutate({ id: def.id });
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Cheie Identificator</th>
                  <th className="px-5 py-3.5">Etichetă</th>
                  <th className="px-5 py-3.5">Descriere</th>
                  <th className="px-5 py-3.5 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {definitions.map((def) => (
                  <tr key={def.id} className="hover:bg-slate-50/50 transition">
                    {editingId === def.id ? (
                      <>
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">{def.key}</td>
                        <td className="px-5 py-3.5">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(def.id)}
                              disabled={updateMutation.isPending}
                              className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
                            >
                              Salvează
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              Anulează
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            {def.key}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{def.label}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {def.description || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(def)}
                              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              Editează
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Sigur ștergi această permisiune?")) {
                                  deleteMutation.mutate({ id: def.id });
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Șterge permisiune"
                              aria-label="Șterge"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
