"use client";

import { useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import { HOURS, getCourseColor, parseStartHour, getOccupiedHoursForDay } from "./scheduleTypes";

type ScheduleRoomViewProps = {
  rooms: string[];
  selectedDay: string;
  filteredGroups: GroupItem[];
  conflicts: Map<string, number>;
  currentUserId: number | null;
  onSelectEvent: (group: GroupItem) => void;
  hideEmptySlots?: boolean;
};

export function ScheduleRoomView({
  rooms,
  selectedDay,
  filteredGroups,
  conflicts,
  currentUserId,
  onSelectEvent,
  hideEmptySlots = true,
}: ScheduleRoomViewProps) {
  const hoursToShow = useMemo(() => {
    if (!hideEmptySlots) return HOURS;
    const occupied = getOccupiedHoursForDay(filteredGroups, selectedDay);
    const active = HOURS.filter((h) => occupied.has(h));
    return active.length > 0 ? active : HOURS;
  }, [hideEmptySlots, filteredGroups, selectedDay]);
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Header: Rooms */}
        <div
          className="grid border-b border-neutral-200 bg-neutral-50/80 sticky top-0 z-10"
          style={{ gridTemplateColumns: `80px repeat(${rooms.length || 1}, minmax(180px, 1fr))` }}
        >
          <div className="p-3 text-xs font-bold text-neutral-400 uppercase tracking-wider text-center border-r border-neutral-200">
            Oră
          </div>
          {rooms.map((room) => (
            <div
              key={room}
              className="p-3 text-xs font-bold text-neutral-800 border-r border-neutral-200 last:border-r-0 flex items-center justify-between gap-1"
            >
              <span className="truncate">{room}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sală activă" />
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-neutral-100">
          {hoursToShow.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[64px]"
              style={{ gridTemplateColumns: `80px repeat(${rooms.length || 1}, minmax(180px, 1fr))` }}
            >
              {/* Hour label */}
              <div className="p-2 text-xs font-medium text-neutral-400 text-center border-r border-neutral-100 flex items-start justify-center pt-3 bg-neutral-50/40">
                {hour}
              </div>

              {/* Room Cells */}
              {rooms.map((room) => {
                const conflictKey = `${selectedDay}_${room}_${hour}`;
                const hasConflict = (conflicts.get(conflictKey) || 0) > 1;

                // Find events matching this day, room, and start hour
                const cellEvents = filteredGroups.filter((g) => {
                  const roomName = g.room?.trim() || "Fără sală alocată";
                  if (roomName !== room) return false;
                  const hasDay = (g.scheduleDays || []).some(
                    (d) => d.toLowerCase() === selectedDay
                  );
                  if (!hasDay) return false;
                  return parseStartHour(g.scheduleTime) === hour;
                });

                return (
                  <div
                    key={room}
                    className={`p-1.5 border-r border-neutral-100 last:border-r-0 relative transition flex flex-col gap-1.5 ${
                      hasConflict ? "bg-amber-50/40" : "hover:bg-neutral-50/60"
                    }`}
                  >
                    {cellEvents.map((ev) => {
                      const palette = getCourseColor(ev.courseId);
                      const isMine = currentUserId && ev.teacherId === currentUserId;
                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className={`p-2 rounded-xl border cursor-pointer shadow-xs transition-all hover:scale-[1.02] hover:shadow-md ${palette.bg} ${palette.border} ${palette.text}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 truncate">
                              {ev.scheduleTime || hour}
                            </span>
                            {isMine && (
                              <span className="text-[9px] font-extrabold px-1 rounded bg-emerald-600 text-white">
                                TU
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs leading-tight line-clamp-1">
                            {ev.name}
                          </div>
                          <div className="text-[11px] opacity-75 truncate">{ev.courseName}</div>
                          <div className="mt-1 flex items-center justify-between text-[10px] opacity-90 pt-1 border-t border-black/5">
                            <span className="truncate">{ev.teacherName || "Neasignat"}</span>
                            <span className="font-bold">{ev.studentCount ?? 0} el.</span>
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
