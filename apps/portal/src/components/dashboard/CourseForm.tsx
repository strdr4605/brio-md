"use client";

import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? "Editează Curs" : "Adaugă Curs"}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="text-neutral-500 hover:text-neutral-700 text-lg"
            >
              ✕
            </button>
          </div>

          {isLoadingCourse ? (
            <p className="text-neutral-500">Se încarcă datele cursului...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Informații Generale */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
                  Informații Generale
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Nume curs *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Robotică & Programare A1"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descriere</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrierea cursului și obiectivele de învățare..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nivel dificultate *</label>
                  <select
                    value={level}
                    onChange={(e) =>
                      setLevel(e.target.value as "beginner" | "intermediate" | "advanced")
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="beginner">Începător (Beginner)</option>
                    <option value="intermediate">Mediu (Intermediate)</option>
                    <option value="advanced">Avansat (Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Sesiuni & Durată */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
                  Sesiuni & Durată
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total sesiuni *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalSessions}
                      onChange={(e) => setTotalSessions(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Durată sesiune (min) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={sessionDurationMinutes}
                      onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Orar / Program */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
                  Program & Orar
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Zile din săptămână</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.id}
                        className={`flex items-center justify-center px-2 py-1.5 border rounded-lg text-sm cursor-pointer transition ${
                          scheduleDays.includes(day.id)
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                            : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
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
                    <label className="block text-sm font-medium mb-1">Ora început</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ora sfârșit</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Profesor / Instructor */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
                  Profesor Asignat
                </h3>
                <div>
                  <select
                    value={teacherId ?? ""}
                    onChange={(e) =>
                      setTeacherId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
                    Materiale Didactice
                  </h3>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium"
                  >
                    + Adaugă material
                  </button>
                </div>

                {materials.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">
                    Nu au fost adăugate materiale didactice.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {materials.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Titlu material (ex: Ghid Laborator)"
                            value={m.title}
                            onChange={(e) => updateMaterial(idx, "title", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-sm outline-none"
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
                            className="w-32 px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-sm outline-none"
                          >
                            <option value="manual">Manual</option>
                            <option value="textbook">Manual școlar</option>
                            <option value="link">Link extern</option>
                            <option value="file">Fișier</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeMaterial(idx)}
                            className="text-red-500 hover:text-red-700 px-2 text-sm"
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
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-sm outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Activ */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-neutral-800">
                    Curs activ (vizibil pentru elevi și profesori)
                  </span>
                </label>
              </div>

              {/* Butoane Submit / Cancel */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSaving ? "Se salvează..." : isEditing ? "Actualizează Curs" : "Creează Curs"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-neutral-700"
                >
                  Anulează
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
