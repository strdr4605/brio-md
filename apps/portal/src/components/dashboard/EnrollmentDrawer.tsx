"use client";

import { useState, useMemo, useEffect } from "react";
import { Drawer, ACADEMIC_LABELS } from "@brio-md/ui";
import { trpc } from "@/lib/trpc";
import { SearchIcon, CheckCircleIcon } from "@/components/ui/icons";
import {
  detectStudentGroupScheduleConflicts,
  findGroupConflictWithSelected,
  findStudentConflictWithTargetGroup,
} from "@/lib/scheduleConflicts";
import { StudentEnrollmentView } from "./StudentEnrollmentView";
import { GroupEnrollmentView } from "./GroupEnrollmentView";
import { EnrollmentBillingConfig } from "./EnrollmentBillingConfig";

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
  const [search, setSearch] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | "all">("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [billingType, setBillingType] = useState<"subscription_monthly" | "subscription_course" | "per_lesson" | "custom">("subscription_monthly");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("0");

  const utils = trpc.useUtils();

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

  const drawerTitle = isStudentMode
    ? `Înrolare Grupe – ${studentName || "Student"}`
    : `Înrolare Studenți – ${groupName || "Grupă"}`;

  const drawerDescription = isStudentMode
    ? "Selectează cursul și intervalul orar pentru înscrierea în grupă"
    : `Afișează doar studenții înscriși la cursul ${courseName || ""}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseAction}
      title={drawerTitle}
      description={drawerDescription}
      widthClassName="w-full sm:max-w-xl"
      bodyClassName="p-0 flex flex-col h-full overflow-hidden"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-xs text-slate-500 order-2 sm:order-1">
            {isStudentMode ? (
              <span>{selectedGroupIds.length} {selectedGroupIds.length === 1 ? "grupă selectată" : "grupe selectate"}</span>
            ) : (
              <span>{selectedStudentIds.length} {selectedStudentIds.length === 1 ? "student selectat" : "studenți selectați"}</span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              {ACADEMIC_LABELS.drawer.cancel}
            </button>
            <button
              type="button"
              onClick={isStudentMode ? handleSaveStudentEnrollments : handleSaveGroupEnrollments}
              disabled={isSaving || (isStudentMode && studentGroupConflicts.length > 0) || (isGroupMode && groupModeHasConflict)}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>{isSaving ? "Se salvează..." : ACADEMIC_LABELS.drawer.saveEnrollment}</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Search & Course Filter Dropdown Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-2">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={isStudentMode ? "Caută curs sau grupă..." : "Caută student după nume sau telefon..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        {isStudentMode && availableCourses.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 shrink-0">Filtru Curs:</label>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md outline-none text-slate-700"
            >
              <option value="all">Toate cursurile disponibile</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Body Content Container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Conflict Warning Banner */}
        {isStudentMode && studentGroupConflicts.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ Conflict de orar detectat</span>
            </div>
            {studentGroupConflicts.map((c, idx) => (
              <p key={idx} className="text-[11px] text-amber-700">{c.message}</p>
            ))}
          </div>
        )}

        {isStudentMode && (
          <>
            <StudentEnrollmentView
              isLoading={isLoadingCourses || isLoadingGroups || isLoadingEnrollments}
              search={search}
              studentCourses={
                selectedCourseFilter === "all"
                  ? studentCourses
                  : studentCourses.filter((c) => c.id === selectedCourseFilter)
              }
              availableCourses={
                selectedCourseFilter === "all"
                  ? availableCourses
                  : availableCourses.filter((c) => c.id === selectedCourseFilter)
              }
              allGroups={allGroups}
              selectedGroupIds={selectedGroupIds}
              currentEnrollments={currentEnrollments}
              onToggleGroup={handleToggleGroup}
              onUpdateStatus={(enrollmentId, status) => updateStatusMutation.mutate({ enrollmentId, status })}
              isUpdatingStatus={updateStatusMutation.isPending}
            />

            <EnrollmentBillingConfig
              billingType={billingType}
              setBillingType={setBillingType}
              customPrice={customPrice}
              setCustomPrice={setCustomPrice}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
            />
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
    </Drawer>
  );
}
