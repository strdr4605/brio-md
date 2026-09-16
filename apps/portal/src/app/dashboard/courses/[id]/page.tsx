"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { CourseGroupsTab } from "@/components/dashboard/CourseGroupsTab";
import { CourseGroupsDrawer } from "@/components/dashboard/CourseGroupsDrawer";
import {
  ChevronLeftIcon,
  BookOpenIcon,
  UsersIcon,
} from "@/components/ui/icons";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getLevelBadge(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Avansat
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
          {level || "-"}
        </span>
      );
  }
}

export default function CourseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id, 10);

  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  const [activeTab, setActiveTab] = useState<"groups" | "details">("groups");
  const [selectedRosterGroup, setSelectedRosterGroup] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const {
    data: course,
    isLoading,
    error,
  } = trpc.course.getById.useQuery(
    { id: courseId },
    { enabled: !isNaN(courseId) && isSuperOrAdmin }
  );

  if (!isSuperOrAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Nu ai permisiuni suficiente pentru a gestiona acest curs.
        </div>
      </div>
    );
  }

  if (isNaN(courseId)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          ID-ul cursului este invalid.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-48" />
        <div className="h-32 bg-white rounded-xl border border-neutral-200 p-6" />
        <div className="h-64 bg-white rounded-xl border border-neutral-200 p-6" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Înapoi la cursuri</span>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error?.message || "Cursul solicitat nu a fost găsit."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500">
        <Link
          href="/dashboard/courses"
          className="hover:text-neutral-900 flex items-center gap-1 transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Cursuri</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-neutral-900 truncate">{course.name}</span>
      </nav>

      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900">{course.name}</h1>
              {getLevelBadge(course.level)}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  course.active
                    ? "bg-green-100 text-green-800"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {course.active ? "Curs Activ" : "Curs Inactiv"}
              </span>
            </div>
            {course.description && (
              <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm text-neutral-600 shrink-0 bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-100">
            <div>
              <span className="text-neutral-400 block text-[11px]">Sesiuni</span>
              <span className="font-semibold text-neutral-800">{course.totalSessions} sesiuni</span>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div>
              <span className="text-neutral-400 block text-[11px]">Durată sesiune</span>
              <span className="font-semibold text-neutral-800">{course.sessionDurationMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-6 mt-6 border-b border-neutral-100 pt-2">
          <button
            onClick={() => setActiveTab("groups")}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "groups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Grupe & Sesiuni</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "details"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Detalii & Materiale</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "groups" ? (
        <CourseGroupsTab
          courseId={courseId}
          courseName={course.name}
          schoolId={course.schoolId}
          onOpenRoster={(grp) => setSelectedRosterGroup(grp)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">Descriere Curs</h3>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
              {course.description || "Nu există o descriere completă pentru acest curs."}
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h3 className="text-base font-semibold text-neutral-900 mb-2">Materiale Didactice</h3>
            {course.materials && course.materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.materials.map((m: any) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{m.title}</div>
                      <div className="text-xs text-neutral-400 capitalize">{m.type}</div>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">Deschide &rarr;</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">Nu sunt atașate materiale pentru acest curs.</p>
            )}
          </div>
        </div>
      )}

      {/* Student Roster Drawer */}
      {selectedRosterGroup && (
        <CourseGroupsDrawer
          isOpen={Boolean(selectedRosterGroup)}
          onClose={() => setSelectedRosterGroup(null)}
          courseId={courseId}
          courseName={course.name}
          schoolId={course.schoolId}
        />
      )}
    </div>
  );
}
