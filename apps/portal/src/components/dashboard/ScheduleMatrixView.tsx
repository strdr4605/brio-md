"use client";

import { Fragment, useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import {
  DAYS_OF_WEEK,
  ACADEMIC_PAIRS,
  matchAcademicPairIndex,
  getOccupiedPairIndicesForDay,
} from "./scheduleTypes";
import { ShieldCheckIcon, UsersIcon } from "@/components/ui/icons";

type ScheduleMatrixViewProps = {
  groups: GroupItem[];
  currentUserId: number | null;
  onSelectEvent: (group: GroupItem) => void;
  selectedDay?: string;
  hideEmptySlots?: boolean;
};

export function ScheduleMatrixView({
  groups,
  currentUserId,
  onSelectEvent,
  selectedDay = "all",
  hideEmptySlots = true,
}: ScheduleMatrixViewProps) {
  // Filter groups to those with classes on this day when a single day is chosen
  const displayGroups = useMemo(() => {
    if (selectedDay && selectedDay !== "all") {
      const dayGroups = groups.filter((g) =>
        (g.scheduleDays || []).some((d) => d.toLowerCase() === selectedDay.toLowerCase())
      );
      return dayGroups.length > 0 ? dayGroups : groups;
    }
    return groups;
  }, [groups, selectedDay]);

  // Days to show: filter to selected day or active days when hideEmptySlots is on
  const daysToShow = useMemo(() => {
    const allAcademic = DAYS_OF_WEEK.slice(0, 6);
    if (selectedDay && selectedDay !== "all") {
      return allAcademic.filter((d) => d.key === selectedDay);
    }
    if (!hideEmptySlots) {
      return allAcademic;
    }
    const active = allAcademic.filter((d) => {
      const occupiedPairs = getOccupiedPairIndicesForDay(displayGroups, d.key);
      return occupiedPairs.size > 0;
    });
    return active.length > 0 ? active : allAcademic;
  }, [selectedDay, hideEmptySlots, displayGroups]);

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <UsersIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800">Nu există grupe de afișat</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Ajustează filtrele sau adaugă grupe noi pentru a vizualiza orarul.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Main Table with Sticky Headers & Sticky Time Column */}
      <div className="overflow-x-auto max-h-[80vh] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs select-none min-w-[800px] sm:min-w-[900px]">
          {/* Header row: Groups */}
          <thead className="sticky top-0 z-30 bg-slate-50 shadow-2xs border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-40 bg-slate-100/95 backdrop-blur-xs w-[36px] sm:w-[44px] min-w-[36px] sm:min-w-[44px] p-1.5 sm:p-2.5 font-bold text-slate-800 border-r border-slate-200 text-center uppercase tracking-wider text-[10px] sm:text-[11px]">
                Zi
              </th>
              <th className="sticky left-[36px] sm:left-[44px] z-40 bg-slate-100/95 backdrop-blur-xs w-[95px] sm:w-[115px] min-w-[95px] sm:min-w-[115px] px-1.5 sm:px-2 py-2 sm:py-3 font-bold text-slate-800 border-r border-slate-200 text-center uppercase tracking-wider text-[10px] sm:text-[11px]">
                Orele
              </th>
              {displayGroups.map((group) => {
                const isMine = currentUserId && group.teacherId === currentUserId;
                return (
                  <th
                    key={group.id}
                    className={`px-3 py-2.5 sm:px-3.5 sm:py-3 font-bold text-slate-900 border-r border-slate-200 last:border-r-0 min-w-[160px] sm:min-w-[180px] max-w-[220px] transition ${
                      isMine ? "bg-slate-100/80" : "bg-slate-50 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-extrabold text-xs truncate tracking-tight text-slate-900">
                        {group.name}
                      </span>
                      {isMine && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white shrink-0">
                          TU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                      {group.courseName || "Curs"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center justify-between border-t border-slate-200/60 pt-1">
                      <span className="truncate">{group.teacherName || "Neasignat"}</span>
                      <span className="font-bold text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded text-[9px]">
                        {group.studentCount ?? 0} el.
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Days and Academic Pairs */}
          <tbody className="divide-y divide-slate-100">
            {daysToShow.map((day) => {
              const occupiedPairSet = getOccupiedPairIndicesForDay(displayGroups, day.key);
              const pairsForDay =
                hideEmptySlots && occupiedPairSet.size > 0
                  ? ACADEMIC_PAIRS.filter((p) => occupiedPairSet.has(p.index))
                  : ACADEMIC_PAIRS;

              return (
                <Fragment key={day.key}>
                  {pairsForDay.map((pair, pairIdx) => (
                    <tr
                      key={`${day.key}_${pair.index}`}
                      className="hover:bg-slate-50/50 transition divide-x divide-slate-100 border-b border-slate-100"
                    >
                      {/* Sticky Day Column (spans pairsForDay.length rows) */}
                      {pairIdx === 0 && (
                        <td
                          rowSpan={pairsForDay.length}
                          className="sticky left-0 z-20 bg-slate-50 font-extrabold text-slate-800 text-center border-r border-slate-200 p-1.5 sm:p-2 uppercase tracking-widest text-[11px] sm:text-xs align-middle w-[36px] sm:w-[44px] min-w-[36px] sm:min-w-[44px]"
                          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                        >
                          <div className="py-2 rotate-180 flex items-center justify-center font-black tracking-wider text-slate-900">
                            {day.label}
                          </div>
                        </td>
                      )}

                      {/* Pair Time Cell (sticky next to Day column) */}
                      <td className="sticky left-[36px] sm:left-[44px] z-10 bg-white/95 backdrop-blur-xs px-1.5 sm:px-2 py-2 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[95px] sm:min-w-[115px] w-[95px] sm:w-[115px]">
                        <div className="text-[11px] font-extrabold text-slate-900">{pair.label}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">
                          Perechea {pair.index}
                        </div>
                      </td>

                      {/* Group Columns Cells */}
                      {displayGroups.map((group) => {
                        const hasDay = (group.scheduleDays || []).some(
                          (d) => d.toLowerCase() === day.key
                        );
                        const pairMatch = matchAcademicPairIndex(group.scheduleTime) === pair.index;
                        const isOccupied = hasDay && pairMatch;

                        if (!isOccupied) {
                          return (
                            <td
                              key={group.id}
                              className="p-1 border-r border-slate-100 last:border-r-0 bg-white"
                            >
                              <div className="h-full min-h-[56px]" />
                            </td>
                          );
                        }

                        const isMine = currentUserId && group.teacherId === currentUserId;

                        return (
                          <td
                            key={group.id}
                            onClick={() => onSelectEvent(group)}
                            className="p-1.5 border-r border-slate-100 last:border-r-0 bg-slate-50/40 cursor-pointer"
                          >
                            <div
                              className={`h-full flex flex-col justify-between p-2 rounded-xl border bg-white shadow-2xs space-y-1.5 transition-all hover:border-slate-400 hover:shadow-xs ${
                                isMine
                                  ? "border-slate-900 ring-1 ring-slate-900/10"
                                  : "border-slate-200/90"
                              }`}
                            >
                              {/* Discipline / Course Title */}
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-2">
                                  {group.courseName || group.name}
                                </span>
                                {isMine && (
                                  <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                                )}
                              </div>

                              {/* Teacher & Aula / Room */}
                              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                                <span className="truncate font-medium max-w-[65%] text-slate-700">
                                  {group.teacherName ? (
                                    group.teacherName
                                  ) : (
                                    <span className="italic text-slate-400">Neasignat</span>
                                  )}
                                </span>
                                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] shrink-0 border border-slate-200/60">
                                  {group.room ? group.room : "Fără sală"}
                                </span>
                              </div>

                              {/* Exact time & Student Count */}
                              <div className="flex items-center justify-between text-[9px] text-slate-500">
                                <span className="truncate font-medium">
                                  {group.scheduleTime || pair.label}
                                </span>
                                <span className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">
                                  {group.studentCount ?? 0} el.
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
