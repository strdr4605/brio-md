"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { SearchIcon, XIcon, CheckCircleIcon } from "@/components/ui/icons";
import { detectStudentGroupScheduleConflicts } from "@/lib/scheduleConflicts";

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  // Student-centric mode (e.g. opened from Student Profile)
  studentId?: number | null;
  studentName?: string;
  courses?: Array<{ id: number; name: string }>;
  // Group-centric mode (e.g. opened from Group Roster)
  groupId?: number | null;
  groupName?: string;
  courseId?: number | null;
  courseName?: string;
  schoolId?: number | null;
};

export function EnrollmentDrawer({
  isOpen,
  onCloseAction,
  studentId,
  studentName,
  courses: coursesProp,
  groupId,
  groupName,
  courseId,
  courseName,
  schoolId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Mode A: Student Profile -> Pick Groups across Courses ---
  const isStudentMode = Boolean(studentId);

  // Fetch student details if studentId is provided and courses not passed via props
  const { data: fetchedStudent } = trpc.student.getById.useQuery(
    { id: studentId! },
    { enabled: isOpen && isStudentMode && !coursesProp },
  );

  const studentCourses = coursesProp || fetchedStudent?.courses || [];
  const enrolledCourseIds = useMemo(
    () => new Set(studentCourses.map((c) => c.id)),
    [studentCourses],
  );

  const { data: allGroups = [], isLoading: isLoadingGroups } = trpc.group.list.useQuery(
    { schoolId: schoolId || undefined },
    { enabled: isOpen && isStudentMode },
  );

  const { data: currentEnrollments = [], isLoading: isLoadingEnrollments } =
    trpc.enrollment.getByStudent.useQuery(
      { studentId: studentId! },
      { enabled: isOpen && isStudentMode && Boolean(studentId) },
    );

  // Sync current student enrollments into selection
  useEffect(() => {
    if (isStudentMode && currentEnrollments.length > 0) {
      setSelectedGroupIds(currentEnrollments.map((e) => e.groupId));
    } else if (isStudentMode && currentEnrollments.length === 0) {
      setSelectedGroupIds([]);
    }
  }, [isStudentMode, currentEnrollments]);

  const studentGroupConflicts = useMemo(() => {
    if (!isStudentMode || selectedGroupIds.length <= 1) return [];
    const targetGroups = allGroups.filter((g) => selectedGroupIds.includes(g.id));
    return detectStudentGroupScheduleConflicts({ targetGroups });
  }, [isStudentMode, selectedGroupIds, allGroups]);

  // --- Mode B: Group Roster -> Pick Students to Enroll ---
  const isGroupMode = Boolean(groupId);

  const { data: allStudents = [], isLoading: isLoadingStudents } = trpc.student.list.useQuery(
    {
      schoolId: schoolId || undefined,
      search: search.trim() || undefined,
      limit: 100,
    },
    { enabled: isOpen && isGroupMode },
  );

  const { data: existingGroupMembers = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: groupId!, status: "all" },
    { enabled: isOpen && isGroupMode && Boolean(groupId) },
  );

  useEffect(() => {
    if (isGroupMode && existingGroupMembers.length > 0) {
      setSelectedStudentIds(existingGroupMembers.map((m) => m.studentId));
    } else if (isGroupMode && existingGroupMembers.length === 0) {
      setSelectedStudentIds([]);
    }
  }, [isGroupMode, existingGroupMembers]);

  // Mutations
  const enrollMutation = trpc.enrollment.enrollStudent.useMutation({
    onSuccess: () => {
      utils.enrollment.invalidate();
      utils.student.invalidate();
      utils.group.invalidate();
      onCloseAction();
    },
    onError: (err) => setError(err.message),
  });

  const updateStatusMutation = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => {
      utils.enrollment.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const removeEnrollmentMutation = trpc.enrollment.remove.useMutation({
    onSuccess: () => {
      utils.enrollment.invalidate();
      utils.student.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  // In student mode, if student is enrolled in specific courses, only show groups for those courses.
  // If the student has 0 courses, no groups can be selected until courses are added.
  const studentGroups = useMemo(() => {
    if (!isStudentMode) return allGroups;
    if (enrolledCourseIds.size > 0) {
      return allGroups.filter((g) => enrolledCourseIds.has(g.courseId));
    }
    return [];
  }, [allGroups, isStudentMode, enrolledCourseIds]);

  // Grouping available groups by course for clean UI in student mode
  const groupsByCourse = useMemo(() => {
    const map = new Map<string, typeof allGroups>();
    for (const g of studentGroups) {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCourse = g.courseName.toLowerCase().includes(q);
        const matchesGroup = g.name.toLowerCase().includes(q);
        const matchesRoom = (g.room || "").toLowerCase().includes(q);
        if (!matchesCourse && !matchesGroup && !matchesRoom) continue;
      }
      const list = map.get(g.courseName) || [];
      list.push(g);
      map.set(g.courseName, list);
    }
    return map;
  }, [studentGroups, search]);

  // In group mode, only allow picking students who are already enrolled in this group's course
  const eligibleStudents = useMemo(() => {
    if (!isGroupMode) return allStudents;
    if (courseId) {
      return allStudents.filter((s) => s.courses?.some((c) => c.id === courseId));
    }
    return allStudents;
  }, [allStudents, isGroupMode, courseId]);

  // Filter students in group mode
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return eligibleStudents;
    const q = search.toLowerCase();
    return eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        (s.parentName || "").toLowerCase().includes(q),
    );
  }, [eligibleStudents, search]);

  if (!mounted || !isOpen) return null;

  // Toggle group selection for student
  const handleToggleGroup = (gId: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(gId) ? prev.filter((id) => id !== gId) : [...prev, gId],
    );
  };

  // Toggle student selection for group
  const handleToggleStudent = (sId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId],
    );
  };

  const handleSaveStudentEnrollments = () => {
    if (!studentId) return;
    if (studentGroupConflicts.length > 0) {
      setError(studentGroupConflicts[0].message);
      return;
    }
    setError(null);

    // Groups newly added
    const initialGroupIds = currentEnrollments.map((e) => e.groupId);
    const toAdd = selectedGroupIds.filter((id) => !initialGroupIds.includes(id));
    const toRemove = initialGroupIds.filter((id) => !selectedGroupIds.includes(id));

    // Execute removes
    for (const removeGId of toRemove) {
      removeEnrollmentMutation.mutate({ studentId, groupId: removeGId });
    }

    // Execute adds
    if (toAdd.length > 0) {
      enrollMutation.mutate({ studentId, groupIds: toAdd });
    } else {
      onCloseAction();
    }
  };

  const handleSaveGroupEnrollments = async () => {
    if (!groupId) return;
    setError(null);

    const initialStudentIds = existingGroupMembers.map((m) => m.studentId);
    const toAdd = selectedStudentIds.filter((id) => !initialStudentIds.includes(id));
    const toRemove = initialStudentIds.filter((id) => !selectedStudentIds.includes(id));

    for (const sId of toRemove) {
      removeEnrollmentMutation.mutate({ studentId: sId, groupId });
    }

    for (const sId of toAdd) {
      enrollMutation.mutate({ studentId: sId, groupIds: [groupId] });
    }

    onCloseAction();
  };

  const isSaving =
    enrollMutation.isPending ||
    updateStatusMutation.isPending ||
    removeEnrollmentMutation.isPending;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onCloseAction}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Pinned */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isStudentMode
                ? `Înrolare Grupe – ${studentName || "Student"}`
                : `Înrolare Studenți – ${groupName || "Grupă"}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStudentMode
                ? enrolledCourseIds.size > 0
                  ? `Afișează doar grupele pentru cele ${enrolledCourseIds.size} ${enrolledCourseIds.size === 1 ? "curs" : "cursuri"} la care este înscris studentul`
                  : "Studentul nu este înscris la niciun curs"
                : `Afișează doar studenții înscriși la cursul ${courseName || ""}`}
            </p>
          </div>
          <button
            onClick={onCloseAction}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                isStudentMode
                  ? "Caută după curs, grupă sau sală..."
                  : "Caută student după nume sau telefon..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {studentGroupConflicts.map((c, i) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">⚠️</span>
              <span>{c.message}</span>
            </div>
          ))}

          {/* Mode A: Student Profile View */}
          {isStudentMode && (
            <>
              {isLoadingGroups || isLoadingEnrollments ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
              ) : enrolledCourseIds.size === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Studentul nu este înscris la niciun curs
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Conform regulilor academice, un student trebuie să fie mai întâi înscris la un
                    curs înainte de a putea fi adăugat într-o grupă. Accesați{" "}
                    <strong>«Editează profil»</strong> pentru a-i atribui cursuri.
                  </p>
                </div>
              ) : allGroups.length === 0 || studentGroups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">
                    Nu există grupe disponibile
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Nu există încă grupe create pentru cursurile la care este înscris acest student.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(groupsByCourse.entries()).map(([cName, cGroups]) => (
                    <div
                      key={cName}
                      className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {cName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cGroups.length} {cGroups.length === 1 ? "grupă" : "grupe"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {cGroups.map((grp) => {
                          const isSelected = selectedGroupIds.includes(grp.id);
                          const existingEnrollment = currentEnrollments.find(
                            (e) => e.groupId === grp.id,
                          );

                          return (
                            <div
                              key={grp.id}
                              className={`p-3 rounded-lg border transition-all ${
                                isSelected
                                  ? "bg-white border-blue-400/80 shadow-xs"
                                  : "bg-white/70 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-3 cursor-pointer flex-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleGroup(grp.id)}
                                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{grp.name}</p>
                                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                                      {grp.scheduleTime && <span>⏰ {grp.scheduleTime}</span>}
                                      {grp.room && <span>📍 {grp.room}</span>}
                                      {grp.teacherName && <span>👨‍🏫 {grp.teacherName}</span>}
                                    </div>
                                  </div>
                                </label>

                                {/* Per-Course/Group Status Dropdown for Enrolled Student */}
                                {existingEnrollment && (
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      Status:
                                    </span>
                                    <select
                                      value={existingEnrollment.status || "active"}
                                      onChange={(e) => {
                                        updateStatusMutation.mutate({
                                          enrollmentId: existingEnrollment.id,
                                          status: e.target.value as any,
                                        });
                                      }}
                                      disabled={updateStatusMutation.isPending}
                                      className={`text-xs font-semibold px-2 py-1 rounded-md border outline-none ${
                                        existingEnrollment.status === "active"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : existingEnrollment.status === "inactive"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      <option value="active">Activ</option>
                                      <option value="inactive">Inactiv</option>
                                      <option value="archived">Arhivat</option>
                                      <option value="completed">Completat</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Mode B: Group Roster View */}
          {isGroupMode && (
            <>
              {isLoadingStudents ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              ) : eligibleStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Niciun student înscris la acest curs
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Doar studenții deja înscriși la cursul{" "}
                    <strong>{courseName || "respectiv"}</strong> pot fi adăugați în această grupă.
                    Înscrieți mai întâi studenții la curs din profilul lor.
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">
                    Nu a fost găsit niciun student
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredStudents.map((s) => {
                    const isSelected = selectedStudentIds.includes(s.id);
                    const isAlreadyMember = existingGroupMembers.some((m) => m.studentId === s.id);

                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-blue-50/50 border-blue-400"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudent(s.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{s.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {s.phone || "Fără telefon"}
                              {s.parentName ? ` • Tutore: ${s.parentName}` : ""}
                            </p>
                          </div>
                        </div>

                        {isAlreadyMember && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Înrolat
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Pinned */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isStudentMode ? (
              <span>
                {selectedGroupIds.length}{" "}
                {selectedGroupIds.length === 1 ? "grupă selectată" : "grupe selectate"}
              </span>
            ) : (
              <span>
                {selectedStudentIds.length}{" "}
                {selectedStudentIds.length === 1 ? "student selectat" : "studenți selectați"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={isStudentMode ? handleSaveStudentEnrollments : handleSaveGroupEnrollments}
              disabled={
                isSaving ||
                (isStudentMode && studentGroupConflicts.length > 0) ||
                (isStudentMode && enrolledCourseIds.size === 0) ||
                (isGroupMode && eligibleStudents.length === 0)
              }
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>{isSaving ? "Se salvează..." : "Salvează Înscrierile"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
