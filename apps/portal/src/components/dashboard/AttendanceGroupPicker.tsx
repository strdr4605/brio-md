"use client";

import { useState, useMemo } from "react";
import {
  UsersIcon,
  CalendarIcon,
  DoorIcon,
  SearchIcon,
  BookOpenIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export type AttendanceGroupOption = {
  id: number;
  name: string;
  courseId: number;
  courseName?: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  room?: string | null;
  scheduleDays?: string[] | null;
  scheduleTime?: string | null;
  studentCount?: number;
  active?: boolean | null;
};

type AttendanceGroupPickerProps = {
  groups: AttendanceGroupOption[];
  onSelectGroup: (groupId: number) => void;
  isLoading?: boolean;
  currentUserId?: number | null;
};

const DAY_LABELS: Record<string, string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

const DAY_OF_WEEK_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Fără program stabilit";
}

export function AttendanceGroupPicker({
  groups,
  onSelectGroup,
  isLoading = false,
  currentUserId,
}: AttendanceGroupPickerProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "today" | "my">("all");

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  const uniqueTeachers = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of groups) {
      if (g.teacherId && g.teacherName) {
        map.set(g.teacherId, g.teacherName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [groups]);

  const todayKey = useMemo(() => {
    return DAY_OF_WEEK_KEYS[new Date().getDay()];
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const hasToday = (g.scheduleDays || []).some(
        (d) => d.toLowerCase() === todayKey,
      );
      const isMine = currentUserId && g.teacherId === currentUserId;

      if (filterTab === "today" && !hasToday) return false;
      if (filterTab === "my" && !isMine) return false;
      if (selectedTeacherId !== "all" && g.teacherId !== Number(selectedTeacherId)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchCourse = g.courseName?.toLowerCase().includes(q) ?? false;
        const matchRoom = g.room?.toLowerCase().includes(q) ?? false;
        const matchTeacher = g.teacherName?.toLowerCase().includes(q) ?? false;
        return matchName || matchCourse || matchRoom || matchTeacher;
      }

      return true;
    });
  }, [groups, filterTab, search, todayKey, currentUserId, selectedTeacherId]);

  const todayCount = useMemo(() => {
    return groups.filter((g) =>
      (g.scheduleDays || []).some((d) => d.toLowerCase() === todayKey),
    ).length;
  }, [groups, todayKey]);

  const myCount = useMemo(() => {
    if (!currentUserId) return 0;
    return groups.filter((g) => g.teacherId === currentUserId).length;
  }, [groups, currentUserId]);

  return (
    <div className="space-y-5">
      {/* Control & Filter Deck */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Segmented Control */}
        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer font-bold ${
              filterTab === "all"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Toate Grupele ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("today")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer font-bold flex items-center gap-1.5 ${
              filterTab === "today"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Lecție Azi ({todayCount})</span>
          </button>
          {Boolean(currentUserId) && (
            <button
              type="button"
              onClick={() => setFilterTab("my")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer font-bold ${
                filterTab === "my"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Grupele Mele ({myCount})
            </button>
          )}
        </div>

        {/* Right side filters: Teacher dropdown & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {uniqueTeachers.length > 1 && (
            <div className="relative">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="all">Toți profesorii ({uniqueTeachers.length})</option>
                {uniqueTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută grupă, sală, profesor..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <UsersIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {search ? "Nicio grupă găsită" : "Nu există grupe disponibile"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? "Nu a fost găsită nicio grupă conform filtrelor alese. Încercați alt termen de căutare."
              : "Nu aveți grupe alocate pentru completarea catalogului de prezență."}
          </p>
        </div>
      )}

      {/* Groups Selection Grid */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const hasToday = (group.scheduleDays || []).some(
              (d) => d.toLowerCase() === todayKey,
            );
            const isMine = currentUserId && group.teacherId === currentUserId;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${
                  hasToday
                    ? "border-emerald-200/90 hover:border-emerald-400"
                    : "border-slate-200/80 hover:border-blue-400"
                }`}
              >
                <div className="space-y-3">
                  {/* Top line: Course & Today indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg truncate max-w-[65%]">
                      {group.courseName || "Curs"}
                    </span>
                    {hasToday ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Azi: {group.scheduleTime || "Orar"}</span>
                      </span>
                    ) : isMine ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Grupa Ta
                      </span>
                    ) : null}
                  </div>

                  {/* Group Name */}
                  <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                    {group.name}
                  </h3>

                  {/* Schedule details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {formatSchedule(group.scheduleDays, group.scheduleTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <DoorIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{group.room || "Fără sală"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 font-semibold truncate">
                        <BookOpenIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{group.teacherName || "Neasignat"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-[11px] text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    {group.studentCount ?? 0} elevi înscriși
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform text-xs">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Deschide Catalogul &rarr;</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
