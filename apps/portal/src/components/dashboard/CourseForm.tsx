"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Course = {
  id?: number;
  name?: string | null;
  description?: string | null;
  active?: boolean | null;
};

type Props = {
  course: Course | null;
  onClose: () => void;
};

export function CourseFormDrawer({ course, onClose }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!course?.id;

  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [active, setActive] = useState(course?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.course.create.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const update = trpc.course.update.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      update.mutate({ id: course!.id!, name, description, active });
    } else {
      create.mutate({ name, description, active });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEditing ? "Editează curs" : "Curs nou"}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nume</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Activ</span>
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
