"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  groupId: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function SessionFormDrawer({ groupId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { data: teachers = [] } = trpc.user.list.useQuery({ role: "teacher", active: true });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.groupSession.create.useMutation({
    onSuccess: (row) => {
      utils.groupSession.listByGroup.invalidate({ groupId });
      onSaved?.();
      onClose();
      router.push(`/dashboard/teacher/sessions/${row!.id}/attendance`);
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Lecție nouă</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              groupId,
              date,
              teacherId: teacherId === "" ? undefined : Number(teacherId),
              notes: notes || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Profesor (opțional, înlocuiește)
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— implicit —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Creează lecție
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
