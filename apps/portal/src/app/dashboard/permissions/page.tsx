"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function PermissionsPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";

  const utils = trpc.useUtils();
  const { data: definitions = [], isLoading } = trpc.permissionDefinition.list.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  const createMutation = trpc.permissionDefinition.create.useMutation({
    onSuccess: () => {
      utils.permissionDefinition.list.invalidate();
      setShowForm(false);
      setNewKey("");
      setNewLabel("");
      setNewDesc("");
    },
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
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Permisiuni</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border rounded-lg p-4 shadow">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Cheie</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: open-front-door"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Etichetă</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: Acces Ușă Față"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descriere</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Descrierea permisiunii"
              />
            </div>
            {createMutation.error && (
              <p className="text-red-600 text-sm">{createMutation.error.message}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  createMutation.mutate({
                    key: newKey,
                    label: newLabel,
                    description: newDesc || undefined,
                  })
                }
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Se salvează..." : "Salvează"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewKey("");
                  setNewLabel("");
                  setNewDesc("");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : definitions.length === 0 ? (
        <p className="text-neutral-600">Nu există permisiuni definite.</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {definitions.map((def) => (
              <div key={def.id} className="bg-white border rounded-lg p-4 shadow">
                {editingId === def.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Etichetă</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descriere</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    {updateMutation.error && (
                      <p className="text-red-600 text-sm">{updateMutation.error.message}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(def.id)}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Salvează
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm">{def.key}</p>
                      <p className="text-neutral-700">{def.label}</p>
                      {def.description && (
                        <p className="text-sm text-neutral-500 mt-1">{def.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => handleEdit(def)}
                        className="p-2 text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                        aria-label="Editează"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Sigur ștergi această permisiune?")) {
                            deleteMutation.mutate({ id: def.id });
                          }
                        }}
                        className="p-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
                        aria-label="Șterge"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Cheie</th>
                  <th className="px-4 py-3 text-left">Etichetă</th>
                  <th className="px-4 py-3 text-left">Descriere</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def) => (
                  <tr key={def.id} className="border-t">
                    {editingId === def.id ? (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{def.key}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(def.id)}
                              disabled={updateMutation.isPending}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Salvează
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-neutral-600 hover:underline text-sm"
                            >
                              Anulează
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{def.key}</td>
                        <td className="px-4 py-3">{def.label}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {def.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(def)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Sigur ștergi această permisiune?")) {
                                  deleteMutation.mutate({ id: def.id });
                                }
                              }}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Șterge
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
