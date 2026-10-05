"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const inputCls =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition";

  if (!mounted) return null;

  return createPortal(
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nume</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
              />
            </div>

            {isEditing ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parolă</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Introdu nouă parolă sau lasă gol"
                  className={inputCls}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parolă</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}

            {canSelectRole && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className={inputCls}
                >
                  <option value="teacher">Profesor</option>
                  <option value="admin">Admin Şcoală</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            )}

            {canSelectSchool && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Şcoală</label>
                <select
                  value={formData.schoolId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolId: Number(e.target.value) || null })
                  }
                  className={inputCls}
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Permisiuni</label>
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
                        className="mt-1 rounded-md text-slate-900 focus:ring-slate-900/20 border-slate-300 h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{def.label}</p>
                        {def.description && (
                          <p className="text-xs text-slate-500">{def.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded-md text-slate-900 focus:ring-slate-900/20 border-slate-300 h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-800">Activ</span>
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
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs rounded-xl transition disabled:opacity-50"
          >
            {isPending
              ? "Se procesează..."
              : isEditing
              ? "Salvează Modificările"
              : "Creează Utilizator"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
