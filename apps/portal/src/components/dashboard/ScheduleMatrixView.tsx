"use client";

import { Fragment, useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import {
  DAYS_OF_WEEK,
  ACADEMIC_PAIRS,
  getCourseColor,
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
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-sm">
        <UsersIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-neutral-800">Nu există grupe de afișat</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
          Ajustează filtrele sau adaugă grupe noi pentru a vizualiza orarul.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
      {/* Main Table with Sticky Headers & Sticky Time Column */}
      <div className="overflow-x-auto max-h-[80vh] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs select-none min-w-[900px]">
          {/* Header row: Groups */}
          <thead className="sticky top-0 z-30 bg-neutral-100 shadow-xs border-b border-neutral-300">
            <tr>
              <th className="sticky left-0 z-40 bg-neutral-200/95 backdrop-blur-xs w-[40px] min-w-[40px] p-2 font-bold text-neutral-800 border-r border-neutral-300 text-center uppercase tracking-wider text-[11px]">
                Zi
              </th>
              <th className="sticky left-[40px] z-40 bg-neutral-200/95 backdrop-blur-xs w-[110px] min-w-[110px] px-2 py-3 font-bold text-neutral-800 border-r border-neutral-300 text-center uppercase tracking-wider text-[11px]">
                Orele
              </th>
              {displayGroups.map((group) => {
                const isMine = currentUserId && group.teacherId === currentUserId;
                return (
                  <th
                    key={group.id}
                    className={`px-3 py-2.5 font-bold text-neutral-900 border-r border-neutral-300 last:border-r-0 min-w-[170px] max-w-[210px] transition ${
                      isMine ? "bg-emerald-50/80 text-emerald-950" : "bg-neutral-100 hover:bg-neutral-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs truncate tracking-wide text-neutral-900">
                        {group.name}
                      </span>
                      {isMine && (
                        <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                          TU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-neutral-500 truncate mt-0.5">
                      {group.courseName || "Curs"}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-medium mt-0.5 flex items-center justify-between">
                      <span className="truncate">{group.teacherName || "Neasignat"}</span>
                      <span className="font-semibold text-neutral-600">{group.studentCount ?? 0} el.</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Days and Academic Pairs */}
          <tbody className="divide-y divide-neutral-200">
            {daysToShow.map((day) => {
              const occupiedPairSet = getOccupiedPairIndicesForDay(displayGroups, day.key);
              const pairsForDay = hideEmptySlots && occupiedPairSet.size > 0
                ? ACADEMIC_PAIRS.filter((p) => occupiedPairSet.has(p.index))
                : ACADEMIC_PAIRS;

              return (
                <Fragment key={day.key}>
                  {pairsForDay.map((pair, pairIdx) => (
                    <tr
                      key={`${day.key}_${pair.index}`}
                      className="hover:bg-neutral-50/50 transition divide-x divide-neutral-200 border-b border-neutral-200"
                    >
                      {/* Sticky Day Column (spans pairsForDay.length rows) */}
                      {pairIdx === 0 && (
                        <td
                          rowSpan={pairsForDay.length}
                          className="sticky left-0 z-20 bg-neutral-100 font-extrabold text-neutral-800 text-center border-r border-neutral-300 p-2 uppercase tracking-widest text-xs align-middle w-[40px] min-w-[40px]"
                          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                        >
                          <div className="py-2 rotate-180 flex items-center justify-center font-black tracking-wider text-neutral-900">
                            {day.label}
                          </div>
                        </td>
                      )}

                      {/* Pair Time Cell (sticky next to Day column) */}
                      <td
                        className="sticky left-[40px] z-10 bg-neutral-50/95 backdrop-blur-xs px-2 py-1.5 text-center font-semibold text-neutral-700 border-r border-neutral-300 min-w-[110px] w-[110px]"
                      >
                        <div className="text-[11px] font-bold text-neutral-900">{pair.label}</div>
                        <div className="text-[9px] text-neutral-400 uppercase font-bold">
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
                            className="p-1 border-r border-neutral-200 last:border-r-0 bg-white hover:bg-neutral-50/70 transition-colors"
                          >
                            <div className="h-full min-h-[52px]" />
                          </td>
                        );
                      }

                      const palette = getCourseColor(group.courseId);
                      const isMine = currentUserId && group.teacherId === currentUserId;

                      return (
                        <td
                          key={group.id}
                          onClick={() => onSelectEvent(group)}
                          className={`p-1.5 border-r border-neutral-200 last:border-r-0 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${palette.bg} ${
                            isMine ? "ring-2 ring-emerald-500 ring-inset" : ""
                          }`}
                          title={`${group.courseName || "Curs"}: ${group.name}\nProfesor: ${group.teacherName || "Neasignat"}\nSală: ${group.room || "Nespecificată"}\nOrar: ${group.scheduleTime || pair.label}\nElevi înscriși: ${group.studentCount ?? 0}`}
                        >
                          <div className="h-full flex flex-col justify-between p-1.5 rounded-lg border border-neutral-300/80 bg-white/70 shadow-2xs space-y-1">
                            {/* Discipline / Course Title */}
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-[11px] text-neutral-900 leading-tight line-clamp-2">
                                {group.courseName || group.name}
                              </span>
                              {isMine && (
                                <ShieldCheckIcon className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </div>

                            {/* Teacher & Aula / Room */}
                            <div className="flex items-center justify-between text-[10px] text-neutral-600 pt-0.5 border-t border-neutral-200">
                              <span className="truncate font-medium max-w-[65%] text-neutral-800">
                                {group.teacherName ? group.teacherName : <span className="italic text-neutral-400">Neasignat</span>}
                              </span>
                              <span className="font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-white text-[9px] shrink-0">
                                {group.room ? group.room : "Fără sală"}
                              </span>
                            </div>

                            {/* Exact time & Student Count */}
                            <div className="flex items-center justify-between text-[9px] text-neutral-500">
                              <span className="truncate">{group.scheduleTime || pair.label}</span>
                              <span className="font-semibold text-blue-700">
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
