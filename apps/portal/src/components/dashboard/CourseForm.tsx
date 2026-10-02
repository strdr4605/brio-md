"use client";

import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";

export type CourseMaterialItem = {
  id?: number;
  title: string;
  type: "manual" | "textbook" | "link" | "file";
  url: string;
};

export type CourseFormData = {
  id?: number;
  name: string;
  description?: string | null;
  level: "beginner" | "intermediate" | "advanced";
  totalSessions: number;
  sessionDurationMinutes: number;
  scheduleDays: string[];
  scheduleTime?: string | null;
  teacherId?: number | null;
  schoolId?: number | null;
  active: boolean;
  materials?: CourseMaterialItem[];
};

type Props = {
  courseId: number | null;
  onClose: () => void;
  currentUserSchoolId?: number | null;
};

const DAYS_OF_WEEK = [
  { id: "mon", label: "Luni" },
  { id: "tue", label: "Marți" },
  { id: "wed", label: "Miercuri" },
  { id: "thu", label: "Joi" },
  { id: "fri", label: "Vineri" },
  { id: "sat", label: "Sâmbătă" },
  { id: "sun", label: "Duminică" },
];

const courseSchema = z.object({
  name: z.string().trim().min(1, "Numele cursului este obligatoriu"),
  totalSessions: z.number().int().min(1, "Numărul de sesiuni trebuie să fie cel puțin 1"),
  sessionDurationMinutes: z.number().int().min(1, "Durata sesiunii trebuie să fie cel puțin 1 minut"),
  materials: z.array(
    z.object({
      title: z.string().trim().min(1, "Titlul materialului este obligatoriu"),
      type: z.enum(["manual", "textbook", "link", "file"]),
      url: z.string().trim().url("URL-ul materialului trebuie să fie valid (ex. https://...)"),
    }),
  ),
});

export function CourseFormDrawer({ courseId, onClose, currentUserSchoolId }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!courseId;

  const { data: existingCourse, isLoading: isLoadingCourse } = trpc.course.getById.useQuery(
    { id: courseId! },
    { enabled: isEditing },
  );

  const { data: teachers = [] } = trpc.user.list.useQuery({ role: "teacher" });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [totalSessions, setTotalSessions] = useState(12);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [active, setActive] = useState(true);
  const [materials, setMaterials] = useState<CourseMaterialItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existingCourse) {
      setName(existingCourse.name);
      setDescription(existingCourse.description || "");
      setLevel(
        (existingCourse.level as "beginner" | "intermediate" | "advanced") || "beginner",
      );
      setTotalSessions(existingCourse.totalSessions || 1);
      setSessionDurationMinutes(existingCourse.sessionDurationMinutes || 60);
      setScheduleDays(existingCourse.scheduleDays || []);
      if (existingCourse.scheduleTime) {
        const parts = existingCourse.scheduleTime.split(" - ");
        setStartTime(parts[0] || "");
        setEndTime(parts[1] || "");
      }
      setTeacherId(existingCourse.teacherId ?? null);
      setActive(existingCourse.active ?? true);
      setMaterials(
        existingCourse.materials.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type as "manual" | "textbook" | "link" | "file",
          url: m.url,
        })),
      );
    }
  }, [existingCourse]);

  const createMutation = trpc.course.create.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.course.update.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      if (courseId) utils.course.getById.invalidate({ id: courseId });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const addMaterial = () => {
    setMaterials((prev) => [...prev, { title: "", type: "manual", url: "" }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: keyof CourseMaterialItem, value: string) => {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = courseSchema.safeParse({
      name,
      totalSessions: Number(totalSessions),
      sessionDurationMinutes: Number(sessionDurationMinutes),
      materials,
    });

    if (!validation.success) {
      setError(validation.error.issues?.[0]?.message || "Datele introduse sunt invalide.");
      return;
    }

    const scheduleTime =
      startTime && endTime
        ? `${startTime} - ${endTime}`
        : startTime || endTime || null;

    if (isEditing) {
      updateMutation.mutate({
        id: courseId!,
        name,
        description: description || null,
        level,
        totalSessions: Number(totalSessions),
        sessionDurationMinutes: Number(sessionDurationMinutes),
        scheduleDays,
        scheduleTime,
        teacherId: teacherId || null,
        active,
        materials: materials.map((m, idx) => ({
          title: m.title,
          type: m.type,
          url: m.url,
          orderIndex: idx,
        })),
      });
    } else {
      createMutation.mutate({
        name,
        description: description || null,
        level,
        totalSessions: Number(totalSessions),
        sessionDurationMinutes: Number(sessionDurationMinutes),
        scheduleDays,
        scheduleTime,
        teacherId: teacherId || null,
        schoolId: currentUserSchoolId || null,
        active,
        materials: materials.map((m, idx) => ({
          title: m.title,
          type: m.type,
          url: m.url,
          orderIndex: idx,
        })),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Full-viewport backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel with pinned header, scrollable body, and pinned sticky footer */}
      <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Pinned */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Editează Curs" : "Adaugă Curs"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? "Actualizează detaliile cursului, orarul și materialele" : "Configurează un nou curs academic"}
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
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingCourse ? (
            <div className="py-12 text-center text-slate-400 text-sm">Se încarcă datele cursului...</div>
          ) : (
            <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Informații Generale */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Informații Generale
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nume curs *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Robotică & Programare A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Descriere</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrierea cursului și obiectivele de învățare..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nivel dificultate *</label>
                  <select
                    value={level}
                    onChange={(e) =>
                      setLevel(e.target.value as "beginner" | "intermediate" | "advanced")
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                  >
                    <option value="beginner">Începător (Beginner)</option>
                    <option value="intermediate">Mediu (Intermediate)</option>
                    <option value="advanced">Avansat (Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Sesiuni & Durată */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Sesiuni & Durată
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total sesiuni *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalSessions}
                      onChange={(e) => setTotalSessions(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Durată sesiune (min) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={sessionDurationMinutes}
                      onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Orar / Program */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Program & Orar
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Zile din săptămână</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.id}
                        className={`flex items-center justify-center px-2 py-2 border rounded-xl text-xs font-bold cursor-pointer transition ${
                          scheduleDays.includes(day.id)
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={scheduleDays.includes(day.id)}
                          onChange={() => toggleDay(day.id)}
                          className="sr-only"
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ora început</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ora sfârșit</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Profesor / Instructor */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Profesor Asignat
                </h3>
                <div>
                  <select
                    value={teacherId ?? ""}
                    onChange={(e) =>
                      setTeacherId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                  >
                    <option value="">-- Fără profesor asignat --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Materiale Didactice */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Materiale Didactice
                  </h3>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="text-xs px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 font-semibold transition"
                  >
                    + Adaugă material
                  </button>
                </div>

                {materials.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nu au fost adăugate materiale didactice.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {materials.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50 space-y-2.5"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Titlu material (ex: Ghid Laborator)"
                            value={m.title}
                            onChange={(e) => updateMaterial(idx, "title", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition"
                          />
                          <select
                            value={m.type}
                            onChange={(e) =>
                              updateMaterial(
                                idx,
                                "type",
                                e.target.value as CourseMaterialItem["type"],
                              )
                            }
                            className="w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition"
                          >
                            <option value="manual">Manual</option>
                            <option value="textbook">Manual școlar</option>
                            <option value="link">Link extern</option>
                            <option value="file">Fișier</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeMaterial(idx)}
                            className="text-rose-600 hover:text-rose-700 px-2 text-sm transition"
                            title="Șterge"
                          >
                            🗑
                          </button>
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/material.pdf"
                          value={m.url}
                          onChange={(e) => updateMaterial(idx, "url", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Activ */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded-md text-slate-900 focus:ring-slate-900/20 h-4 w-4 border-slate-300 transition"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Curs activ (vizibil pentru elevi și profesori)
                  </span>
                </label>
              </div>

            </form>
          )}
        </div>

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
            form="course-form"
            disabled={isSaving || isLoadingCourse}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs rounded-xl transition disabled:opacity-50"
          >
            {isSaving ? "Se salvează..." : isEditing ? "Actualizează Curs" : "Creează Curs"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
