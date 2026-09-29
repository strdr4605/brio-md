"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GroupFormModal, GroupItem } from "./GroupFormModal";
import {
  UsersIcon,
  CalendarIcon,
  DoorIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";

type CourseGroupsTabProps = {
  courseId: number;
  courseName: string;
  schoolId?: number | null;
  onOpenRoster?: (group: { id: number; name: string }) => void;
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

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Fără program stabilit";
}

export function CourseGroupsTab({
  courseId,
  courseName,
  schoolId,
  onOpenRoster,
}: CourseGroupsTabProps) {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);

  const utils = trpc.useUtils();

  // Fetch groups for this course
  const { data: groups = [], isLoading, error } = trpc.group.list.useQuery({
    courseId,
  });

  // Archive / Reactivate mutation
  const toggleActiveMutation = trpc.group.toggleActive.useMutation({
    onSuccess: () => {
      utils.group.invalidate();
    },
  });

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: GroupItem) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleToggleActive = (group: GroupItem) => {
    const actionName = group.active ? "arhivată" : "reactivată";
    if (confirm(`Ești sigur că dorești ca grupa "${group.name}" să fie ${actionName}?`)) {
      toggleActiveMutation.mutate({
        id: group.id,
        active: !group.active,
      });
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    // Status filter
    if (filterTab === "active" && !g.active) return false;
    if (filterTab === "archived" && g.active) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchRoom = g.room?.toLowerCase().includes(q) ?? false;
      const matchTeacher = g.teacherName?.toLowerCase().includes(q) ?? false;
      return matchName || matchRoom || matchTeacher;
    }
    return true;
  });

  const activeCount = groups.filter((g) => g.active).length;
  const archivedCount = groups.filter((g) => !g.active).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "active"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "archived"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Arhivate ({archivedCount})
          </button>
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Toate ({groups.length})
          </button>
        </div>

        {/* Search & Add Group Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după nume, profesor, sală..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-64 transition"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Adaugă Grupă</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl">
          Eroare la încărcarea grupelor: {error.message}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
            <UsersIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {search ? "Nicio grupă găsită" : "Nu există grupe create"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            {search
              ? "Niciun rezultat nu corespunde termenilor căutați. Încearcă un alt cuvânt cheie."
              : `Cursul "${courseName}" nu are nicio grupă alocată în această categorie. Creează prima grupă pentru a programa orele.`}
          </p>
          {!search && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Creează prima grupă</span>
            </button>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const studentCount = group.studentCount ?? 0;
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  {/* Header: Title and Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {group.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        group.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "bg-slate-100 text-slate-500 border border-slate-200/60"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${group.active ? "bg-emerald-600" : "bg-slate-400"}`} />
                      {group.active ? "Activă" : "Arhivată"}
                    </span>
                  </div>

                  {/* Schedule details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {formatSchedule(group.scheduleDays, group.scheduleTime)}
                      </span>
                    </div>

                    {/* Room / Building */}
                    <div className="flex items-center gap-2">
                      <DoorIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {group.room ? group.room : <span className="text-slate-400 italic">Sală nespecificată</span>}
                      </span>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        P
                      </div>
                      <span className="truncate">
                        {group.teacherName ? (
                          <span className="font-semibold text-slate-800">{group.teacherName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Profesor neasignat</span>
                        )}
                      </span>
                    </div>

                    {/* Student count badge */}
                    <div className="flex items-center gap-2 pt-1">
                      <UsersIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/70 font-semibold text-xs">
                        {studentCount} {studentCount === 1 ? "elev înscris" : "elevi înscriși"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(group as GroupItem)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleToggleActive(group as GroupItem)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        group.active
                          ? "text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {group.active ? "Arhivează" : "Reactivează"}
                    </button>
                  </div>

                  {onOpenRoster && (
                    <button
                      onClick={() => onOpenRoster({ id: group.id, name: group.name })}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                      <span>Elevi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <GroupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        schoolId={schoolId}
        groupToEdit={editingGroup}
      />
    </div>
  );
}
