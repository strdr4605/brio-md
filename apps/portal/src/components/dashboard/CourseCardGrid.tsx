"use client";

import { Card, StatusDot } from "@brio-md/ui";
import { getLevelBadge, formatSchedule, type CourseItem } from "./CourseListTable";
import { DoorIcon, UsersIcon, CalendarIcon } from "@/components/ui/icons";

export type GroupItemWithStats = {
  id: number;
  courseId: number;
  name: string;
  room?: string | null;
  teacherName?: string | null;
  studentCount?: number;
  active?: boolean;
};

export type CourseCardGridProps = {
  courses: CourseItem[];
  groups?: GroupItemWithStats[];
  onEdit: (id: number) => void;
  onToggleActive: (id: number, currentActive: boolean | null) => void;
  onDelete: (id: number, name: string) => void;
  onOpenRoster: (course: { id: number; name: string }) => void;
};

export function CourseCardGrid({
  courses,
  groups = [],
  onEdit,
  onToggleActive,
  onDelete,
  onOpenRoster,
}: CourseCardGridProps) {
  // Map groups by courseId
  const groupsByCourse = new Map<number, GroupItemWithStats[]>();
  for (const g of groups) {
    const list = groupsByCourse.get(g.courseId) || [];
    list.push(g);
    groupsByCourse.set(g.courseId, list);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => {
        const cGroups = groupsByCourse.get(course.id) || [];
        const enrolledStudents = cGroups.reduce((acc, g) => acc + (g.studentCount || 0), 0);
        const maxCapacity = Math.max(10, cGroups.length * 10);
        const capacityDisplay = `${enrolledStudents}/${maxCapacity} locuri ocupate`;
        const primaryRoom = cGroups.find((g) => g.room)?.room || "Sala 102";
        const teacher = course.teacherName || cGroups.find((g) => g.teacherName)?.teacherName || "Profesor titular";

        return (
          <Card
            key={course.id}
            className="p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all space-y-4"
          >
            {/* Header: Title, Level, and Status Dot */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 truncate" title={course.name}>
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {course.level && getLevelBadge(course.level)}
                    <span className="text-xs text-slate-500 font-medium">
                      {cGroups.length} {cGroups.length === 1 ? "grupă" : "grupe"}
                    </span>
                  </div>
                </div>
                <StatusDot
                  status={course.active ? "active" : "inactive"}
                  label={course.active ? "Activ" : "Inactiv"}
                  pill
                />
              </div>

              {course.description && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            {/* Capacity & Location Tags */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* Group Capacity Indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Capacitate grupe</span>
                  <span className="font-bold text-slate-900 font-mono">{capacityDisplay}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-900 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((enrolledStudents / maxCapacity) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Teacher & Classroom Tags */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0">
                  <UsersIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{teacher}</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold shrink-0 border border-slate-200/60">
                  <DoorIcon className="w-3 h-3 text-slate-500" />
                  <span>{primaryRoom.startsWith("Sala") ? primaryRoom : `Sala ${primaryRoom}`}</span>
                </div>
              </div>

              {/* Schedule time */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <CalendarIcon className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {formatSchedule(course.scheduleDays, course.scheduleTime)}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenRoster(course)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition"
              >
                Vezi Grupe
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleActive(course.id, course.active)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition ${
                    course.active
                      ? "text-slate-500 hover:text-slate-800"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {course.active ? "Dezactivează" : "Activează"}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(course.id)}
                  className="text-xs font-bold text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(course.id, course.name)}
                  className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-md transition"
                  title="Șterge Curs"
                >
                  ✕
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
