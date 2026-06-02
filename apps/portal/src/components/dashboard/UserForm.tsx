"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Role = "teacher" | "admin" | "superadmin";

interface FormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  schoolId: number | null;
  permissions: string[];
  active: boolean;
}

export interface UserFormUser {
  id?: number;
  name?: string;
  email?: string | null;
  role?: string | null;
  schoolId?: number | null;
  permissions?: string[] | null;
  active?: boolean | null;
}

interface Props {
  user: UserFormUser | null;
  schools: { id: number; name: string }[];
  isSuperAdmin: boolean;
  onClose: () => void;
  currentUserSchoolId?: number;
}

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

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? "Editează Utilizator" : "Adaugă Utilizator"}
            </h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type="text"
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
                  type="text"
                  required
                  minLength={6}
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

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Se salvează..."
                  : isEditing
                    ? "Salvează Modificările"
                    : "Creează Utilizator"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
