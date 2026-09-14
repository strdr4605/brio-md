"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { formatPhone } from "@/lib/phone";
import {
  XIcon,
  PlusIcon,
  PhoneIcon,
  UsersIcon,
  CalendarIcon,
} from "@/components/ui/icons";
import { EnrollmentDrawer } from "./EnrollmentDrawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  schoolId?: number | null;
};

type StatusFilterTab = "active" | "inactive_or_archived" | "all";

export function CourseGroupsDrawer({
  isOpen,
  onClose,
  courseId,
  courseName,
  schoolId,
}: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("active");
  const [showAddStudentDrawer, setShowAddStudentDrawer] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);

  // Quick group creation form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupScheduleTime, setNewGroupScheduleTime] = useState("");
  const [newGroupRoom, setNewGroupRoom] = useState("");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // 1. Fetch groups for this course
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
  } = trpc.group.list.useQuery(
    { courseId },
    { enabled: isOpen && Boolean(courseId) },
  );

  // Auto-select first group if none selected
  const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].id : null);
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;

  // 2. Fetch roster for the active group filtered by status tab
  const {
    data: roster = [],
    isLoading: isLoadingRoster,
  } = trpc.enrollment.listByGroup.useQuery(
    { groupId: activeGroupId!, status: activeTab },
    { enabled: isOpen && Boolean(activeGroupId) },
  );

  // 3. Count counts for active vs inactive/archived to show on tab badges
  const { data: allRoster = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: activeGroupId!, status: "all" },
    { enabled: isOpen && Boolean(activeGroupId) },
  );

  const activeCount = allRoster.filter((r) => r.status === "active").length;
  const inactiveArchivedCount = allRoster.filter(
    (r) => r.status === "inactive" || r.status === "archived",
  ).length;

  // Mutations
  const updateStatusMutation = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => {
      utils.enrollment.invalidate();
    },
  });

  const createGroupMutation = trpc.group.create.useMutation({
    onSuccess: (newGroup) => {
      utils.group.invalidate();
      setSelectedGroupId(newGroup.id);
      setShowCreateGroupForm(false);
      setNewGroupName("");
      setNewGroupScheduleTime("");
      setNewGroupRoom("");
      setCreateGroupError(null);
    },
    onError: (err) => setCreateGroupError(err.message),
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateGroupError("Numele grupei este obligatoriu.");
      return;
    }
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      courseId,
      scheduleTime: newGroupScheduleTime.trim() || null,
      room: newGroupRoom.trim() || null,
      schoolId: schoolId || null,
    });
  };

  const handleStatusChange = (enrollmentId: number, nextStatus: "active" | "inactive" | "archived") => {
    updateStatusMutation.mutate({
      enrollmentId,
      status: nextStatus,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header - Pinned */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                Gestiune Grupe & Roster
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{courseName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrează cohortele, orarul grupelor și înscrierile studenților
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Groups Selection Strip */}
        <div className="px-6 py-3 border-b border-slate-200/80 bg-slate-50/70 shrink-0 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {isLoadingGroups ? (
              <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
            ) : groups.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Nu există grupe create</span>
            ) : (
              groups.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => {
                    setSelectedGroupId(grp.id);
                    setShowCreateGroupForm(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    activeGroupId === grp.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {grp.name}
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => setShowCreateGroupForm((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1 shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{showCreateGroupForm ? "Închide Formular" : "Adaugă Grupă"}</span>
          </button>
        </div>

        {/* Inline Create Group Form */}
        {showCreateGroupForm && (
          <form
            onSubmit={handleCreateGroup}
            className="px-6 py-4 bg-blue-50/40 border-b border-blue-100 shrink-0 space-y-3 animate-fade-in-up"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Creează o nouă grupă pentru acest curs
            </h4>
            {createGroupError && (
              <p className="text-xs text-rose-600 font-medium">{createGroupError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nume Grupă *
                </label>
                <input
                  type="text"
                  placeholder="ex: Grupa A - Marți 17:30"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Program Orar
                </label>
                <input
                  type="text"
                  placeholder="ex: 17:30 - 19:00"
                  value={newGroupScheduleTime}
                  onChange={(e) => setNewGroupScheduleTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sală / Clădire / Club
                </label>
                <input
                  type="text"
                  placeholder="ex: Sala 3 / Club Robotics"
                  value={newGroupRoom}
                  onChange={(e) => setNewGroupRoom(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateGroupForm(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="px-4 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {createGroupMutation.isPending ? "Se creează..." : "Salvează Grupa"}
              </button>
            </div>
          </form>
        )}

        {/* Active Group Metadata Card */}
        {activeGroup && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-blue-600" />
                {activeGroup.name}
              </span>
              {activeGroup.scheduleTime && (
                <span className="flex items-center gap-1 text-slate-500">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  {activeGroup.scheduleTime}
                </span>
              )}
              {activeGroup.room && (
                <span className="text-slate-500">📍 {activeGroup.room}</span>
              )}
              {activeGroup.teacherName && (
                <span className="text-slate-500">👨‍🏫 {activeGroup.teacherName}</span>
              )}
            </div>

            <button
              onClick={() => setShowAddStudentDrawer(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Înrolează Studenți</span>
            </button>
          </div>
        )}

        {/* Roster Status Filter Tabs (Required Acceptance Criteria) */}
        {activeGroup && (
          <div className="px-6 pt-3 shrink-0 border-b border-slate-200/80 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("active")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "active"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Activ</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "active"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("inactive_or_archived")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "inactive_or_archived"
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Inactiv / Arhivat</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "inactive_or_archived"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {inactiveArchivedCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "border-slate-800 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Toate</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                  {allRoster.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Body - Student Roster List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {!activeGroup ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nu a fost selectată nicio grupă</p>
              <p className="text-xs text-slate-400 mt-1">
                Apasă pe &quot;Adaugă Grupă&quot; de mai sus pentru a crea prima cohortă a cursului.
              </p>
            </div>
          ) : isLoadingRoster ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-700">
                {activeTab === "active"
                  ? "Nu există studenți activi în această grupă"
                  : activeTab === "inactive_or_archived"
                    ? "Nu există studenți inactivi sau arhivați"
                    : "Nu este înrolat niciun student"}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Folosește butonul de înrolare pentru a adăuga studenți în grupă.
              </p>
              <button
                onClick={() => setShowAddStudentDrawer(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                + Înrolează primul student
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {roster.map((member) => (
                <div
                  key={member.enrollmentId}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {member.studentName}
                      </span>
                      {member.status === "active" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activ
                        </span>
                      ) : member.status === "inactive" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Inactiv
                        </span>
                      ) : member.status === "archived" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Arhivat
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Completat
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {member.studentPhone && (
                        <a
                          href={`tel:${member.studentPhone}`}
                          className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
                        >
                          <PhoneIcon className="w-3 h-3 text-slate-400" />
                          <span>{formatPhone(member.studentPhone)}</span>
                        </a>
                      )}
                      {member.parentName && (
                        <span>
                          Tutore: <strong className="text-slate-700">{member.parentName}</strong>
                          {member.parentPhone ? ` (${formatPhone(member.parentPhone)})` : ""}
                        </span>
                      )}
                      {member.joinedAt && (
                        <span>
                          Înscris la {new Date(member.joinedAt).toLocaleDateString("ro-RO")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fast Toggle / Dropdown for Status */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">Modifică Status:</span>
                    <select
                      value={member.status || "active"}
                      onChange={(e) =>
                        handleStatusChange(
                          member.enrollmentId,
                          e.target.value as "active" | "inactive" | "archived",
                        )
                      }
                      disabled={updateStatusMutation.isPending}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="active">Activ</option>
                      <option value="inactive">Inactiv</option>
                      <option value="archived">Arhivat</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pinned */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {allRoster.length} {allRoster.length === 1 ? "student înrolat" : "studenți înrolați"} în
            această grupă
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition"
          >
            Închide
          </button>
        </div>
      </div>

      {/* Embedded Enrollment Drawer in Group Mode */}
      {showAddStudentDrawer && activeGroupId && (
        <EnrollmentDrawer
          isOpen={showAddStudentDrawer}
          onClose={() => setShowAddStudentDrawer(false)}
          groupId={activeGroupId}
          groupName={activeGroup?.name}
          courseName={courseName}
          schoolId={schoolId}
        />
      )}
    </div>,
    document.body,
  );
}
