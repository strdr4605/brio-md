"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MoreHorizontalIcon } from "@/components/ui/icons";

const SHORT_DAY_LABELS: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mie",
  thu: "Joi",
  fri: "Vin",
  sat: "Sâm",
  sun: "Dum",
};

export function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const d = days?.length ? days.map((x) => SHORT_DAY_LABELS[x.toLowerCase()] || x).join(", ") : null;
  return d && time ? `${d} • ${time}` : d || time || "Nespecificat";
}

const LEVEL_STYLES: Record<string, { label: string; cls: string }> = {
  beginner: { label: "Începător", cls: "bg-emerald-50 text-emerald-800 border-emerald-200/50" },
  intermediate: { label: "Mediu", cls: "bg-slate-100 text-slate-700 border-slate-200/80" },
  advanced: { label: "Avansat", cls: "bg-slate-900 text-white border-transparent" },
};

export function getLevelBadge(level: string | null | undefined) {
  const item = level ? LEVEL_STYLES[level.toLowerCase()] : null;
  if (!item) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${item.cls}`}>
      {item.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean | null }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        Activ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Inactiv
    </span>
  );
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuId]);

  return (
    <>
      {/* Desktop & Tablet Table - fits 100% of screens */}
      <div
        ref={menuRef}
        className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-visible"
      >
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-xs">
            <tr>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                Curs & Nivel
              </th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                Format
              </th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                Program
              </th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                Profesor
              </th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px] text-center">
                Status
              </th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-right">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((course) => {
              const isMenuOpen = openMenuId === course.id;

              return (
                <tr
                  key={course.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Curs & Nivel */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="font-bold text-slate-900 hover:text-slate-600 transition truncate max-w-xs"
                      >
                        {course.name}
                      </Link>
                      {getLevelBadge(course.level)}
                    </div>
                    {course.description && (
                      <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                        {course.description}
                      </p>
                    )}
                  </td>

                  {/* Format (Sesiuni + Durată) */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {course.totalSessions} sesiuni
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {course.sessionDurationMinutes
                        ? `${course.sessionDurationMinutes} min / sesiune`
                        : "Durată nespecificată"}
                    </div>
                  </td>

                  {/* Program */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600 font-medium">
                    {formatSchedule(course.scheduleDays, course.scheduleTime)}
                  </td>

                  {/* Profesor */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 font-medium">
                    {course.teacherName || (
                      <span className="text-slate-400 italic">Neasignat</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center">
                    <StatusBadge active={course.active} />
                  </td>

                  {/* Acțiuni (Compact & Spacious) */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 relative">
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Grupe
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenRoster({ id: course.id, name: course.name })
                        }
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Roster
                      </button>

                      {/* Dropdown for More Actions */}
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(isMenuOpen ? null : course.id)
                          }
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Mai multe opțiuni"
                        >
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-scale-up text-left">
                            <button
                              type="button"
                              onClick={() => { setOpenMenuId(null); onEdit(course.id); }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <span>Editează curs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setOpenMenuId(null); onToggleActive(course.id, course.active); }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <span>{course.active ? "Dezactivează curs" : "Activează curs"}</span>
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              type="button"
                              onClick={() => { setOpenMenuId(null); onDelete(course.id, course.name); }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                            >
                              <span>Șterge curs</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
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

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400">Format:</span>{" "}
                <span className="font-semibold text-slate-700">
                  {course.totalSessions} sesiuni (
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
                <StatusBadge active={course.active} />
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
                  onClick={() => onOpenRoster({ id: course.id, name: course.name })}
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
