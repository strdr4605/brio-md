"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupItem, GroupFormModal } from "./GroupFormModal";
import { ScheduleEventModal } from "./ScheduleEventModal";
import { CourseGroupsDrawer } from "./CourseGroupsDrawer";
import { ScheduleMatrixView } from "./ScheduleMatrixView";
import { ScheduleRoomView } from "./ScheduleRoomView";
import { ScheduleWeekView } from "./ScheduleWeekView";
import { DAYS_OF_WEEK, parseStartHour } from "./scheduleTypes";
import { DoorIcon, SearchIcon, FilterIcon, UsersIcon } from "@/components/ui/icons";

type ViewMode = "matrix" | "rooms" | "week";
type SortMode = "name_asc" | "name_desc" | "course" | "students";

export function ScheduleCalendar() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin = permissions.includes("super") || permissions.includes("admin") || role === "superadmin" || role === "admin";

  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [sortMode, setSortMode] = useState<SortMode>("name_asc");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [hideEmptySlots, setHideEmptySlots] = useState(true);
  const [onlyMyGroups, setOnlyMyGroups] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<GroupItem | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<GroupItem | null>(null);
  const [rosterGroup, setRosterGroup] = useState<GroupItem | null>(null);

  const { data: groups = [], isLoading } = trpc.group.list.useQuery({ active: true });

  const scheduledGroups = useMemo(() => {
    return (groups as GroupItem[]).filter(
      (g) => g.scheduleDays && g.scheduleDays.length > 0 && Boolean(g.scheduleTime)
    );
  }, [groups]);

  const rooms = useMemo(() => {
    return Array.from(new Set(scheduledGroups.map((g) => g.room?.trim() || "Fără sală alocată"))).sort();
  }, [scheduledGroups]);

  const courses = useMemo(() => {
    const map = new Map<number, string>();
    scheduledGroups.forEach((g) => {
      if (g.courseId && g.courseName) map.set(g.courseId, g.courseName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [scheduledGroups]);

  const conflicts = useMemo(() => {
    const slotMap = new Map<string, number>();
    scheduledGroups.forEach((g) => {
      const roomKey = g.room?.trim() || "Fără sală alocată";
      const startH = parseStartHour(g.scheduleTime);
      (g.scheduleDays || []).forEach((d) => {
        const key = `${d.toLowerCase()}_${roomKey}_${startH}`;
        slotMap.set(key, (slotMap.get(key) || 0) + 1);
      });
    });
    return slotMap;
  }, [scheduledGroups]);

  const filteredGroups = useMemo(() => {
    return scheduledGroups.filter((g) => {
      if (onlyMyGroups && currentUserId && g.teacherId !== currentUserId) return false;
      if (selectedGroup !== "all" && g.id !== Number(selectedGroup)) return false;
      if (selectedRoom !== "all" && (g.room?.trim() || "Fără sală alocată") !== selectedRoom) return false;
      if (selectedCourse !== "all" && g.courseId !== Number(selectedCourse)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = g.name.toLowerCase().includes(q) ||
          (g.courseName?.toLowerCase().includes(q) ?? false) ||
          (g.teacherName?.toLowerCase().includes(q) ?? false) ||
          (g.room?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [scheduledGroups, onlyMyGroups, currentUserId, selectedGroup, selectedRoom, selectedCourse, search]);

  const sortedAndFilteredGroups = useMemo(() => {
    const list = [...filteredGroups];
    if (sortMode === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    else if (sortMode === "name_desc") list.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
    else if (sortMode === "course") list.sort((a, b) => (a.courseName || "").localeCompare(b.courseName || ""));
    else if (sortMode === "students") list.sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0));
    return list;
  }, [filteredGroups, sortMode]);

  return (
    <div className="space-y-4">
      {/* Top Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Mode Toggle: Matrice Grupe, Săli, Săptămânal */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "matrix" ? "bg-white text-blue-700 shadow-sm border border-neutral-200" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>🏛️</span>
              <span>Matrice Grupe</span>
            </button>
            <button
              onClick={() => setViewMode("rooms")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "rooms" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Distribuție Săli
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "week" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Săptămânal
            </button>
          </div>

          {/* Group Sorting, Hide Empty Toggle & Day Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Group Sorting Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <span className="text-neutral-400 font-semibold">Grupe:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent font-semibold text-neutral-800 outline-none cursor-pointer"
              >
                <option value="name_asc">A &rarr; Z (Ordine)</option>
                <option value="name_desc">Z &rarr; A</option>
                <option value="course">După Curs</option>
                <option value="students">După Nr. Elevi</option>
              </select>
            </div>

            {/* Hide Empty / Show All Pairs Toggle */}
            <button
              type="button"
              onClick={() => setHideEmptySlots((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                hideEmptySlots
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-2xs"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
              title="Comută între afișarea doar a orelor ocupate sau a tuturor orelor"
            >
              <span>{hideEmptySlots ? "⚡ Doar ore ocupate" : "📋 Toate orele"}</span>
            </button>

            {/* Universal Day Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedDay("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedDay === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Toate Zilele
              </button>
              {DAYS_OF_WEEK.slice(0, 6).map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDay(day.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedDay === day.key
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-neutral-100 text-xs">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toate Grupele ({scheduledGroups.length})</option>
              {scheduledGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <DoorIcon className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toate Sălile ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <FilterIcon className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toate Cursurile ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {currentUserId && (
            <label className="flex items-center gap-1.5 cursor-pointer bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition font-medium">
              <input
                type="checkbox"
                checked={onlyMyGroups}
                onChange={(e) => setOnlyMyGroups(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Doar grupele mele</span>
            </label>
          )}

          <div className="relative flex-1 min-w-[160px]">
            <SearchIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută grupă, curs, sală, profesor..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main View Display */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-lg w-1/4" />
          <div className="h-72 bg-neutral-100 rounded-xl" />
        </div>
      ) : viewMode === "matrix" ? (
        <ScheduleMatrixView
          groups={sortedAndFilteredGroups}
          currentUserId={currentUserId}
          onSelectEvent={(group) => setSelectedEvent(group)}
          selectedDay={selectedDay}
          hideEmptySlots={hideEmptySlots}
        />
      ) : viewMode === "rooms" ? (
        <ScheduleRoomView
          rooms={rooms}
          selectedDay={selectedDay === "all" ? "mon" : selectedDay}
          filteredGroups={sortedAndFilteredGroups}
          conflicts={conflicts}
          currentUserId={currentUserId}
          onSelectEvent={(group) => setSelectedEvent(group)}
          hideEmptySlots={hideEmptySlots}
        />
      ) : (
        <ScheduleWeekView
          filteredGroups={sortedAndFilteredGroups}
          onSelectEvent={(group) => setSelectedEvent(group)}
          selectedDay={selectedDay}
          hideEmptySlots={hideEmptySlots}
        />
      )}

      {/* Event Details & Teacher Actions Modal */}
      <ScheduleEventModal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        group={selectedEvent}
        currentUserId={currentUserId}
        isSuperOrAdmin={isSuperOrAdmin}
        onOpenEdit={(grp) => setGroupToEdit(grp)}
        onOpenRoster={(grp) => setRosterGroup(grp)}
      />

      {/* Edit Group Modal */}
      {groupToEdit && (
        <GroupFormModal
          isOpen={Boolean(groupToEdit)}
          onClose={() => setGroupToEdit(null)}
          courseId={groupToEdit.courseId}
          schoolId={groupToEdit.schoolId}
          groupToEdit={groupToEdit}
        />
      )}

      {/* Roster Drawer */}
      {rosterGroup && (
        <CourseGroupsDrawer
          isOpen={Boolean(rosterGroup)}
          onClose={() => setRosterGroup(null)}
          courseId={rosterGroup.courseId}
          courseName={rosterGroup.courseName || "Curs"}
          schoolId={rosterGroup.schoolId}
        />
      )}
    </div>
  );
}
