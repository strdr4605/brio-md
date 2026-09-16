"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon } from "@/components/ui/icons";
import { detectGroupConflicts } from "@/lib/scheduleConflicts";

export type GroupItem = {
  id: number;
  courseId: number;
  courseName?: string;
  schoolId?: number | null;
  name: string;
  scheduleDays: string[] | null;
  scheduleTime: string | null;
  room: string | null;
  teacherId: number | null;
  teacherName?: string | null;
  active: boolean | null;
  studentCount?: number;
};

type GroupFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  schoolId?: number | null;
  groupToEdit?: GroupItem | null;
  onSaved?: () => void;
};

const DAYS_OF_WEEK = [
  { key: "mon", label: "Luni", short: "Lu" },
  { key: "tue", label: "Marți", short: "Ma" },
  { key: "wed", label: "Miercuri", short: "Mi" },
  { key: "thu", label: "Joi", short: "Jo" },
  { key: "fri", label: "Vineri", short: "Vi" },
  { key: "sat", label: "Sâmbătă", short: "Sâ" },
  { key: "sun", label: "Duminică", short: "Du" },
];

const TIME_PRESETS = ["09:00 - 10:30", "14:00 - 15:30", "16:00 - 17:30", "17:30 - 18:30", "18:30 - 20:00"];

export function GroupFormModal({
  isOpen,
  onClose,
  courseId,
  schoolId,
  groupToEdit,
  onSaved,
}: GroupFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [room, setRoom] = useState("");
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Populate or reset form on open/edit change
  useEffect(() => {
    if (isOpen) {
      setName(groupToEdit?.name || "");
      setScheduleDays(groupToEdit?.scheduleDays || []);
      setScheduleTime(groupToEdit?.scheduleTime || "");
      setRoom(groupToEdit?.room || "");
      setTeacherId(groupToEdit?.teacherId || "");
      setActive(groupToEdit ? groupToEdit.active !== false : true);
      setError(null);
    }
  }, [isOpen, groupToEdit]);

  const utils = trpc.useUtils();

  const { data: usersList = [] } = trpc.user.list.useQuery(
    { active: true, limit: 100 },
    { enabled: isOpen }
  );
  const teacherOptions = usersList.filter(
    (u) => u.role === "teacher" || u.role === "admin" || u.role === "superadmin"
  );

  const { data: schoolGroups = [] } = trpc.group.list.useQuery(
    { schoolId: schoolId || undefined, active: true },
    { enabled: isOpen }
  );

  const liveConflicts = useMemo(() => {
    if (!isOpen) return [];
    return detectGroupConflicts({
      name,
      courseId,
      excludeGroupId: groupToEdit?.id,
      room,
      teacherId: typeof teacherId === "number" ? teacherId : null,
      scheduleDays,
      scheduleTime,
      existingGroups: schoolGroups,
    });
  }, [isOpen, name, courseId, groupToEdit?.id, room, teacherId, scheduleDays, scheduleTime, schoolGroups]);

  const onMutationSuccess = () => {
    utils.group.invalidate();
    onSaved?.();
    onClose();
  };

  const createMutation = trpc.group.create.useMutation({
    onSuccess: onMutationSuccess,
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.group.update.useMutation({
    onSuccess: onMutationSuccess,
    onError: (err) => setError(err.message),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const toggleDay = (key: string) => {
    setScheduleDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Numele grupei este obligatoriu.");
      return;
    }
    if (liveConflicts.length > 0) {
      setError(liveConflicts[0].message);
      return;
    }

    const payload = {
      name: name.trim(),
      scheduleDays,
      scheduleTime: scheduleTime.trim() || null,
      room: room.trim() || null,
      teacherId: typeof teacherId === "number" ? teacherId : null,
      active,
    };

    if (groupToEdit) {
      updateMutation.mutate({ id: groupToEdit.id, ...payload });
    } else {
      createMutation.mutate({ courseId, schoolId: schoolId || undefined, ...payload });
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {groupToEdit ? "Editează Grupa" : "Creează o nouă grupă"}
            </h2>
            <p className="text-xs text-neutral-500">
              Configurează programul, sala și profesorul grupei
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {liveConflicts.map((c, i) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">⚠️</span>
              <span>{c.message}</span>
            </div>
          ))}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Nume Grupă <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Grupa A - Începători, Grupa 101"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Days of Week Multi-select */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Zile de desfășurare
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const selected = scheduleDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      selected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    <span>{day.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Time Slot */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Interval Orar
            </label>
            <input
              type="text"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              placeholder="ex: 17:30 - 18:30 sau 10:00 - 11:30"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {/* Quick Time Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setScheduleTime(preset)}
                  className="px-2 py-0.5 text-[11px] rounded bg-neutral-100 text-neutral-500 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Room / Building */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Sală / Clădire / Club
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="ex: Sala 204, Corpul B sau Clubul Principal"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Assigned Teacher */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Profesor Asignat
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">-- Fără profesor alocat --</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </div>

          {/* Active status toggle (especially in edit mode) */}
          {groupToEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                id="group-active-toggle"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="group-active-toggle" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Grupă activă (debifează pentru arhivare)
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting || liveConflicts.length > 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{groupToEdit ? "Salvează Modificările" : "Creează Grupa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
