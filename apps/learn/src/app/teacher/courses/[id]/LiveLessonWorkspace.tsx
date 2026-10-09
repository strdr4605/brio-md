"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { FinalizeLessonModal } from "./FinalizeLessonModal";
import { LiveLessonStudentRow } from "./LiveLessonStudentRow";
import { LiveLessonFilterTabs, FilterTab } from "./LiveLessonFilterTabs";
import { SessionResourceBroadcastBar } from "./SessionResourceBroadcastBar";
import { StudentSubmissionData } from "./StudentResourceAssigner";

type Props = {
  courseId: number;
};

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateToEuropean(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateStr;
}

export function LiveLessonWorkspace({ courseId }: Props) {
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState<FilterTab>("present");
  const [search, setSearch] = useState("");
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [selectedBroadcastResourceId, setSelectedBroadcastResourceId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.attendance.getLessonAttendance.useQuery(
    { courseId, date: selectedDate },
    { refetchInterval: 4000, staleTime: 2000 },
  );

  const { data: courseResources = [] } = trpc.resource.getCourseResources.useQuery(
    { courseId },
    { staleTime: 10000 },
  );

  const group = data?.group;
  const { data: lessonSubmissions = [] } = trpc.lesson.getLessonSubmissions.useQuery(
    { courseId, groupId: group?.id },
    { enabled: Boolean(group?.id), refetchInterval: 5000, staleTime: 2000 },
  );

  const submissionsByStudent = new Map<number, StudentSubmissionData>();
  for (const sub of lessonSubmissions) {
    if (!submissionsByStudent.has(sub.studentId)) {
      submissionsByStudent.set(sub.studentId, sub as StudentSubmissionData);
    }
  }

  const markMutation = trpc.attendance.markLessonAttendance.useMutation({
    onMutate: async (newRecord) => {
      await utils.attendance.getLessonAttendance.cancel({ courseId, date: selectedDate });
      const previousData = utils.attendance.getLessonAttendance.getData({ courseId, date: selectedDate });

      if (previousData) {
        utils.attendance.getLessonAttendance.setData(
          { courseId, date: selectedDate },
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
      return { previousData };
    },
    onError: (_err, _newRecord, context) => {
      if (context?.previousData) {
        utils.attendance.getLessonAttendance.setData({ courseId, date: selectedDate }, context.previousData);
      }
    },
    onSettled: () => {
      utils.attendance.getLessonAttendance.invalidate({ courseId, date: selectedDate });
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  const submitWorksheetMutation = trpc.attendance.submitWorksheet.useMutation({
    onSuccess: () => {
      utils.attendance.getLessonAttendance.invalidate({ courseId, date: selectedDate });
      utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId: group?.id });
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
    },
  });

  if (isLoading) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            <span>Sesiune Curs Activ:</span>
            <span className="text-slate-700 font-medium">
              {course?.name || "Course"} / {group?.name || "Group"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {counts.total} elevi înscriși • {counts.present} prezenți acum • {tasksCompletedCount} sarcini finalizate • Sincronizare automată în timp real
          </p>
        </div>

        {/* Right Actions: Date box + Finalize + Go Back */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative border border-slate-300 rounded-[4px] px-3 py-1 bg-white shadow-2xs flex flex-col justify-center cursor-pointer hover:border-slate-400 transition min-w-[130px] select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Data</span>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-xs font-bold text-slate-800 tracking-wide font-mono">
                {formatDateToEuropean(selectedDate)}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Alege data"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFinalizeOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-2xs cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
            title="Finalizează prezența și cataloghează elevii rămași"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Finalizează Lecția</span>
            {counts.unmarked > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                {counts.unmarked}
              </span>
            )}
          </button>

          <Link
            href="/teacher"
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition flex items-center gap-1 px-2 py-2"
          >
            <span>&lt; GO BACK</span>
          </Link>
        </div>
      </div>

      {/* Resource Broadcasting Bar */}
      <SessionResourceBroadcastBar
        courseId={courseId}
        groupId={group?.id}
        resources={courseResources}
        selectedResourceId={selectedBroadcastResourceId}
        onSelectResource={setSelectedBroadcastResourceId}
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
            <div className="bg-[#f8fafc] border-b border-slate-200 px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-[48px_minmax(200px,1fr)_280px_minmax(260px,1.2fr)] items-center gap-4 select-none">
              <span className="text-center">#</span>
              <span>STUDENT NAME</span>
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
                  groupId={group?.id}
                  availableResources={courseResources}
                  currentSubmission={submissionsByStudent.get(student.studentId)}
                  onStatusChange={(id, next) => markMutation.mutate({
                    courseId, groupId: group?.id, studentId: id, date: selectedDate, status: next,
                    comment: next === "absent" ? student.comment : null,
                  })}
                  onCommentChange={(id, comment) => markMutation.mutate({
                    courseId, groupId: group?.id, studentId: id, date: selectedDate, status: "absent", comment,
                  })}
                  onWorksheetSubmit={(id) => submitWorksheetMutation.mutate({
                    courseId, groupId: group?.id, studentId: id, date: selectedDate,
                  })}
                  isMutating={markMutation.isPending && markMutation.variables?.studentId === student.studentId}
                  isWorksheetSubmitting={
                    submitWorksheetMutation.isPending &&
                    submitWorksheetMutation.variables?.studentId === student.studentId
                  }
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
          groupId={group?.id}
          date={selectedDate}
          allStudents={students}
          lessonSubmissions={lessonSubmissions}
          onSuccess={() => {
            utils.attendance.getLessonAttendance.invalidate({ courseId, date: selectedDate });
            utils.lesson.getLessonSubmissions.invalidate({ courseId, groupId: group?.id });
            utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
          }}
        />
      )}
    </div>
  );
}
