"use client";

import { useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import { DAYS_OF_WEEK, HOURS, parseStartHour, getOccupiedHoursForDay } from "./scheduleTypes";

type ScheduleWeekViewProps = {
  filteredGroups: GroupItem[];
  onSelectEvent: (group: GroupItem) => void;
  selectedDay?: string;
  hideEmptySlots?: boolean;
};

export function ScheduleWeekView({
  filteredGroups,
  onSelectEvent,
  selectedDay = "all",
  hideEmptySlots = true,
}: ScheduleWeekViewProps) {
  const daysToShow = useMemo(() => {
    if (selectedDay && selectedDay !== "all") {
      return DAYS_OF_WEEK.filter((d) => d.key === selectedDay);
    }
    return DAYS_OF_WEEK.slice(0, 6);
  }, [selectedDay]);

  const hoursToShow = useMemo(() => {
    if (!hideEmptySlots) return HOURS;
    const dayKey = selectedDay !== "all" ? selectedDay : undefined;
    const occupied = getOccupiedHoursForDay(filteredGroups, dayKey);
    const active = HOURS.filter((h) => occupied.has(h));
    return active.length > 0 ? active : HOURS;
  }, [hideEmptySlots, filteredGroups, selectedDay]);

  return (
    <div className="bg-white -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 shadow-xs overflow-x-auto scrollbar-thin">
      <div className="min-w-[720px] sm:min-w-[840px]">
        {/* Days Header */}
        <div
          className="grid border-b border-slate-200 bg-slate-50/90 sticky top-0 z-10"
          style={{ gridTemplateColumns: `85px repeat(${daysToShow.length}, 1fr)` }}
        >
          <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center border-r border-slate-200">
            Oră
          </div>
          {daysToShow.map((day) => (
            <div
              key={day.key}
              className="p-3 text-xs font-bold text-slate-800 border-r border-slate-200 last:border-r-0 text-center"
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-slate-100">
          {hoursToShow.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[70px]"
              style={{ gridTemplateColumns: `85px repeat(${daysToShow.length}, 1fr)` }}
            >
              <div className="p-2 text-xs font-bold text-slate-500 text-center border-r border-slate-100 flex items-start justify-center pt-3 bg-slate-50/50">
                {hour}
              </div>

              {daysToShow.map((day) => {
                const cellEvents = filteredGroups.filter((g) => {
                  const hasDay = (g.scheduleDays || []).some(
                    (d) => d.toLowerCase() === day.key
                  );
                  if (!hasDay) return false;
                  return parseStartHour(g.scheduleTime) === hour;
                });

                return (
                  <div
                    key={day.key}
                    className="p-2 border-r border-slate-100 last:border-r-0 flex flex-col gap-2 hover:bg-slate-50/40 transition"
                  >
                    {cellEvents.map((ev) => {
                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className="p-2.5 rounded-xl border border-slate-200/90 bg-white cursor-pointer shadow-2xs transition-all hover:border-slate-400 hover:shadow-xs"
                        >
                          <div className="text-[10px] font-bold text-slate-500 truncate mb-0.5">
                            {ev.scheduleTime || hour}
                          </div>
                          <div className="font-bold text-xs text-slate-900 leading-tight truncate">
                            {ev.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ev.courseName}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-slate-100">
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] truncate max-w-[60%]">
                              {ev.room || "Fără sală"}
                            </span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[9px]">
                              {ev.studentCount ?? 0} el.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
