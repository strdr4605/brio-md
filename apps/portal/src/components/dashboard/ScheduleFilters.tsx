"use client";

import { useMemo } from "react";
import { GroupItem } from "./GroupFormModal";
import { DAYS_OF_WEEK } from "./scheduleTypes";
import {
  SearchIcon,
  FilterIcon,
  DoorIcon,
  UsersIcon,
  CalendarIcon,
  DashboardIcon,
  ShieldCheckIcon,
  XIcon,
} from "@/components/ui/icons";

export type ViewMode = "matrix" | "rooms" | "week";
export type SortMode = "name_asc" | "name_desc" | "course" | "students";

export type ScheduleFiltersProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  hideEmptySlots: boolean;
  onToggleHideEmptySlots: () => void;
  selectedGroup: string;
  onSelectGroup: (groupId: string) => void;
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  selectedCourse: string;
  onSelectCourse: (courseId: string) => void;
  onlyMyGroups: boolean;
  onToggleOnlyMyGroups: (val: boolean) => void;
  currentUserId: number | null;
  search: string;
  onSearchChange: (search: string) => void;
  scheduledGroups: GroupItem[];
  rooms: string[];
  courses: { id: number; name: string }[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
};

export function ScheduleFilters({
  viewMode,
  onViewModeChange,
  selectedDay,
  onSelectDay,
  sortMode,
  onSortModeChange,
  hideEmptySlots,
  onToggleHideEmptySlots,
  selectedGroup,
  onSelectGroup,
  selectedRoom,
  onSelectRoom,
  selectedCourse,
  onSelectCourse,
  onlyMyGroups,
  onToggleOnlyMyGroups,
  currentUserId,
  search,
  onSearchChange,
  scheduledGroups,
  rooms,
  courses,
  onResetFilters,
  hasActiveFilters,
}: ScheduleFiltersProps) {
  // Determine current day of week key to allow quick "Azi" focus
  const todayDayKey = useMemo(() => {
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const idx = new Date().getDay();
    return dayMap[idx] || "mon";
  }, []);

  const isTodayActive = selectedDay === todayDayKey;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Row 1: View mode tabs & Day selector & Empty slots toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "matrix"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DashboardIcon className="w-3.5 h-3.5" />
            <span>Matrice Grupe</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("rooms")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "rooms"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DoorIcon className="w-3.5 h-3.5" />
            <span>Distribuție Săli</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "week"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Săptămânal</span>
          </button>
        </div>

        {/* Day Selector with Quick "Azi" Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick "Azi" button */}
          <button
            type="button"
            onClick={() => onSelectDay(todayDayKey)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1 ${
              isTodayActive
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
            }`}
            title="Sari direct la ziua curentă"
          >
            <span>Azi</span>
          </button>

          {/* All Days button */}
          <button
            type="button"
            onClick={() => onSelectDay("all")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDay === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Toate Zilele
          </button>

          {/* Mon-Sat pills */}
          {DAYS_OF_WEEK.slice(0, 6).map((day) => {
            const isSelected = selectedDay === day.key;
            const isToday = todayDayKey === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {day.label}
                {isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute top-1 right-1" />
                )}
              </button>
            );
          })}

          {/* Hide/Show Empty Slots */}
          <button
            type="button"
            onClick={onToggleHideEmptySlots}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto sm:ml-0 ${
              hideEmptySlots
                ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
            }`}
            title="Comută între afișarea doar a orelor ocupate sau a tuturor orelor"
          >
            <span>{hideEmptySlots ? "Ore Ocupate" : "Toate Orele"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Secondary Dropdown Filters & Search */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Caută grupă, curs, sală, profesor..."
            className="w-full pl-8.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1.5">
          <UsersIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedGroup}
            onChange={(e) => onSelectGroup(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
          >
            <option value="all">Toate Grupele ({scheduledGroups.length})</option>
            {scheduledGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Room Selector */}
        <div className="flex items-center gap-1.5">
          <DoorIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRoom}
            onChange={(e) => onSelectRoom(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
          >
            <option value="all">Toate Sălile ({rooms.length})</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Course Selector */}
        <div className="flex items-center gap-1.5">
          <FilterIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCourse}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
          >
            <option value="all">Toate Cursurile ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-semibold">Sortare:</span>
          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as SortMode)}
            className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="name_asc">A &rarr; Z</option>
            <option value="name_desc">Z &rarr; A</option>
            <option value="course">Curs</option>
            <option value="students">Nr. Elevi</option>
          </select>
        </div>

        {/* Teacher's "Grupele mele" Toggle */}
        {currentUserId && (
          <button
            type="button"
            onClick={() => onToggleOnlyMyGroups(!onlyMyGroups)}
            className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              onlyMyGroups
                ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Grupele mele</span>
          </button>
        )}

        {/* Reset Filters Action */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition border border-rose-200/80 cursor-pointer"
          >
            Resetează filtre
          </button>
        )}
      </div>
    </div>
  );
}
