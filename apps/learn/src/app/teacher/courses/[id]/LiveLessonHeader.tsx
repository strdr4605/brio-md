"use client";

import { useRef } from "react";
import Link from "next/link";
import { GroupPicker, GroupOption } from "./GroupPicker";

type Props = {
  courseName?: string;
  groupName?: string;
  totalStudents: number;
  presentStudents: number;
  tasksCompletedCount: number;
  unmarkedCount: number;
  courseGroups: GroupOption[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
  isGroupsLoading: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenFinalize: () => void;
};

function formatDateToEuropean(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return y && m && d ? `${d}/${m}/${y}` : dateStr;
}

export function LiveLessonHeader({
  courseName,
  groupName,
  totalStudents,
  presentStudents,
  tasksCompletedCount,
  unmarkedCount,
  courseGroups,
  selectedGroupId,
  onSelectGroup,
  isGroupsLoading,
  selectedDate,
  onSelectDate,
  onOpenFinalize,
}: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === "function") {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          <span>Sesiune Curs Activ:</span>
          <span className="text-slate-700 font-medium">
            {courseName || "Curs"} / {groupName || "Grupă"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Total {totalStudents} elevi înscriși • {presentStudents} prezenți acum • {tasksCompletedCount} sarcini finalizate • Sincronizare automată în timp real
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <GroupPicker
          groups={courseGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={onSelectGroup}
          isLoading={isGroupsLoading}
        />

        <div
          onClick={handleOpenCalendar}
          className="relative border border-slate-300 rounded-lg px-3 py-1 bg-white shadow-2xs flex flex-col justify-center cursor-pointer hover:border-slate-400 transition min-w-[130px] select-none"
        >
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
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onClick={(e) => {
              try {
                if (typeof e.currentTarget.showPicker === "function") {
                  e.currentTarget.showPicker();
                }
              } catch {}
            }}
            onChange={(e) => onSelectDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            title="Alege data"
          />
        </div>

        <button
          type="button"
          onClick={onOpenFinalize}
          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-2xs cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
          title="Finalizează prezența și cataloghează elevii rămași"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>Finalizează Lecția</span>
          {unmarkedCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
              {unmarkedCount}
            </span>
          )}
        </button>

        <Link
          href="/teacher"
          className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition flex items-center gap-1 px-2 py-2"
        >
          <span>&lt; ÎNAPOI</span>
        </Link>
      </div>
    </div>
  );
}
