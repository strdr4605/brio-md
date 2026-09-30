"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupItem, GroupFormModal } from "./GroupFormModal";
import { ScheduleEventModal } from "./ScheduleEventModal";
import { CourseGroupsDrawer } from "./CourseGroupsDrawer";
import { ScheduleAttendanceModal } from "./ScheduleAttendanceModal";
import { ScheduleMatrixView } from "./ScheduleMatrixView";
import { ScheduleRoomView } from "./ScheduleRoomView";
import { ScheduleWeekView } from "./ScheduleWeekView";
import { ScheduleKpiCards } from "./ScheduleKpiCards";
import { ScheduleFilters, ViewMode, SortMode } from "./ScheduleFilters";
import { parseStartHour } from "./scheduleTypes";

export function ScheduleCalendar() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

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
  const [attendanceGroup, setAttendanceGroup] = useState<GroupItem | null>(null);

  const { data: groups = [], isLoading } = trpc.group.list.useQuery({ active: true });

  const scheduledGroups = useMemo(() => {
    return (groups as GroupItem[]).filter(
      (g) => g.scheduleDays && g.scheduleDays.length > 0 && Boolean(g.scheduleTime)
    );
  }, [groups]);

  const rooms = useMemo(() => {
    return Array.from(
      new Set(scheduledGroups.map((g) => g.room?.trim() || "Fără sală alocată"))
    ).sort();
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

  const conflictSlotsCount = useMemo(() => {
    return Array.from(conflicts.values()).filter((c) => c > 1).length;
  }, [conflicts]);

  const totalStudents = useMemo(() => {
    return scheduledGroups.reduce((acc, g) => acc + (g.studentCount || 0), 0);
  }, [scheduledGroups]);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedDay !== "all" ||
      selectedGroup !== "all" ||
      selectedRoom !== "all" ||
      selectedCourse !== "all" ||
      onlyMyGroups ||
      Boolean(search.trim())
    );
  }, [selectedDay, selectedGroup, selectedRoom, selectedCourse, onlyMyGroups, search]);

  const handleResetFilters = useCallback(() => {
    setSelectedDay("all");
    setSelectedGroup("all");
    setSelectedRoom("all");
    setSelectedCourse("all");
    setOnlyMyGroups(false);
    setSearch("");
  }, []);

  const filteredGroups = useMemo(() => {
    return scheduledGroups.filter((g) => {
      if (onlyMyGroups && currentUserId && g.teacherId !== currentUserId) return false;
      if (selectedGroup !== "all" && g.id !== Number(selectedGroup)) return false;
      if (selectedRoom !== "all" && (g.room?.trim() || "Fără sală alocată") !== selectedRoom)
        return false;
      if (selectedCourse !== "all" && g.courseId !== Number(selectedCourse)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          g.name.toLowerCase().includes(q) ||
          (g.courseName?.toLowerCase().includes(q) ?? false) ||
          (g.teacherName?.toLowerCase().includes(q) ?? false) ||
          (g.room?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [
    scheduledGroups,
    onlyMyGroups,
    currentUserId,
    selectedGroup,
    selectedRoom,
    selectedCourse,
    search,
  ]);

  const sortedAndFilteredGroups = useMemo(() => {
    const list = [...filteredGroups];
    if (sortMode === "name_asc")
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    else if (sortMode === "name_desc")
      list.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
    else if (sortMode === "course")
      list.sort((a, b) => (a.courseName || "").localeCompare(b.courseName || ""));
    else if (sortMode === "students")
      list.sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0));
    return list;
  }, [filteredGroups, sortMode]);

  return (
    <div className="space-y-4">
      {/* Schedule KPI Summary Cards */}
      <ScheduleKpiCards
        totalGroups={scheduledGroups.length}
        activeRoomsCount={rooms.length}
        totalStudents={totalStudents}
        conflictSlotsCount={conflictSlotsCount}
        isLoading={isLoading}
      />

      {/* Decomposed Modular Filters & Toolbar */}
      <ScheduleFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        hideEmptySlots={hideEmptySlots}
        onToggleHideEmptySlots={() => setHideEmptySlots((v) => !v)}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
        onlyMyGroups={onlyMyGroups}
        onToggleOnlyMyGroups={setOnlyMyGroups}
        currentUserId={currentUserId}
        search={search}
        onSearchChange={setSearch}
        scheduledGroups={scheduledGroups}
        rooms={rooms}
        courses={courses}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main View Display */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
          <div className="h-72 bg-slate-100 rounded-xl" />
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
        onOpenAttendance={(grp) => setAttendanceGroup(grp)}
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
          initialGroupId={rosterGroup.id}
        />
      )}

      {/* Attendance Modal */}
      {attendanceGroup && (
        <ScheduleAttendanceModal
          isOpen={Boolean(attendanceGroup)}
          onClose={() => setAttendanceGroup(null)}
          groupId={attendanceGroup.id}
          groupName={attendanceGroup.name}
          courseName={attendanceGroup.courseName}
        />
      )}
    </div>
  );
}
