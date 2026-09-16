"use client";

import { useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import { DAYS_OF_WEEK, HOURS, getCourseColor, parseStartHour, getOccupiedHoursForDay } from "./scheduleTypes";

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
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
      <div className="min-w-[840px]">
        {/* Days Header */}
        <div
          className="grid border-b border-neutral-200 bg-neutral-50/80 sticky top-0 z-10"
          style={{ gridTemplateColumns: `80px repeat(${daysToShow.length}, 1fr)` }}
        >
          <div className="p-3 text-xs font-bold text-neutral-400 uppercase text-center border-r border-neutral-200">
            Oră
          </div>
          {daysToShow.map((day) => (
            <div
              key={day.key}
              className="p-3 text-xs font-bold text-neutral-800 border-r border-neutral-200 last:border-r-0 text-center"
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-neutral-100">
          {hoursToShow.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[64px]"
              style={{ gridTemplateColumns: `80px repeat(${daysToShow.length}, 1fr)` }}
            >
              <div className="p-2 text-xs font-medium text-neutral-400 text-center border-r border-neutral-100 flex items-start justify-center pt-3 bg-neutral-50/40">
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
                    className="p-1.5 border-r border-neutral-100 last:border-r-0 flex flex-col gap-1.5 hover:bg-neutral-50/60 transition"
                  >
                    {cellEvents.map((ev) => {
                      const palette = getCourseColor(ev.courseId);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className={`p-2 rounded-xl border cursor-pointer shadow-xs transition hover:scale-[1.02] hover:shadow-md ${palette.bg} ${palette.border} ${palette.text}`}
                        >
                          <div className="text-[10px] font-bold truncate mb-0.5">{ev.name}</div>
                          <div className="text-[10px] opacity-75 truncate">
                            {ev.room || "Fără sală"}
                          </div>
                          <div className="text-[9px] font-medium opacity-85 mt-0.5">
                            {ev.scheduleTime}
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
