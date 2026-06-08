"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

type Group = {
  id?: number;
  name?: string | null;
  courseId?: number | null;
  teacherId?: number | null;
  active?: boolean | null;
};

type Props = {
  group: Group | null;
  defaultCourseId?: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function GroupFormDrawer({ group, defaultCourseId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!group?.id;

  const { data: courses = [] } = trpc.course.list.useQuery({ active: true });
  const { data: teachers = [] } = trpc.user.list.useQuery({ role: "teacher", active: true });

  const [courseId, setCourseId] = useState<number | "">(group?.courseId ?? defaultCourseId ?? "");
  const [name, setName] = useState(group?.name ?? "");
  const [teacherId, setTeacherId] = useState<number | "">(group?.teacherId ?? "");
  const [active, setActive] = useState(group?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group?.id) {
      setCourseId(group.courseId ?? "");
      setName(group.name ?? "");
      setTeacherId(group.teacherId ?? "");
      setActive(group.active ?? true);
    }
  }, [group?.id]);

  const create = trpc.group.create.useMutation({
    onSuccess: () => {
      utils.group.list.invalidate();
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.group.update.useMutation({
    onSuccess: () => {
      utils.group.list.invalidate();
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      update.mutate({
        id: group!.id!,
        name,
        teacherId: teacherId === "" ? undefined : Number(teacherId),
        active,
      });
    } else {
      create.mutate({ name, courseId: Number(courseId), teacherId: Number(teacherId), active });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEditing ? "Editează grupă" : "Grupă nouă"}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium mb-1">Curs</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Alege curs</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Nume</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ex. Luni 17:30"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Profesor</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege profesor</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Activă</span>
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? "Salvează" : "Creează"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
