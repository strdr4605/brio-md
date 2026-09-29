"use client";

import Link from "next/link";

const SHORT_DAY_LABELS: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mie",
  thu: "Joi",
  fri: "Vin",
  sat: "Sâm",
  sun: "Dum",
};

export function formatSchedule(
  days: string[] | null | undefined,
  time: string | null | undefined,
) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => SHORT_DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Nespecificat";
}

export function getLevelBadge(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/50 whitespace-nowrap">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white whitespace-nowrap">
          Avansat
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
          {level || "—"}
        </span>
      );
  }
}

export type CourseItem = {
  id: number;
  name: string;
  description: string | null;
  level: string | null;
  totalSessions: number;
  sessionDurationMinutes: number | null;
  scheduleDays: string[] | null;
  scheduleTime: string | null;
  teacherName: string | null;
  active: boolean | null;
};

export type CourseListTableProps = {
  courses: CourseItem[];
  onEdit: (id: number) => void;
  onToggleActive: (id: number, currentActive: boolean | null) => void;
  onDelete: (id: number, name: string) => void;
  onOpenRoster: (course: { id: number; name: string }) => void;
};

export function CourseListTable({
  courses,
  onEdit,
  onToggleActive,
  onDelete,
  onOpenRoster,
}: CourseListTableProps) {
  return (
    <>
      {/* Desktop Table with Horizontal Scroll Support */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1080px] text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-[220px]">
                  Curs
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[95px]">
                  Nivel
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[85px]">
                  Sesiuni
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[80px]">
                  Durată
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[170px]">
                  Program
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[110px]">
                  Profesor
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[95px]">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap min-w-[310px]">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-4 min-w-[220px]">
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="font-bold text-slate-900 hover:text-slate-600 transition block truncate max-w-[260px]"
                    >
                      {course.name}
                    </Link>
                    {course.description && (
                      <div className="text-xs text-slate-500 truncate max-w-[260px] mt-0.5">
                        {course.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 min-w-[95px] whitespace-nowrap">
                    {getLevelBadge(course.level)}
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium whitespace-nowrap">
                    {course.totalSessions} sesiuni
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium whitespace-nowrap">
                    {course.sessionDurationMinutes
                      ? `${course.sessionDurationMinutes} min`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs whitespace-nowrap font-medium">
                    {formatSchedule(course.scheduleDays, course.scheduleTime)}
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium whitespace-nowrap">
                    {course.teacherName || (
                      <span className="text-slate-400 italic">Neasignat</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {course.active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Activ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inactiv
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap min-w-[310px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition shrink-0"
                      >
                        Grupe
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenRoster({ id: course.id, name: course.name })
                        }
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition shrink-0"
                      >
                        Roster
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(course.id)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleActive(course.id, course.active)}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
                      >
                        {course.active ? "Dezactivează" : "Activează"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(course.id, course.name)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition shrink-0"
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="font-bold text-slate-900 hover:text-slate-600 transition block text-base"
                >
                  {course.name}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {formatSchedule(course.scheduleDays, course.scheduleTime)}
                </p>
              </div>
              <div>{getLevelBadge(course.level)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400">Sesiuni:</span>{" "}
                <span className="font-semibold text-slate-700">
                  {course.totalSessions} (
                  {course.sessionDurationMinutes
                    ? `${course.sessionDurationMinutes}m`
                    : "—"}
                  )
                </span>
              </div>
              <div>
                <span className="text-slate-400">Profesor:</span>{" "}
                <span className="font-semibold text-slate-700">
                  {course.teacherName || "Neasignat"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                {course.active ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Activ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Inactiv
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Grupe
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onOpenRoster({ id: course.id, name: course.name })
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Roster
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(course.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(course.id, course.active)}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
                >
                  {course.active ? "Dezactiv." : "Activ."}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(course.id, course.name)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  Șterge
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
