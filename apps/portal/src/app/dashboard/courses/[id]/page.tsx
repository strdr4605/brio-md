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
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/50">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
          Avansat
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
          Nu ai permisiuni suficiente pentru a gestiona acest curs.
        </div>
      </div>
    );
  }

  if (isNaN(courseId)) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
          ID-ul cursului este invalid.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200/80 p-6" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200/80 p-6" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Înapoi la cursuri</span>
        </Link>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
          {error?.message || "Cursul solicitat nu a fost găsit."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/dashboard/courses"
          className="hover:text-slate-900 flex items-center gap-1 transition font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Cursuri</span>
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-900 truncate">{course.name}</span>
      </nav>

      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course.name}</h1>
              {getLevelBadge(course.level)}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  course.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    : "bg-slate-100 text-slate-500 border border-slate-200/60"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${course.active ? "bg-emerald-600" : "bg-slate-400"}`} />
                {course.active ? "Curs Activ" : "Curs Inactiv"}
              </span>
            </div>
            {course.description && (
              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm text-slate-600 shrink-0 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Sesiuni</span>
              <span className="font-bold text-slate-900">{course.totalSessions} sesiuni</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Durată sesiune</span>
              <span className="font-bold text-slate-900">{course.sessionDurationMinutes || "—"} min</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-6 mt-6 border-b border-slate-100 pt-2">
          <button
            onClick={() => setActiveTab("groups")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "groups"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Grupe & Sesiuni</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "details"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Descriere Curs</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {course.description || "Nu există o descriere completă pentru acest curs."}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-base font-bold text-slate-900 mb-2">Materiale Didactice</h3>
            {course.materials && course.materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.materials.map((m: any) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-400 capitalize">{m.type}</div>
                    </div>
                    <span className="text-xs text-slate-900 font-bold group-hover:text-slate-700">Deschide &rarr;</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nu sunt atașate materiale pentru acest curs.</p>
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
