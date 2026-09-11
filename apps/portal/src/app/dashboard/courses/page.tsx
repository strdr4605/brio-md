"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { CourseFormDrawer } from "@/components/dashboard/CourseForm";

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
  return daysText || time || "Nespecificat";
}

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
      <div className="p-6">
        <p className="text-neutral-500">Se încarcă sesiunea...</p>
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Nu ai permisiuni suficiente pentru a gestiona cursurile.
        </div>
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
    if (confirm(`Sigur doriți să ștergeți cursul "${name}"? Această acțiune este ireversibilă.`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Management Cursuri</h1>
          <p className="text-sm text-neutral-500">
            Administrează cursurile, orarele, profesorii și materialele didactice
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <span>+</span>
          <span>Adaugă Curs</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută curs după nume..."
            className="w-full pl-3 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-neutral-500 hover:text-neutral-700 underline"
          >
            Resetează
          </button>
        )}
      </div>

      {/* Error handling */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          Eroare la încărcarea cursurilor: {error.message}
        </div>
      )}

      {/* Skeletons Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
                <div className="h-3 bg-neutral-100 rounded w-1/4" />
              </div>
              <div className="h-6 bg-neutral-200 rounded w-20" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-1">Nu există cursuri</h3>
          <p className="text-sm text-neutral-500 mb-6">
            {search
              ? "Nu a fost găsit niciun curs care să corespundă căutării."
              : "Începe prin a crea primul curs pentru școala ta."}
          </p>
          {!search && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              + Adaugă primul curs
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Responsive Data Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Curs</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Sesiuni</th>
                  <th className="px-4 py-3">Durată</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Profesor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-neutral-900">{course.name}</div>
                      {course.description && (
                        <div className="text-xs text-neutral-500 truncate max-w-xs">
                          {course.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{getLevelBadge(course.level)}</td>
                    <td className="px-4 py-3.5 text-neutral-700">{course.totalSessions} sesiuni</td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {course.sessionDurationMinutes} min
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {formatSchedule(course.scheduleDays, course.scheduleTime)}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {course.teacherName || (
                        <span className="text-neutral-400 italic">Neasignat</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {course.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Activ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
                          Inactiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(course.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleToggleActive(course.id, course.active)}
                        className="text-neutral-600 hover:text-neutral-800 text-xs px-2 py-1 rounded hover:bg-neutral-100"
                      >
                        {course.active ? "Dezactivează" : "Activează"}
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.name)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{course.name}</h3>
                    <p className="text-xs text-neutral-500">
                      {formatSchedule(course.scheduleDays, course.scheduleTime)}
                    </p>
                  </div>
                  {getLevelBadge(course.level)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-neutral-400">Sesiuni:</span> {course.totalSessions} (
                    {course.sessionDurationMinutes}m)
                  </div>
                  <div>
                    <span className="text-neutral-400">Profesor:</span>{" "}
                    {course.teacherName || "Neasignat"}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-100 text-xs">
                  <div>
                    {course.active ? (
                      <span className="text-green-700 font-medium">● Activ</span>
                    ) : (
                      <span className="text-neutral-500">○ Inactiv</span>
                    )}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(course.id)}
                      className="text-blue-600 font-medium"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleToggleActive(course.id, course.active)}
                      className="text-neutral-600"
                    >
                      {course.active ? "Dezactivează" : "Activează"}
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.name)}
                      className="text-red-600"
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drawer */}
      {showDrawer && (
        <CourseFormDrawer
          courseId={selectedCourseId}
          onClose={() => setShowDrawer(false)}
          currentUserSchoolId={session?.user?.schoolId}
        />
      )}
    </div>
  );
}

