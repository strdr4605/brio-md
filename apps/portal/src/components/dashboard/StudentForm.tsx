"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import {
  detectStudentScheduleConflicts,
  findGroupConflictWithSelected,
} from "@/lib/scheduleConflicts";

export type StudentFormStudent = {
  id?: number;
  name?: string;
  phone?: string | null;
  age?: number | null;
  schoolId?: number | null;
  parentName?: string | null;
  parentPhone?: string | null;
  info?: string | null;
  active?: boolean | null;
  courses?: Array<{ id: number; name: string }>;
};

type Props = {
  student: StudentFormStudent | null;
  schools: { id: number; name: string }[];
  courses?: {
    id: number;
    name: string;
    level?: string | null;
    schoolId?: number | null;
    scheduleDays?: string[] | null;
    scheduleTime?: string | null;
  }[];
  isSuperAdmin: boolean;
  onClose: () => void;
  currentUserSchoolId?: number;
};

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5";

export function StudentFormDrawer({
  student,
  schools,
  courses = [],
  isSuperAdmin,
  onClose,
  currentUserSchoolId,
}: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!student?.id;

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [parentPhoneError, setParentPhoneError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [formData, setFormData] = useState({
    name: student?.name || "",
    phone: student?.phone || "",
    age: student?.age != null ? String(student.age) : "",
    schoolId: student?.schoolId || currentUserSchoolId || null,
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    info: student?.info || "",
    active: student?.active ?? true,
  });

  const currentSchoolId = formData.schoolId || student?.schoolId || currentUserSchoolId;

  // Query groups available for the current school
  const { data: schoolGroups = [] } = trpc.group.list.useQuery(
    { schoolId: currentSchoolId || undefined },
    { enabled: mounted },
  );

  // Query student's active group enrollments if editing
  const { data: currentEnrollments = [] } = trpc.enrollment.getByStudent.useQuery(
    { studentId: student?.id ?? 0 },
    { enabled: mounted && isEditing && Boolean(student?.id) },
  );

  // Map of courseId -> groupId | null
  const [courseGroups, setCourseGroups] = useState<Record<number, number | null>>({});

  useEffect(() => {
    if (currentEnrollments.length > 0) {
      const map: Record<number, number | null> = {};
      for (const enr of currentEnrollments) {
        if (enr.status === "active") {
          map[enr.courseId] = enr.groupId;
        }
      }
      setCourseGroups((prev) => ({ ...map, ...prev }));
    }
  }, [currentEnrollments]);

  const onDone = () => {
    utils.student.list.invalidate();
    if (student?.id) {
      utils.student.getById.invalidate({ id: student.id });
      utils.enrollment.getByStudent.invalidate({ studentId: student.id });
    }
    utils.group.invalidate();
    onClose();
  };
  const onFail = (err: { message?: string }) => alert(err.message || "A apărut o eroare");

  const createMutation = trpc.student.create.useMutation({ onSuccess: onDone, onError: onFail });
  const updateMutation = trpc.student.update.useMutation({ onSuccess: onDone, onError: onFail });
  const deleteMutation = trpc.student.delete.useMutation({ onSuccess: onDone, onError: onFail });

  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>(
    student?.courses?.map((c) => c.id) || [],
  );

  // Filter courses by current school to avoid duplicates across multi-tenant schools
  const filteredCourses = useMemo(() => {
    let list = courses;
    if (currentSchoolId) {
      list = list.filter((c: any) => !c.schoolId || c.schoolId === currentSchoolId);
    }
    const seen = new Set<number>();
    return list.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [courses, currentSchoolId]);

  const courseConflicts = useMemo(() => {
    if (selectedCourseIds.length <= 1) return [];

    const scheduleItems = selectedCourseIds
      .map((courseId) => {
        const course = filteredCourses.find((c) => c.id === courseId);
        if (!course) return null;
        const selectedGroupId = courseGroups[courseId];
        const group = selectedGroupId
          ? schoolGroups.find((g) => g.id === selectedGroupId)
          : null;

        if (group) {
          return {
            courseId: course.id,
            courseName: course.name,
            groupId: group.id,
            groupName: group.name,
            scheduleDays: group.scheduleDays,
            scheduleTime: group.scheduleTime,
          };
        }

        return {
          courseId: course.id,
          courseName: course.name,
          scheduleDays: course.scheduleDays,
          scheduleTime: course.scheduleTime,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return detectStudentScheduleConflicts(scheduleItems);
  }, [selectedCourseIds, filteredCourses, courseGroups, schoolGroups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseConflicts.length > 0) return;
    const phoneErr = "Format invalid. Ex: +373 69 000 000 sau 069000000";
    let hasError = false;

    const hasAnyPhone = formData.phone.trim() !== "" || formData.parentPhone.trim() !== "";
    if (!hasAnyPhone) {
      const requiredMsg = "Introduceți cel puțin un număr de telefon (student sau părinte)";
      setPhoneError(requiredMsg);
      setParentPhoneError(requiredMsg);
      hasError = true;
    } else {
      if (formData.phone && !isValidPhone(formData.phone)) {
        setPhoneError(phoneErr);
        hasError = true;
      } else {
        setPhoneError(null);
      }

      if (formData.parentPhone && !isValidPhone(formData.parentPhone)) {
        setParentPhoneError(phoneErr);
        hasError = true;
      } else {
        setParentPhoneError(null);
      }
    }

    if (hasError) return;

    const chosenGroupIds = Object.values(courseGroups).filter(
      (gid): gid is number => typeof gid === "number" && gid > 0,
    );

    const payload = {
      name: formData.name,
      phone: formData.phone ? normalizePhone(formData.phone) : null,
      age: formData.age.trim() === "" ? null : Number(formData.age),
      parentName: formData.parentName || null,
      parentPhone: formData.parentPhone ? normalizePhone(formData.parentPhone) : null,
      info: formData.info || null,
      courseIds: selectedCourseIds,
      groupIds: chosenGroupIds,
    };

    if (isEditing) {
      updateMutation.mutate({
        ...payload,
        id: student.id!,
        active: formData.active,
        schoolId: isSuperAdmin ? formData.schoolId : undefined,
      });
    } else {
      createMutation.mutate({ ...payload, schoolId: formData.schoolId });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Editează Student" : "Adaugă Student"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? "Actualizează datele elevului și înscrierile" : "Completează datele pentru noul elev"}
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

        <form id="student-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className={labelCls}>Nume elev *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ion Popescu"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelCls} sm:min-h-[2rem] sm:flex sm:items-end`}>
                <span>
                  Telefon student{" "}
                  <span className="text-slate-400 font-normal text-xs normal-case">
                    (sau telefon părinte)*
                  </span>
                </span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (phoneError) setPhoneError(null);
                  if (parentPhoneError) setParentPhoneError(null);
                }}
                onBlur={() => {
                  if (formData.phone && !isValidPhone(formData.phone)) {
                    setPhoneError("Format invalid. Ex: +373 69 000 000 sau 069000000");
                  }
                }}
                placeholder="Ex: +373 69 000 000"
                className={`${inputCls} ${phoneError ? "border-rose-300 focus:ring-rose-500/30 focus:border-rose-500" : ""}`}
              />
              {phoneError && <p className="text-rose-500 text-xs mt-1">{phoneError}</p>}
            </div>

            <div>
              <label className={`${labelCls} sm:min-h-[2rem] sm:flex sm:items-end`}>
                <span>Vârstă (ani)</span>
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Ex: 12"
                className={inputCls}
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className={labelCls}>Școală</label>
              <select
                value={formData.schoolId || ""}
                onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value) || null })}
                className={inputCls}
              >
                <option value="">Selectează școală</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Date Părinte / Tutore
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nume părinte</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Ex: Maria Popescu"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Telefon părinte <span className="text-slate-400 font-normal text-xs">(sau telefon student)*</span>
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, parentPhone: e.target.value });
                    if (phoneError) setPhoneError(null);
                    if (parentPhoneError) setParentPhoneError(null);
                  }}
                  onBlur={() => {
                    if (formData.parentPhone && !isValidPhone(formData.parentPhone)) {
                      setParentPhoneError("Format invalid. Ex: +373 69 000 000 sau 069000000");
                    }
                  }}
                  placeholder="Ex: +373 68 000 000"
                  className={`${inputCls} ${parentPhoneError ? "border-rose-300 focus:ring-rose-500/30 focus:border-rose-500" : ""}`}
                />
                {parentPhoneError && <p className="text-rose-500 text-xs mt-1">{parentPhoneError}</p>}
              </div>
            </div>
          </div>

          {filteredCourses.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div>
                <label className={labelCls}>Cursuri înscrise</label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto">
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourseIds((prev) => {
                            if (prev.includes(course.id)) {
                              setCourseGroups((g) => {
                                const next = { ...g };
                                delete next[course.id];
                                return next;
                              });
                              return prev.filter((id) => id !== course.id);
                            } else {
                              return [...prev, course.id];
                            }
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span>{isSelected ? "✓" : "+"}</span>
                        <span>{course.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group allocation per selected course */}
              {selectedCourseIds.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Alocare Grupe (Opțional)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedCourseIds.length} {selectedCourseIds.length === 1 ? "curs selectat" : "cursuri selectate"}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedCourseIds.map((courseId) => {
                      const course = filteredCourses.find((c) => c.id === courseId);
                      if (!course) return null;
                      const availableForCourse = schoolGroups.filter((g) => g.courseId === courseId);
                      const selectedGroupId = courseGroups[courseId] ?? null;

                      // Other groups selected in different courses
                      const otherSelectedGroups = schoolGroups.filter((sg) =>
                        Object.entries(courseGroups).some(
                          ([cId, gId]) => Number(cId) !== courseId && gId === sg.id,
                        ),
                      );

                      return (
                        <div
                          key={courseId}
                          className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 pb-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate" title={course.name}>
                              {course.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-medium shrink-0">
                              {availableForCourse.length} {availableForCourse.length === 1 ? "grupă" : "grupe"}
                            </span>
                          </div>

                          {availableForCourse.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Nu există grupe active pentru acest curs. (Elevul va fi înscris doar la nivel de curs).
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              <select
                                value={selectedGroupId || ""}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : null;
                                  if (val) {
                                    const candidate = schoolGroups.find((g) => g.id === val);
                                    if (candidate) {
                                      const check = findGroupConflictWithSelected({
                                        candidateGroup: candidate,
                                        selectedGroups: otherSelectedGroups,
                                      });
                                      if (check.hasConflict) return;
                                    }
                                  }
                                  setCourseGroups((prev) => ({
                                    ...prev,
                                    [courseId]: val,
                                  }));
                                }}
                                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                              >
                                <option value="">Fără grupă (doar înscriere la curs)</option>
                                {availableForCourse.map((g) => {
                                  const days = Array.isArray(g.scheduleDays) ? g.scheduleDays.join(", ") : "";
                                  const time = g.scheduleTime || "";
                                  const scheduleStr = [days, time].filter(Boolean).join(" • ");
                                  const isCurrentChoice = selectedGroupId === g.id;
                                  const conflict = findGroupConflictWithSelected({
                                    candidateGroup: g,
                                    selectedGroups: otherSelectedGroups,
                                  });
                                  const isConflicted = conflict.hasConflict && !isCurrentChoice;

                                  return (
                                    <option key={g.id} value={g.id} disabled={isConflicted}>
                                      {g.name} {scheduleStr ? `(${scheduleStr})` : ""} {g.room ? `• ${g.room}` : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <label className={labelCls}>Notițe / Informații</label>
            <textarea
              rows={3}
              value={formData.info}
              onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              placeholder="Detalii adiționale despre elev..."
              className={inputCls}
            />
          </div>

          {isEditing && (
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">Cont elev activ</span>
              </label>
            </div>
          )}

          {(createMutation.error || updateMutation.error) && (
            <p className="text-rose-600 text-xs font-medium p-2 bg-rose-50 rounded-lg">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}
        </form>

        <div className="p-4 px-6 border-t border-slate-200/80 bg-slate-50/95 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition"
          >
            Anulează
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Sigur doriți să ștergeți acest student?")) {
                  deleteMutation.mutate({ id: student.id! });
                }
              }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Se șterge..." : "Șterge"}
            </button>
          )}
          <button
            type="submit"
            form="student-form"
            disabled={isPending || courseConflicts.length > 0}
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 rounded-xl transition disabled:opacity-50"
          >
            {isPending ? "Se procesează..." : isEditing ? "Salvează Modificările" : "Creează Student"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
