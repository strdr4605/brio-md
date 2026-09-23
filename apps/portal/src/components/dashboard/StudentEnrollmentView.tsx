"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { findGroupConflictWithSelected, GroupScheduleItem } from "@/lib/scheduleConflicts";
import { getCourseColor } from "./StudentCoursesCell";

export function getLevelBadge(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Avansat
        </span>
      );
    default:
      return null;
  }
}

export type StudentEnrollmentViewProps = {
  isLoading: boolean;
  search: string;
  studentCourses: Array<{ id: number; name: string }>;
  availableCourses: Array<{ id: number; name: string; level?: string | null }>;
  allGroups: GroupScheduleItem[];
  selectedGroupIds: number[];
  currentEnrollments: Array<{ id: number; groupId: number; courseId?: number | null; status?: string | null }>;
  onToggleGroup: (groupId: number) => void;
  onUpdateStatus: (enrollmentId: number, status: any) => void;
  isUpdatingStatus: boolean;
};

export function StudentEnrollmentView({
  isLoading,
  search,
  studentCourses,
  availableCourses,
  allGroups,
  selectedGroupIds,
  currentEnrollments,
  onToggleGroup,
  onUpdateStatus,
  isUpdatingStatus,
}: StudentEnrollmentViewProps) {
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(new Set());

  // Expand enrolled courses initially
  useEffect(() => {
    const initial = new Set<number>();
    studentCourses.forEach((c) => initial.add(c.id));
    currentEnrollments
      .filter((e) => e.status === "active")
      .forEach((e) => {
        if (e.courseId) initial.add(e.courseId);
      });
    setExpandedCourseIds(initial);
  }, [studentCourses, currentEnrollments]);

  const toggleCourseExpand = (cId: number) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(cId)) next.delete(cId);
      else next.add(cId);
      return next;
    });
  };

  const groupsByCourseId = useMemo(() => {
    const map = new Map<number, GroupScheduleItem[]>();
    for (const g of allGroups as any[]) {
      if (g.active === false) continue;
      const list = map.get(g.courseId) || [];
      list.push(g);
      map.set(g.courseId, list);
    }
    return map;
  }, [allGroups]);

  const allAvailableCourses = useMemo(() => {
    const courseMap = new Map<number, { id: number; name: string; level?: string | null }>();
    for (const c of studentCourses) {
      courseMap.set(c.id, { id: c.id, name: c.name, level: null });
    }
    for (const c of availableCourses) {
      courseMap.set(c.id, { id: c.id, name: c.name, level: c.level });
    }
    for (const g of allGroups as any[]) {
      if (g.active !== false && !courseMap.has(g.courseId)) {
        courseMap.set(g.courseId, { id: g.courseId, name: g.courseName, level: null });
      }
    }
    return Array.from(courseMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ro", { sensitivity: "base" }),
    );
  }, [studentCourses, availableCourses, allGroups]);

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return allAvailableCourses;
    const q = search.toLowerCase();
    return allAvailableCourses.filter((course) => {
      const matchesCourse = course.name.toLowerCase().includes(q);
      const cGroups = (groupsByCourseId.get(course.id) || []) as any[];
      const matchesGroup = cGroups.some(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.room || "").toLowerCase().includes(q) ||
          (g.teacherName || "").toLowerCase().includes(q),
      );
      return matchesCourse || matchesGroup;
    });
  }, [allAvailableCourses, groupsByCourseId, search]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="h-16 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (allAvailableCourses.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Nu există cursuri disponibile</p>
        <p className="text-xs text-slate-400 mt-1">
          Nu au fost găsite cursuri active configurate pentru această școală.
        </p>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Niciun curs găsit</p>
        <p className="text-xs text-slate-400 mt-1">
          Nu s-a găsit niciun curs sau grupă care să corespundă căutării «{search}».
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCourses.map((course) => {
        const courseGroups = (groupsByCourseId.get(course.id) || []) as any[];
        const isExpanded = expandedCourseIds.has(course.id);
        const courseColor = getCourseColor(course.id);
        const selectedCountInCourse = courseGroups.filter((g) =>
          selectedGroupIds.includes(g.id),
        ).length;

        return (
          <div
            key={course.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              isExpanded
                ? "border-slate-300 shadow-xs bg-white"
                : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleCourseExpand(course.id)}
              className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${
                isExpanded ? "bg-slate-50/80 border-b border-slate-200/80" : "hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`w-2.5 h-2.5 rounded-full ${courseColor.dot} shrink-0`} />
                <span className="text-xs font-bold text-slate-900">{course.name}</span>
                {course.level && getLevelBadge(course.level)}
                {selectedCountInCourse > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedCountInCourse}{" "}
                    {selectedCountInCourse === 1 ? "grupă selectată" : "grupe selectate"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {courseGroups.length} {courseGroups.length === 1 ? "grupă" : "grupe"}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 bg-slate-50/30 space-y-2">
                {courseGroups.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 px-1">
                    Nu există încă grupe create pentru acest curs.
                  </p>
                ) : (
                  courseGroups.map((grp) => {
                    const isSelected = selectedGroupIds.includes(grp.id);
                    const existingEnrollment = currentEnrollments.find((e) => e.groupId === grp.id);
                    const currentlySelected = (allGroups as any[]).filter(
                      (g) => selectedGroupIds.includes(g.id) && g.id !== grp.id,
                    );
                    const conflict = findGroupConflictWithSelected({
                      candidateGroup: grp,
                      selectedGroups: currentlySelected,
                    });
                    const isConflicted = conflict.hasConflict && !isSelected;

                    return (
                      <div
                        key={grp.id}
                        title={isConflicted ? `Conflict de orar: ${conflict.reason}` : undefined}
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-white border-blue-400/80 shadow-xs"
                            : isConflicted
                              ? "bg-slate-50/70 border-dashed border-slate-200 opacity-60"
                              : "bg-white/80 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label
                            onClick={(e) => {
                              if (isConflicted) e.preventDefault();
                            }}
                            className={`flex items-start gap-3 flex-1 select-none ${
                              isConflicted ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isConflicted}
                              onChange={() => {
                                if (!isConflicted) onToggleGroup(grp.id);
                              }}
                              className={`mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 ${
                                isConflicted ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-xs font-bold ${
                                    isConflicted ? "text-slate-500" : "text-slate-800"
                                  }`}
                                >
                                  {grp.name}
                                </p>
                                {isConflicted && (
                                  <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80">
                                    Suprapunere de orar
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                                {grp.scheduleTime && <span>⏰ {grp.scheduleTime}</span>}
                                {grp.room && <span>📍 {grp.room}</span>}
                                {grp.teacherName && <span>👨‍🏫 {grp.teacherName}</span>}
                              </div>
                            </div>
                          </label>

                          {existingEnrollment && (
                            <div className="shrink-0 flex items-center gap-1.5">
                              {existingEnrollment.status === "active" ? (
                                <>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    Status:
                                  </span>
                                  <select
                                    value={existingEnrollment.status}
                                    onChange={(e) =>
                                      onUpdateStatus(existingEnrollment.id, e.target.value)
                                    }
                                    disabled={isUpdatingStatus}
                                    className="text-xs font-semibold px-2 py-1 rounded-md border outline-none bg-emerald-50 text-emerald-700 border-emerald-200"
                                  >
                                    <option value="active">Activ</option>
                                    <option value="inactive">Inactiv</option>
                                    <option value="archived">Arhivat</option>
                                    <option value="completed">Completat</option>
                                  </select>
                                </>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  Inactiv anterior
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
