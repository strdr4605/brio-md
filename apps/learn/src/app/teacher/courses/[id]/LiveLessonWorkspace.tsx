"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { FinalizeLessonModal } from "./FinalizeLessonModal";
import { LiveLessonStudentRow } from "./LiveLessonStudentRow";
import { LiveLessonFilterTabs, FilterTab } from "./LiveLessonFilterTabs";
import { SessionResourceBroadcastBar } from "./SessionResourceBroadcastBar";
import { StudentSubmissionData } from "./StudentResourceAssigner";
import { LiveLessonHeader } from "./LiveLessonHeader";

type Props = {
  courseId: number;
};

const getLocalDateString = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function LiveLessonWorkspace({ courseId }: Props) {
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [selectedBroadcastResourceId, setSelectedBroadcastResourceId] = useState<number | null>(null);
  const [closedBroadcastId, setClosedBroadcastId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: courseGroups = [], isLoading: isGroupsLoading } = trpc.attendance.getCourseGroups.useQuery(
    { courseId },
    { staleTime: 30000 },
  );

  useEffect(() => {
    if (courseGroups.length > 0) {
      if (!selectedGroupId || !courseGroups.some((g) => g.id === selectedGroupId)) {
        setSelectedGroupId(courseGroups[0].id);
      }
    }
  }, [courseGroups, selectedGroupId]);

  const { data, isLoading: isAttendanceLoading, error, refetch } = trpc.attendance.getLessonAttendance.useQuery(
    {
      courseId,
      groupId: selectedGroupId!,
      date: selectedDate,
    },
    {
      enabled: Boolean(selectedGroupId),
      staleTime: 5000,
    },
  );

  const { data: courseResources = [] } = trpc.resource.getCourseResources.useQuery(
    { courseId },
    { staleTime: 10000 },
  );

  const currentGroup = data?.group || courseGroups.find((g) => g.id === selectedGroupId);
  const activeGroupId = selectedGroupId ?? undefined;

  const { data: lessonSubmissions = [] } = trpc.lesson.getLessonSubmissions.useQuery(
    { courseId, groupId: activeGroupId },
    { enabled: Boolean(activeGroupId), refetchInterval: 5000, staleTime: 2000 },
  );

  const submissionsByStudent = new Map<number, StudentSubmissionData[]>();
  for (const sub of lessonSubmissions) {
    const list = submissionsByStudent.get(sub.studentId) || [];
    list.push(sub as StudentSubmissionData);
    submissionsByStudent.set(sub.studentId, list);
  }

  const markMutation = trpc.attendance.markLessonAttendance.useMutation({
    onMutate: async (newRecord) => {
      const targetGroupId = newRecord.groupId;
      const targetDate = newRecord.date;
      await utils.attendance.getLessonAttendance.cancel({ courseId, groupId: targetGroupId, date: targetDate });
      const previousData = utils.attendance.getLessonAttendance.getData({ courseId, groupId: targetGroupId, date: targetDate });

      if (previousData) {
        utils.attendance.getLessonAttendance.setData(
          { courseId, groupId: targetGroupId, date: targetDate },
          {
            ...previousData,
            students: previousData.students.map((s) => {
              if (s.studentId !== newRecord.studentId) return s;
              const nextStatus = newRecord.status;
              const isEligible = nextStatus === "present" || nextStatus === "late";
              return {
                ...s,
                status: nextStatus,
                comment: isEligible ? null : (newRecord.comment !== undefined ? newRecord.comment : s.comment),
                isEligibleForAssignment: isEligible,
              };
            }),
          },
        );
      }
      return { previousData, targetGroupId, targetDate };
    },
    onError: (_err, _newRecord, context) => {
      if (context?.previousData && context.targetGroupId) {
        utils.attendance.getLessonAttendance.setData(
          { courseId, groupId: context.targetGroupId, date: context.targetDate },
          context.previousData,
        );
      }
    },
    onSettled: (_data, _err, _variables, context) => {
      if (context?.targetGroupId) {
        utils.attendance.getLessonAttendance.invalidate({
          courseId,
          groupId: context.targetGroupId,
          date: context.targetDate,
        });
      }
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  const submitWorksheetMutation = trpc.attendance.submitWorksheet.useMutation({
    onSuccess: () => {
      if (selectedGroupId) {
        utils.attendance.getLessonAttendance.invalidate({ courseId, groupId: selectedGroupId, date: selectedDate });
        utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId: selectedGroupId });
      }
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  const isTransitioningGroup = Boolean(selectedGroupId && data && data.group?.id !== selectedGroupId);
  if (isGroupsLoading || !selectedGroupId || (isAttendanceLoading && !data) || isTransitioningGroup) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-xl border border-slate-200" />
        <div className="h-12 bg-white rounded-lg border border-slate-200" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-lg border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!isGroupsLoading && courseGroups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm">
        <p className="text-amber-700 font-semibold mb-2">Nu există grupe active pentru acest curs.</p>
        <p className="text-xs text-slate-500 mb-4">Creați o grupă în Portal pentru a gestiona catalogul live.</p>
        <Link
          href="/teacher"
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-block hover:bg-slate-800 transition"
        >
          Înapoi la cursuri
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm">
        <p className="text-rose-600 font-semibold mb-2">Eroare la încărcarea catalogului live.</p>
        <p className="text-xs text-slate-500 mb-4">{error?.message || "Acces interzis"}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Reîncearcă
        </button>
      </div>
    );
  }

  const { course, students = [] } = data;
  const tasksCompletedCount = lessonSubmissions.filter(
    (s) => s.status === "completed" || s.status === "reviewed",
  ).length;

  const counts = {
    total: students.length,
    present: students.filter((s) => s.status === "present" || s.status === "late").length,
    late: students.filter((s) => s.status === "late").length,
    absent: students.filter((s) => s.status === "absent" || s.status === "excused").length,
    unmarked: students.filter((s) => s.status === null).length,
    restricted: students.filter((s) => s.isRestricted).length,
  };

  const filteredStudents = students.filter((s) => {
    if (!s.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    switch (activeTab) {
      case "present": return s.status === "present" || s.status === "late";
      case "late": return s.status === "late";
      case "unmarked": return s.status === null;
      case "absent": return s.status === "absent" || s.status === "excused";
      case "restricted": return s.isRestricted;
      case "all":
      default: return true;
    }
  });

  const latestSubmissionResourceId = lessonSubmissions.length > 0 ? lessonSubmissions[0].resourceId : null;
  const activeBroadcastResourceId =
    latestSubmissionResourceId && latestSubmissionResourceId !== closedBroadcastId
      ? latestSubmissionResourceId
      : null;

  return (
    <div className="space-y-4">
      {/* Header with GroupPicker and DatePicker */}
      <LiveLessonHeader
        courseName={course?.name}
        groupName={currentGroup?.name}
        totalStudents={counts.total}
        presentStudents={counts.present}
        tasksCompletedCount={tasksCompletedCount}
        unmarkedCount={counts.unmarked}
        courseGroups={courseGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => {
          setSelectedGroupId(id);
          setClosedBroadcastId(null);
        }}
        isGroupsLoading={isGroupsLoading}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onOpenFinalize={() => setIsFinalizeOpen(true)}
      />

      {/* Resource Broadcasting Bar */}
      <SessionResourceBroadcastBar
        courseId={courseId}
        groupId={currentGroup?.id}
        resources={courseResources}
        selectedResourceId={selectedBroadcastResourceId}
        onSelectResource={setSelectedBroadcastResourceId}
        activeBroadcastResourceId={activeBroadcastResourceId}
        onCloseBroadcast={() => setClosedBroadcastId(activeBroadcastResourceId)}
      />

      {/* Filter Tabs & Search */}
      <LiveLessonFilterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Attendance & Tasks Table */}
      <div
        role="region"
        aria-label="Tabel prezență și sarcini elevi"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="bg-[#f8fafc] border-b border-slate-200 px-4 sm:px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-[40px_minmax(180px,1fr)_260px_minmax(240px,1.2fr)] items-center gap-3 sm:gap-4 select-none">
              <span className="text-center">#</span>
              <span>NUME ELEV</span>
              <span className="text-center">STATUS PREZENȚĂ</span>
              <span className="text-right pr-2">SARCINI &amp; EXERCIȚII</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-500 text-sm">
                  {activeTab === "present"
                    ? "Niciun elev prezent marcat încă. Selectează «Toți» sau marchează prezența."
                    : "Niciun elev nu corespunde filtrelor selectate."}
                </p>
                {activeTab !== "all" && counts.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Afișează toți elevii ({counts.total})
                  </button>
                )}
              </div>
            ) : (
              filteredStudents.map((student, idx) => (
                <LiveLessonStudentRow
                  key={student.studentId}
                  index={idx + 1}
                  student={student}
                  courseId={courseId}
                  groupId={currentGroup?.id}
                  availableResources={courseResources}
                  submissions={submissionsByStudent.get(student.studentId) || []}
                  onStatusChange={(id, next) => {
                    if (selectedGroupId) markMutation.mutate({ courseId, groupId: selectedGroupId, studentId: id, date: selectedDate, status: next, comment: next === "absent" ? student.comment : null });
                  }}
                  onCommentChange={(id, comment) => {
                    if (selectedGroupId) markMutation.mutate({ courseId, groupId: selectedGroupId, studentId: id, date: selectedDate, status: "absent", comment });
                  }}
                  onWorksheetSubmit={(id) => {
                    if (selectedGroupId) submitWorksheetMutation.mutate({ courseId, groupId: selectedGroupId, studentId: id, date: selectedDate });
                  }}
                  isMutating={markMutation.isPending && markMutation.variables?.studentId === student.studentId}
                  isWorksheetSubmitting={submitWorksheetMutation.isPending && submitWorksheetMutation.variables?.studentId === student.studentId}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Closeout Modal */}
      {isFinalizeOpen && (
        <FinalizeLessonModal
          isOpen={isFinalizeOpen}
          onClose={() => setIsFinalizeOpen(false)}
          courseId={courseId}
          groupId={currentGroup?.id}
          date={selectedDate}
          allStudents={students}
          lessonSubmissions={lessonSubmissions}
          onSuccess={() => {
            if (selectedGroupId) {
              utils.attendance.getLessonAttendance.invalidate({ courseId, groupId: selectedGroupId, date: selectedDate });
              utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId: selectedGroupId });
            }
            utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
          }}
        />
      )}
    </div>
  );
}
