"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Role = "teacher" | "admin" | "superadmin";

type FormData = {
  name: string;
  email: string;
  password: string;
  role: Role;
  schoolId: number | null;
  permissions: string[];
  active: boolean;
};

export type UserFormUser = {
  id?: number;
  name?: string;
  email?: string | null;
  role?: string | null;
  schoolId?: number | null;
  permissions?: string[] | null;
  active?: boolean | null;
};

type Props = {
  user: UserFormUser | null;
  schools: { id: number; name: string }[];
  isSuperAdmin: boolean;
  onClose: () => void;
  currentUserSchoolId?: number;
};

export function UserFormDrawer({
  user,
  schools,
  isSuperAdmin,
  onClose,
  currentUserSchoolId,
}: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!user?.id;

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      onClose();
    },
  });

  const { data: permissionDefs = [] } = trpc.permissionDefinition.list.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      onClose();
    },
  });

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: (user?.role as Role) || "teacher",
    schoolId: user?.schoolId || currentUserSchoolId || null,
    permissions: user?.permissions || [],
    active: user?.active ?? true,
  });

  const canSelectSchool = isSuperAdmin;
  const canSelectRole = isSuperAdmin;

  const togglePermission = (key: string) => {
    setFormData((prev) => {
      const current = prev.permissions;
      if (current.includes(key)) {
        return { ...prev, permissions: current.filter((p) => p !== key) };
      }
      return { ...prev, permissions: [...current, key] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const { password, ...fields } = formData;
      updateMutation.mutate({
        id: user.id!,
        ...fields,
        ...(password ? { password } : {}),
      });
    } else {
      const { active: _active, ...fields } = formData;
      createMutation.mutate(fields);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Full-viewport backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel with pinned header, scrollable body, and pinned footer */}
      <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Pinned */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Editează Utilizator" : "Adaugă Utilizator"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? "Actualizează datele contului și permisiunile" : "Creează un nou cont de utilizator"}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Închide"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nume</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {isEditing ? (
              <div>
                <label className="block text-sm font-medium mb-1">Parolă</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Introdu nouă parolă sau lasă gol"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Parolă</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {canSelectRole && (
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="teacher">Profesor</option>
                  <option value="admin">Admin Şcoală</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            )}

            {canSelectSchool && (
              <div>
                <label className="block text-sm font-medium mb-1">Şcoală</label>
                <select
                  value={formData.schoolId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolId: Number(e.target.value) || null })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selectează şcoală</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSuperAdmin && permissionDefs.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Permisiuni</label>
                <div className="space-y-2">
                  {permissionDefs.map((def) => (
                    <label
                      key={def.key}
                      className="flex items-start gap-3 min-h-[44px] py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(def.key)}
                        onChange={() => togglePermission(def.key)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">{def.label}</p>
                        {def.description && (
                          <p className="text-xs text-neutral-500">{def.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm font-medium">Activ</span>
              </label>
            </div>

            {createMutation.error && (
              <p className="text-red-600 text-sm">{createMutation.error.message}</p>
            )}
            {updateMutation.error && (
              <p className="text-red-600 text-sm">{updateMutation.error.message}</p>
            )}

        </form>

        {/* Footer - Pinned at Bottom */}
        <div className="p-4 px-6 border-t border-slate-200/80 bg-slate-50/95 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition"
          >
            Anulează
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isPending}
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 rounded-xl transition disabled:opacity-50"
          >
            {isPending
              ? "Se procesează..."
              : isEditing
              ? "Salvează Modificările"
              : "Creează Utilizator"}
          </button>
        </div>
      </div>
    </div>
  );
}
