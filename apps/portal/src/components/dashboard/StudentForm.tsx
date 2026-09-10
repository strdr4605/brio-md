"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export type StudentFormStudent = {
  id?: number;
  name?: string;
  phone?: string | null;
  schoolId?: number | null;
  parentName?: string | null;
  parentPhone?: string | null;
  info?: string | null;
  active?: boolean | null;
};

type Props = {
  student: StudentFormStudent | null;
  schools: { id: number; name: string }[];
  isSuperAdmin: boolean;
  onClose: () => void;
  currentUserSchoolId?: number;
};

export function StudentFormDrawer({
  student,
  schools,
  isSuperAdmin,
  onClose,
  currentUserSchoolId,
}: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!student?.id;

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [parentPhoneError, setParentPhoneError] = useState<string | null>(null);

  const createMutation = trpc.student.create.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      onClose();
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la salvare");
    },
  });

  const updateMutation = trpc.student.update.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      onClose();
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la salvare");
    },
  });

  const [formData, setFormData] = useState({
    name: student?.name || "",
    phone: student?.phone || "",
    schoolId: student?.schoolId || currentUserSchoolId || null,
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    info: student?.info || "",
    active: student?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (formData.phone && !isValidPhone(formData.phone)) {
      setPhoneError("Format invalid. Exemplu: +373 69 000 000, +40 712 345 678 sau 069000000");
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (formData.parentPhone && !isValidPhone(formData.parentPhone)) {
      setParentPhoneError("Format invalid. Exemplu: +373 69 000 000, +40 712 345 678 sau 069000000");
      hasError = true;
    } else {
      setParentPhoneError(null);
    }

    if (hasError) return;

    const normalizedPhone = formData.phone ? normalizePhone(formData.phone) : null;
    const normalizedParentPhone = formData.parentPhone ? normalizePhone(formData.parentPhone) : null;

    if (isEditing) {
      updateMutation.mutate({
        id: student.id!,
        name: formData.name,
        phone: normalizedPhone,
        schoolId: isSuperAdmin ? formData.schoolId : undefined,
        parentName: formData.parentName || null,
        parentPhone: normalizedParentPhone,
        info: formData.info || null,
        active: formData.active,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        phone: normalizedPhone,
        schoolId: formData.schoolId,
        parentName: formData.parentName || null,
        parentPhone: normalizedParentPhone,
        info: formData.info || null,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? "Editează Student" : "Adaugă Student"}
            </h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nume elev *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ion Popescu"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (phoneError) setPhoneError(null);
                }}
                onBlur={() => {
                  if (formData.phone && !isValidPhone(formData.phone)) {
                    setPhoneError("Format invalid. Exemplu: +373 69 000 000, +40 712 345 678 sau 069000000");
                  }
                }}
                placeholder="Ex: +373 69 000 000 sau +40 712 345 678"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  phoneError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium mb-1">Școală</label>
                <select
                  value={formData.schoolId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolId: Number(e.target.value) || null })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectează școală</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Nume părinte</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Ex: Maria Popescu"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefon părinte</label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => {
                  setFormData({ ...formData, parentPhone: e.target.value });
                  if (parentPhoneError) setParentPhoneError(null);
                }}
                onBlur={() => {
                  if (formData.parentPhone && !isValidPhone(formData.parentPhone)) {
                    setParentPhoneError("Format invalid. Exemplu: +373 69 000 000, +40 712 345 678 sau 069000000");
                  }
                }}
                placeholder="Ex: +373 68 000 000 sau +40 712 345 678"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  parentPhoneError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              {parentPhoneError && <p className="text-red-500 text-xs mt-1">{parentPhoneError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notițe / Informații</label>
              <textarea
                rows={3}
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                placeholder="Detalii adiționale despre elev..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isEditing && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium">Activ</span>
                </label>
              </div>
            )}

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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Se salvează..."
                  : isEditing
                    ? "Salvează Modificările"
                    : "Creează Student"}
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
