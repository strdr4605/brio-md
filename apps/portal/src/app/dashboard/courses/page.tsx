"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { CourseFormDrawer } from "@/components/dashboard/CourseForm";
import { CourseGroupsDrawer } from "@/components/dashboard/CourseGroupsDrawer";
import { CourseListTable } from "@/components/dashboard/CourseListTable";
import {
  PlusIcon,
  SearchIcon,
  BookOpenIcon,
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
    isLoading,
    error,
  } = trpc.course.list.useQuery(
    { search: search.trim() || undefined },
    { enabled: isSuperOrAdmin },
  );

  const toggleMutation = trpc.course.toggleActive.useMutation({
    onSuccess: () => utils.course.list.invalidate(),
  });

  const deleteMutation = trpc.course.delete.useMutation({
    onSuccess: () => utils.course.list.invalidate(),
  });

  if (authStatus === "loading") {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-14 bg-slate-200/80 rounded-2xl" />
        <div className="h-96 bg-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
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
      <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Management Cursuri
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Administrează cursurile, orarele, profesorii și materialele didactice
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Adaugă Curs</span>
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
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-slate-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
              <BookOpenIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nu există cursuri
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              {search
                ? "Nu a fost găsit niciun curs care să corespundă căutării."
                : "Începe prin a crea primul curs pentru școala ta."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Adaugă primul curs</span>
              </button>
            )}
          </div>
        ) : (
          <CourseListTable
            courses={courses}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onOpenRoster={(course) => setSelectedCourseForGroups(course)}
          />
        )}
      </div>

      {/* Drawer */}
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
