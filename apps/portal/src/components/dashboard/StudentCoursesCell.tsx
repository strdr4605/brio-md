"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

type CourseItem = {
  id: number;
  name: string;
  level?: string | null;
};

type Props = {
  studentId: number;
  currentCourses: CourseItem[];
  availableCourses: CourseItem[];
  disabled?: boolean;
};

// Clean Monochrome Enterprise Palette for course pills (Brio DS)
export const MONOCHROME_COURSE_BADGE = {
  bg: "bg-slate-100",
  text: "text-slate-800",
  border: "border-slate-200/80",
  dot: "bg-slate-400",
};

export const COURSE_COLORS = [
  MONOCHROME_COURSE_BADGE,
];

export function getCourseColor(_courseId?: number | null) {
  return MONOCHROME_COURSE_BADGE;
}

export function StudentCoursesCell({
  studentId,
  currentCourses,
  availableCourses,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const utils = trpc.useUtils();
  const updateCoursesMutation = trpc.student.updateCourses.useMutation({
    onMutate: async ({ studentId: sId, courseIds }) => {
      await utils.student.list.cancel();
      await utils.enrollment.getByStudent.cancel({ studentId: sId });

      const previousStudents = utils.student.list.getData();
      const previousEnrollments = utils.enrollment.getByStudent.getData({ studentId: sId });

      const targetCourseIdsSet = new Set(courseIds);

      // Optimistically update student.list cache
      utils.student.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((s) => {
          if (s.id !== sId) return s;
          const kept = (s.courses || []).filter((c) => targetCourseIdsSet.has(c.id));
          const keptIds = new Set(kept.map((c) => c.id));
          const added = availableCourses.filter(
            (c) => targetCourseIdsSet.has(c.id) && !keptIds.has(c.id),
          );
          return {
            ...s,
            courses: [...kept, ...added],
          };
        });
      });

      // Optimistically update enrollment.getByStudent cache (remove groups of removed courses)
      utils.enrollment.getByStudent.setData({ studentId: sId }, (old) => {
        if (!old) return old;
        return old.filter((enr) => targetCourseIdsSet.has(enr.courseId));
      });

      return { previousStudents, previousEnrollments };
    },
    onError: (err, variables, context) => {
      if (context?.previousStudents) {
        utils.student.list.setData(undefined, context.previousStudents);
      }
      if (context?.previousEnrollments) {
        utils.enrollment.getByStudent.setData(
          { studentId: variables.studentId },
          context.previousEnrollments,
        );
      }
      alert(err.message || "Eroare la actualizarea cursurilor");
    },
    onSettled: () => {
      utils.student.list.invalidate();
      utils.enrollment.getByStudent.invalidate({ studentId });
      utils.student.getById.invalidate({ id: studentId });
    },
  });

  // Deduplicate current courses by normalized name for rendering badges
  const uniqueCurrentCourses = useMemo(() => {
    const seen = new Set<string>();
    return currentCourses.filter((course) => {
      const key = course.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [currentCourses]);

  // Deduplicate available courses by normalized name for the popover
  const uniqueAvailableCourses = useMemo(() => {
    const seen = new Set<string>();
    return availableCourses.filter((course) => {
      const key = course.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [availableCourses]);

  const currentCourseNamesSet = useMemo(() => {
    return new Set(currentCourses.map((c) => c.name.trim().toLowerCase()));
  }, [currentCourses]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleCourse = (course: CourseItem) => {
    if (disabled || updateCoursesMutation.isPending) return;
    const normName = course.name.trim().toLowerCase();
    let nextIds: number[];
    if (currentCourseNamesSet.has(normName)) {
      // Remove all courses matching this name
      nextIds = currentCourses
        .filter((c) => c.name.trim().toLowerCase() !== normName)
        .map((c) => c.id);
    } else {
      nextIds = [...currentCourses.map((c) => c.id), course.id];
    }
    updateCoursesMutation.mutate({ studentId, courseIds: nextIds });
  };

  const handleRemoveCourse = (e: React.MouseEvent, course: CourseItem) => {
    e.stopPropagation();
    if (disabled || updateCoursesMutation.isPending) return;
    const normName = course.name.trim().toLowerCase();
    const nextIds = currentCourses
      .filter((c) => c.name.trim().toLowerCase() !== normName)
      .map((c) => c.id);
    updateCoursesMutation.mutate({ studentId, courseIds: nextIds });
  };

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return uniqueAvailableCourses;
    const q = search.toLowerCase();
    return uniqueAvailableCourses.filter((c) =>
      c.name.toLowerCase().includes(q),
    );
  }, [uniqueAvailableCourses, search]);

  return (
    <div className="relative inline-flex items-center flex-wrap gap-1.5 py-1">
      {/* Course Pills (Clean Monochrome Enterprise) */}
      {uniqueCurrentCourses.map((course) => {
        return (
          <span
            key={course.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs transition-all hover:bg-slate-200/70"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span className="truncate max-w-[140px]">{course.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => handleRemoveCourse(e, course)}
                disabled={updateCoursesMutation.isPending}
                className="text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded p-0.5 ml-0.5 transition-colors focus:outline-none cursor-pointer"
                title={`Elimină ${course.name}`}
                aria-label={`Elimină ${course.name}`}
              >
                <span className="text-[11px] leading-none block">✕</span>
              </button>
            )}
          </span>
        );
      })}

      {/* Add / Edit Courses Button */}
      {!disabled && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={updateCoursesMutation.isPending}
          className={`inline-flex items-center justify-center rounded-lg border text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 cursor-pointer ${
            uniqueCurrentCourses.length === 0
              ? "px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border-dashed border-slate-300 gap-1.5"
              : "w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200/80"
          }`}
          title="Editează cursuri"
          aria-label="Editează cursuri"
        >
          <span className="text-xs font-bold leading-none">+</span>
          {uniqueCurrentCourses.length === 0 && <span className="text-xs font-medium">Asignează curs</span>}
        </button>
      )}

      {/* Popover Dropdown (Clean Monochrome Enterprise) */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200/90 p-2.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cursuri disponibile
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {uniqueCurrentCourses.length}/{uniqueAvailableCourses.length}
            </span>
          </div>

          {uniqueAvailableCourses.length > 4 && (
            <div className="mb-2">
              <input
                type="text"
                placeholder="Caută curs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-1">
            {filteredCourses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Niciun curs găsit</p>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = currentCourseNamesSet.has(course.name.trim().toLowerCase());
                return (
                  <label
                    key={course.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                      isSelected
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-800" : "bg-slate-400"} shrink-0`} />
                      <span className="truncate">{course.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCourse(course)}
                      disabled={updateCoursesMutation.isPending}
                      className="w-3.5 h-3.5 text-slate-900 accent-slate-900 rounded border-slate-300 focus:ring-slate-900/10 shrink-0 cursor-pointer"
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
