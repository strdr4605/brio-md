"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon, PlusIcon, UsersIcon, CalendarIcon } from "@/components/ui/icons";
import { EnrollmentDrawer } from "./EnrollmentDrawer";
import { CourseRosterMemberRow } from "./CourseRosterMemberRow";
import { CourseGroupQuickCreateForm } from "./CourseGroupQuickCreateForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  schoolId?: number | null;
};

type StatusFilterTab = "active" | "inactive_or_archived" | "all";

export function CourseGroupsDrawer({ isOpen, onClose, courseId, courseName, schoolId }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("active");
  const [showAddStudentDrawer, setShowAddStudentDrawer] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // 1. Fetch groups for this course
  const { data: groups = [], isLoading: isLoadingGroups } = trpc.group.list.useQuery(
    { courseId },
    { enabled: isOpen && Boolean(courseId) },
  );

  const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].id : null);
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;

  // 2. Fetch roster for the active group filtered by status tab
  const { data: roster = [], isLoading: isLoadingRoster } = trpc.enrollment.listByGroup.useQuery(
    { groupId: activeGroupId!, status: activeTab },
    { enabled: isOpen && Boolean(activeGroupId) },
  );

  // 3. Count counts for active vs inactive/archived to show on tab badges
  const { data: allRoster = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: activeGroupId!, status: "all" },
    { enabled: isOpen && Boolean(activeGroupId) },
  );

  const activeCount = allRoster.filter((r) => r.status === "active").length;
  const inactiveArchivedCount = allRoster.filter((r) => r.status === "inactive" || r.status === "archived").length;

  const updateStatusMutation = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => utils.enrollment.invalidate(),
  });

  const createGroupMutation = trpc.group.create.useMutation({
    onSuccess: (newGroup) => {
      utils.group.invalidate();
      setSelectedGroupId(newGroup.id);
      setShowCreateGroupForm(false);
      setCreateGroupError(null);
    },
    onError: (err) => setCreateGroupError(err.message),
  });

  const handleCreateGroup = (data: { name: string; scheduleTime: string | null; room: string | null }) => {
    createGroupMutation.mutate({
      name: data.name,
      courseId,
      scheduleTime: data.scheduleTime,
      room: data.room,
      schoolId: schoolId || null,
    });
  };

  const handleStatusChange = (
    enrollmentId: number,
    nextStatus: "active" | "inactive" | "archived",
  ) => {
    updateStatusMutation.mutate({
      enrollmentId,
      status: nextStatus,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 animate-slide-left border-l border-slate-200/80">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Management Curs
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-700">{courseName}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Grupe de Studiu & Catalog Elevi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Navighează între cohorte, înrolează elevi și gestionează statusul participării.
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeGroupId === grp.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {grp.name}
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => setShowCreateGroupForm((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition flex items-center gap-1 shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{showCreateGroupForm ? "Închide Formular" : "Adaugă Grupă"}</span>
          </button>
        </div>

        {/* Inline Create Group Form */}
        {showCreateGroupForm && (
          <CourseGroupQuickCreateForm
            onSubmit={handleCreateGroup}
            onCancel={() => setShowCreateGroupForm(false)}
            isSubmitting={createGroupMutation.isPending}
            error={createGroupError}
          />
        )}

        {/* Active Group Metadata Card */}
        {activeGroup && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-slate-700" />
                {activeGroup.name}
              </span>
              {activeGroup.scheduleTime && (
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  {activeGroup.scheduleTime}
                </span>
              )}
              {activeGroup.room && <span className="text-slate-500">📍 {activeGroup.room}</span>}
              {activeGroup.teacherName && (
                <span className="text-slate-500">👨‍🏫 {activeGroup.teacherName}</span>
              )}
            </div>

            <button
              onClick={() => setShowAddStudentDrawer(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Înrolează Studenți</span>
            </button>
          </div>
        )}

        {/* Roster Status Filter Tabs */}
        {activeGroup && (
          <div className="px-6 pt-3 shrink-0 border-b border-slate-200/80 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("active")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "active"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Activ</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
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
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Inactiv / Arhivat</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "inactive_or_archived"
                      ? "bg-amber-50 text-amber-800 border border-amber-200/50"
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
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Toate</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                  {allRoster.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Body - Student Roster List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {!activeGroup ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <UsersIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Nu a fost selectată nicio grupă
              </p>
              <p className="text-xs text-slate-500 mt-1">
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
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-800">
                {activeTab === "active"
                  ? "Nu există studenți activi în această grupă"
                  : activeTab === "inactive_or_archived"
                    ? "Nu există studenți inactivi sau arhivați"
                    : "Nu este înrolat niciun student"}
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Folosește butonul de înrolare pentru a adăuga studenți în grupă.
              </p>
              <button
                onClick={() => setShowAddStudentDrawer(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
              >
                + Înrolează primul student
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {roster.map((member) => (
                <CourseRosterMemberRow
                  key={member.enrollmentId}
                  member={member}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pinned */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {allRoster.length} {allRoster.length === 1 ? "student înrolat" : "studenți înrolați"} în această grupă
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition"
          >
            Închide
          </button>
        </div>
      </div>

      {/* Embedded Enrollment Drawer in Group Mode */}
      {showAddStudentDrawer && activeGroupId && (
        <EnrollmentDrawer
          isOpen={showAddStudentDrawer}
          onCloseAction={() => setShowAddStudentDrawer(false)}
          groupId={activeGroupId}
          groupName={activeGroup?.name}
          courseId={courseId}
          courseName={courseName}
          schoolId={schoolId}
        />
      )}
    </div>,
    document.body,
  );
}
