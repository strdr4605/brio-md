"use client";

import { useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import { HOURS, parseStartHour, getOccupiedHoursForDay } from "./scheduleTypes";
import { ShieldCheckIcon, AlertTriangleIcon } from "@/components/ui/icons";

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
    <div className="bg-white -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 shadow-xs overflow-x-auto scrollbar-thin">
      <div className="min-w-[680px] sm:min-w-[760px]">
        {/* Header: Rooms */}
        <div
          className="grid border-b border-slate-200 bg-slate-50/90 sticky top-0 z-10"
          style={{ gridTemplateColumns: `85px repeat(${rooms.length || 1}, minmax(180px, 1fr))` }}
        >
          <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center border-r border-slate-200">
            Oră
          </div>
          {rooms.map((room) => (
            <div
              key={room}
              className="p-3 text-xs font-bold text-slate-900 border-r border-slate-200 last:border-r-0 flex items-center justify-between gap-1.5"
            >
              <span className="truncate">{room}</span>
              <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" title="Sală configurată" />
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-slate-100">
          {hoursToShow.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[70px]"
              style={{
                gridTemplateColumns: `85px repeat(${rooms.length || 1}, minmax(180px, 1fr))`,
              }}
            >
              {/* Hour label */}
              <div className="p-2 text-xs font-bold text-slate-500 text-center border-r border-slate-100 flex items-start justify-center pt-3 bg-slate-50/50">
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
                    className={`p-2 border-r border-slate-100 last:border-r-0 relative transition flex flex-col gap-2 ${
                      hasConflict ? "bg-rose-50/40" : "hover:bg-slate-50/50"
                    }`}
                  >
                    {hasConflict && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                        <AlertTriangleIcon className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Suprapunere în sală</span>
                      </div>
                    )}
                    {cellEvents.map((ev) => {
                      const isMine = currentUserId && ev.teacherId === currentUserId;
                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className={`p-2.5 rounded-xl border bg-white cursor-pointer shadow-2xs transition-all hover:border-slate-400 hover:shadow-xs ${
                            isMine
                              ? "border-slate-900 ring-1 ring-slate-900/10"
                              : "border-slate-200/90"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 truncate">
                              {ev.scheduleTime || hour}
                            </span>
                            {isMine && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white flex items-center gap-0.5">
                                <ShieldCheckIcon className="w-2.5 h-2.5" />
                                TU
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-900 leading-tight line-clamp-1">
                            {ev.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ev.courseName}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-slate-100">
                            <span className="truncate">{ev.teacherName || "Neasignat"}</span>
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
