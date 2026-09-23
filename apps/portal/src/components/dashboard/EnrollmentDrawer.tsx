"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { SearchIcon, XIcon, CheckCircleIcon } from "@/components/ui/icons";
import {
  detectStudentGroupScheduleConflicts,
  findGroupConflictWithSelected,
  findStudentConflictWithTargetGroup,
} from "@/lib/scheduleConflicts";
import { StudentEnrollmentView } from "./StudentEnrollmentView";
import { GroupEnrollmentView } from "./GroupEnrollmentView";

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  studentId?: number | null;
  studentName?: string;
  courses?: Array<{ id: number; name: string }>;
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
  const [billingType, setBillingType] = useState<"subscription_monthly" | "subscription_course" | "per_lesson" | "custom">("subscription_monthly");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("0");

  const utils = trpc.useUtils();
  useEffect(() => setMounted(true), []);

  const isStudentMode = Boolean(studentId);
  const isGroupMode = Boolean(groupId);

  const studentCourses = useMemo(() => coursesProp || [], [coursesProp]);
  const { data: availableCourses = [], isLoading: isLoadingCourses } = trpc.user.listCourses.useQuery(
    { schoolId: schoolId || undefined },
    { enabled: isOpen && isStudentMode },
  );

  const { data: allGroups = [], isLoading: isLoadingGroups } = trpc.group.list.useQuery(
    { schoolId: schoolId || undefined, allSchoolGroups: true },
    { enabled: isOpen },
  );

  const { data: currentEnrollments = [], isLoading: isLoadingEnrollments } = trpc.enrollment.getByStudent.useQuery(
    { studentId: studentId! },
    { enabled: isOpen && isStudentMode && Boolean(studentId) },
  );

  const targetGroup = useMemo(
    () => (groupId ? allGroups.find((g) => g.id === groupId) : undefined),
    [groupId, allGroups],
  );

  const { data: allStudents = [], isLoading: isLoadingStudents } = trpc.student.list.useQuery(
    { schoolId: schoolId || undefined, search: search.trim() || undefined, limit: 100 },
    { enabled: isOpen && isGroupMode },
  );

  const { data: existingGroupMembers = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: groupId!, status: "active" },
    { enabled: isOpen && isGroupMode && Boolean(groupId) },
  );

  useEffect(() => {
    if (isStudentMode) {
      setSelectedGroupIds(currentEnrollments.filter((e) => e.status === "active").map((e) => e.groupId));
    }
  }, [isStudentMode, currentEnrollments]);

  useEffect(() => {
    if (isGroupMode) {
      setSelectedStudentIds(existingGroupMembers.map((m) => m.studentId));
    }
  }, [isGroupMode, existingGroupMembers]);

  const invalidateAll = () =>
    Promise.all([utils.enrollment.invalidate(), utils.student.invalidate(), utils.group.invalidate()]);

  const enrollMutation = trpc.enrollment.enrollStudent.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => setError(err.message),
  });

  const updateStatusMutation = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => setError(err.message),
  });

  const studentGroupConflicts = useMemo(() => {
    if (!isStudentMode || selectedGroupIds.length <= 1) return [];
    return detectStudentGroupScheduleConflicts({
      targetGroups: allGroups.filter((g) => selectedGroupIds.includes(g.id)),
    });
  }, [isStudentMode, selectedGroupIds, allGroups]);

  const groupModeHasConflict = useMemo(() => {
    if (!isGroupMode || !targetGroup) return false;
    const initialMemberIds = new Set(existingGroupMembers.map((m) => m.studentId));
    return selectedStudentIds.some((sId) => {
      if (initialMemberIds.has(sId)) return false;
      const s = allStudents.find((st) => st.id === sId);
      return s ? findStudentConflictWithTargetGroup({ targetGroup, studentActiveGroups: s.groups || [] }).hasConflict : false;
    });
  }, [isGroupMode, targetGroup, selectedStudentIds, allStudents, existingGroupMembers]);

  if (!mounted || !isOpen) return null;

  const handleToggleGroup = (gId: number) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(gId)) return prev.filter((id) => id !== gId);
      const candidateGroup = allGroups.find((g) => g.id === gId);
      if (!candidateGroup) return [...prev, gId];
      const conflict = findGroupConflictWithSelected({
        candidateGroup,
        selectedGroups: allGroups.filter((g) => prev.includes(g.id)),
      });
      return conflict.hasConflict ? prev : [...prev, gId];
    });
  };

  const handleToggleStudent = (sId: number) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(sId)) return prev.filter((id) => id !== sId);
      if (targetGroup) {
        const student = allStudents.find((s) => s.id === sId);
        const conflict = findStudentConflictWithTargetGroup({ targetGroup, studentActiveGroups: student?.groups || [] });
        if (conflict.hasConflict) return prev;
      }
      return [...prev, sId];
    });
  };

  const handleSaveStudentEnrollments = async () => {
    if (!studentId) return;
    if (studentGroupConflicts.length > 0) {
      setError(studentGroupConflicts[0].message);
      return;
    }
    setError(null);

    const initialActive = currentEnrollments.filter((e) => e.status === "active").map((e) => e.groupId);
    const toAdd = selectedGroupIds.filter((id) => !initialActive.includes(id));
    const toRemove = initialActive.filter((id) => !selectedGroupIds.includes(id));

    const parsedCustomPrice = customPrice.trim() ? Math.max(0, parseInt(customPrice, 10)) : null;
    const parsedDiscount = discountPercent.trim() ? Math.min(100, Math.max(0, parseInt(discountPercent, 10))) : 0;

    try {
      const removePromises = toRemove.map((gId) =>
        updateStatusMutation.mutateAsync({ studentId, groupId: gId, status: "inactive" })
      );
      const addPromise =
        toAdd.length > 0
          ? enrollMutation.mutateAsync({
              studentId,
              groupIds: toAdd,
              billingType,
              customPrice: parsedCustomPrice,
              discountPercent: parsedDiscount,
            })
          : Promise.resolve();
      await Promise.all([...removePromises, addPromise]);
      await invalidateAll();
      onCloseAction();
    } catch (err: any) {
      setError(err?.message || "Eroare la salvarea înscrierilor.");
    }
  };

  const handleSaveGroupEnrollments = async () => {
    if (!groupId) return;
    setError(null);

    const initialMemberIds = existingGroupMembers.map((m) => m.studentId);
    const toAdd = selectedStudentIds.filter((id) => !initialMemberIds.includes(id));
    const toRemove = initialMemberIds.filter((id) => !selectedStudentIds.includes(id));

    if (targetGroup) {
      for (const sId of toAdd) {
        const student = allStudents.find((s) => s.id === sId);
        const conflict = findStudentConflictWithTargetGroup({ targetGroup, studentActiveGroups: student?.groups || [] });
        if (conflict.hasConflict) {
          setError(`Nu se poate înrola studentul ${student?.name || ""}: ${conflict.reason}`);
          return;
        }
      }
    }

    try {
      const removePromises = toRemove.map((sId) =>
        updateStatusMutation.mutateAsync({ studentId: sId, groupId, status: "inactive" })
      );
      const addPromises = toAdd.map((sId) =>
        enrollMutation.mutateAsync({ studentId: sId, groupIds: [groupId] })
      );
      await Promise.all([...removePromises, ...addPromises]);
      await invalidateAll();
      onCloseAction();
    } catch (err: any) {
      setError(err?.message || "Eroare la salvarea înscrierilor.");
    }
  };

  const isSaving = enrollMutation.isPending || updateStatusMutation.isPending;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onCloseAction} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isStudentMode ? `Înrolare Grupe – ${studentName || "Student"}` : `Înrolare Studenți – ${groupName || "Grupă"}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStudentMode ? "Caută un curs și selectează grupele pentru înrolare" : `Afișează doar studenții înscriși la cursul ${courseName || ""}`}
            </p>
          </div>
          <button onClick={onCloseAction} type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition" aria-label="Închide">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isStudentMode ? "Caută curs sau grupă..." : "Caută student după nume sau telefon..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

          {isStudentMode && (
            <>
              <StudentEnrollmentView
                isLoading={isLoadingCourses || isLoadingGroups || isLoadingEnrollments}
                search={search}
                studentCourses={studentCourses}
                availableCourses={availableCourses}
                allGroups={allGroups}
                selectedGroupIds={selectedGroupIds}
                currentEnrollments={currentEnrollments}
                onToggleGroup={handleToggleGroup}
                onUpdateStatus={(enrollmentId, status) => updateStatusMutation.mutate({ enrollmentId, status })}
                isUpdatingStatus={updateStatusMutation.isPending}
              />

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Configurare Facturare & Tarif</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">pentru noile înrolări</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Model facturare
                    </label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                    >
                      <option value="subscription_monthly">Abonament lunar</option>
                      <option value="per_lesson">Plată per lecție</option>
                      <option value="subscription_course">Abonament curs complet</option>
                      <option value="custom">Personalizat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preț personalizat (MDL)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Preț implicit curs"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Reducere (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0%"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {isGroupMode && (
            <GroupEnrollmentView
              isLoadingStudents={isLoadingStudents}
              search={search}
              allStudents={allStudents}
              courseId={courseId}
              courseName={courseName}
              selectedStudentIds={selectedStudentIds}
              existingGroupMembers={existingGroupMembers}
              targetGroup={targetGroup}
              onToggleStudent={handleToggleStudent}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isStudentMode ? (
              <span>{selectedGroupIds.length} {selectedGroupIds.length === 1 ? "grupă selectată" : "grupe selectate"}</span>
            ) : (
              <span>{selectedStudentIds.length} {selectedStudentIds.length === 1 ? "student selectat" : "studenți selectați"}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCloseAction} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition">
              Anulează
            </button>
            <button
              type="button"
              onClick={isStudentMode ? handleSaveStudentEnrollments : handleSaveGroupEnrollments}
              disabled={isSaving || (isStudentMode && studentGroupConflicts.length > 0) || (isGroupMode && groupModeHasConflict)}
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
