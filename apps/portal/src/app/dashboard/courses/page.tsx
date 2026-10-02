"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { EmptyState, ACADEMIC_LABELS } from "@brio-md/ui";
import { trpc } from "@/lib/trpc";
import { CourseFormDrawer } from "@/components/dashboard/CourseForm";
import { CourseGroupsDrawer } from "@/components/dashboard/CourseGroupsDrawer";
import { CourseCardGrid } from "@/components/dashboard/CourseCardGrid";
import {
  PlusIcon,
  SearchIcon,
  DoorIcon,
} from "@/components/ui/icons";

export default function CoursesPage() {
  const { data: session, status: authStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedCourseForGroups, setSelectedCourseForGroups] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    error,
  } = trpc.course.list.useQuery(
    { search: search.trim() || undefined },
    { enabled: isSuperOrAdmin },
  );

  const { data: groups = [] } = trpc.group.list.useQuery(
    { schoolId: session?.user?.schoolId || undefined, allSchoolGroups: true },
    { enabled: isSuperOrAdmin },
  );

  const toggleMutation = trpc.course.toggleActive.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      utils.group.list.invalidate();
    },
  });

  const deleteMutation = trpc.course.delete.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      utils.group.list.invalidate();
    },
  });

  if (authStatus === "loading") {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-14 bg-slate-200/80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-64 bg-slate-200/80 rounded-2xl" />
          <div className="h-64 bg-slate-200/80 rounded-2xl" />
          <div className="h-64 bg-slate-200/80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <DoorIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu ai permisiuni suficiente pentru a gestiona cursurile.
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    setSelectedCourseId(null);
    setShowDrawer(true);
  };

  const handleEdit = (id: number) => {
    setSelectedCourseId(id);
    setShowDrawer(true);
  };

  const handleToggleActive = (id: number, currentActive: boolean | null) => {
    toggleMutation.mutate({ id, active: !currentActive });
  };

  const handleDelete = (id: number, name: string) => {
    if (
      confirm(
        `Sigur doriți să ștergeți cursul "${name}"? Această acțiune este ireversibilă.`,
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in-up pb-12">
        {/* Header with Title and Action Trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {ACADEMIC_LABELS.courses.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Administrează cursurile, orarele, sălile și capacitatea grupelor
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{ACADEMIC_LABELS.courses.newCourse}</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută curs după nume..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Resetează
            </button>
          )}
        </div>

        {/* Error handling */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            Eroare la încărcarea cursurilor: {error.message}
          </div>
        )}

        {/* Skeletons Loading State */}
        {isLoadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white border border-slate-200/80 rounded-2xl p-5 h-64 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 rounded-md w-2/3" />
                  <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                </div>
                <div className="h-10 bg-slate-100 rounded-md w-full" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          /* Empty State using shared EmptyState primitive */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <EmptyState
              title={ACADEMIC_LABELS.courses.emptyTitle}
              description={
                search
                  ? "Nu a fost găsit niciun curs care să corespundă termenilor căutării."
                  : ACADEMIC_LABELS.courses.emptyDescription
              }
              action={
                !search ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>{ACADEMIC_LABELS.courses.newCourse}</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          /* Modern Card Grid with Capacity, Room, Teacher */
          <CourseCardGrid
            courses={courses}
            groups={groups as any}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onOpenRoster={(course) => setSelectedCourseForGroups(course)}
          />
        )}
      </div>

      {/* Course Edit / Create Drawer Modal */}
      {showDrawer && (
        <CourseFormDrawer
          courseId={selectedCourseId}
          onClose={() => setShowDrawer(false)}
          currentUserSchoolId={session?.user?.schoolId}
        />
      )}

      {/* Groups & Roster Drawer */}
      {selectedCourseForGroups && (
        <CourseGroupsDrawer
          isOpen={Boolean(selectedCourseForGroups)}
          onClose={() => setSelectedCourseForGroups(null)}
          courseId={selectedCourseForGroups.id}
          courseName={selectedCourseForGroups.name}
          schoolId={session?.user?.schoolId}
        />
      )}
    </>
  );
}
