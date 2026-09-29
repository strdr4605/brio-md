"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AttendanceSheet } from "@/components/dashboard/AttendanceSheet";
import {
  ChevronDownIcon,
  CalendarIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export type AttendanceRapidTabProps = {
  coursesList: { id: number; name: string }[];
  filteredGroups: Array<{
    id: number;
    name: string;
    courseId?: number | null;
    courseName?: string | null;
  }>;
  selectedCourseId: number | null;
  onSelectCourseId: (id: number | null) => void;
  selectedGroupId: number | null;
  onSelectGroupId: (id: number | null) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayStr: string;
  yesterdayStr: string;
  isGroupsLoading: boolean;
  activeGroup?: {
    id: number;
    name: string;
    courseName?: string | null;
    scheduleTime?: string | null;
  } | null;
};

export function AttendanceRapidTab({
  coursesList,
  filteredGroups,
  selectedCourseId,
  onSelectCourseId,
  selectedGroupId,
  onSelectGroupId,
  selectedDate,
  onSelectDate,
  todayStr,
  yesterdayStr,
  isGroupsLoading,
  activeGroup,
}: AttendanceRapidTabProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const {
    data: sheetData = [],
    isLoading: isSheetLoading,
    refetch: refetchSheet,
  } = trpc.attendance.getSheet.useQuery(
    {
      groupId: selectedGroupId as number,
      date: selectedDate,
    },
    {
      enabled: Boolean(selectedGroupId && selectedDate),
      refetchOnWindowFocus: false,
    },
  );

  const submitMutation = trpc.attendance.submit.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      refetchSheet();
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  const handleSaveAttendance = async (
    records: {
      studentId: number;
      status: "present" | "absent" | "late" | "excused";
      comment?: string | null;
    }[],
  ) => {
    if (!selectedGroupId || !selectedDate) return;
    setSaveStatus("idle");
    await submitMutation.mutateAsync({
      groupId: selectedGroupId,
      date: selectedDate,
      records,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar: Course, Group, and Quick Dates */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Course Filter */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Curs
          </label>
          <div className="relative">
            <select
              value={selectedCourseId || ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onSelectCourseId(val);
                onSelectGroupId(null);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
            >
              <option value="">Toate cursurile</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Group Filter */}
        <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Grupă
          </label>
          <div className="relative">
            <select
              value={selectedGroupId || ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                onSelectGroupId(id);
                const g = filteredGroups.find((item) => item.id === id);
                if (g?.courseId && !selectedCourseId) {
                  onSelectCourseId(g.courseId);
                }
              }}
              disabled={isGroupsLoading || filteredGroups.length === 0}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition disabled:opacity-50"
            >
              {filteredGroups.length === 0 ? (
                <option value="">Nicio grupă disponibilă</option>
              ) : (
                filteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.courseName ? `(${g.courseName})` : ""}
                  </option>
                ))
              )}
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Date Shortcuts & Date Picker */}
        <div className="flex flex-col min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Data Sesiunii
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition active:scale-95 ${
                selectedDate === todayStr
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Azi
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(yesterdayStr)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition active:scale-95 ${
                selectedDate === yesterdayStr
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Ieri
            </button>

            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="pl-8 pr-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              />
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Auto-Save & Sync Status Indicator */}
        <div className="self-end pb-1 sm:pb-2 ml-auto flex items-center gap-2">
          {submitMutation.isPending && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-slate-600 animate-ping" />
              Se sincronizează...
            </span>
          )}
          {saveStatus === "saved" && !submitMutation.isPending && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Sincronizat
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs font-semibold text-rose-600">
              Eroare la salvare. Reîncearcă.
            </span>
          )}
        </div>
      </div>

      {/* Roster Area */}
      {isGroupsLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
          <p className="text-sm font-medium text-slate-400">
            Se încarcă grupele atribuite...
          </p>
        </div>
      ) : !selectedGroupId ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">
            Selectați o grupă pentru a nota prezența.
          </p>
        </div>
      ) : isSheetLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
          <p className="text-sm font-medium text-slate-400">
            Se încarcă lista elevilor...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800">
                {activeGroup?.name}
              </span>
              <span className="text-xs text-slate-500 ml-1.5">
                • {activeGroup?.courseName}
              </span>
              {activeGroup?.scheduleTime && (
                <span className="text-xs text-slate-400 ml-1.5">
                  ({activeGroup.scheduleTime})
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {new Intl.DateTimeFormat("ro-RO", {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(selectedDate + "T00:00:00"))}
            </div>
          </div>

          <AttendanceSheet
            students={sheetData}
            groupName={activeGroup?.name || "Grupă"}
            date={selectedDate}
            isSaving={submitMutation.isPending}
            onSave={handleSaveAttendance}
          />
        </div>
      )}
    </div>
  );
}
