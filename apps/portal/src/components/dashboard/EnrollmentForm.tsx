"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Props = {
  groupId: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function EnrollmentFormDrawer({ groupId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.student.list.useQuery();
  const [studentId, setStudentId] = useState<number | "">("");
  const [type, setType] = useState<"course" | "camp">("course");
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      utils.enrollment.listByGroup.invalidate({ groupId });
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Înscrie elev</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              studentId: Number(studentId),
              groupId,
              type,
              price,
              startDate,
              notes: notes || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Elev</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege elev</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tip</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "course" | "camp")}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="course">Curs</option>
              <option value="camp">Tabără</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preț (bani)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
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
              Înscrie
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
