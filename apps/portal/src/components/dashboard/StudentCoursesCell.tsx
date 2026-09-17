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

// Distinct badge colors for courses inspired by Discord roles
const COURSE_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
];

function getCourseColor(courseId: number) {
  return COURSE_COLORS[courseId % COURSE_COLORS.length];
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
    onSuccess: () => {
      utils.student.list.invalidate();
    },
    onError: (err) => {
      alert(err.message || "Eroare la actualizarea cursurilor");
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
      {/* Course Pills (Discord Role Style) */}
      {uniqueCurrentCourses.map((course) => {
        const color = getCourseColor(course.id);
        return (
          <span
            key={course.id}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium shadow-sm transition-all ${color.bg} ${color.text} ${color.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
            <span className="truncate max-w-[140px]">{course.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => handleRemoveCourse(e, course)}
                disabled={updateCoursesMutation.isPending}
                className="text-neutral-400 hover:text-red-500 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                title={`Elimină ${course.name}`}
                aria-label={`Elimină ${course.name}`}
              >
                ✕
              </button>
            )}
          </span>
        );
      })}

      {/* Add / Edit Courses Button (Discord Role "+" Style) */}
      {!disabled && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={updateCoursesMutation.isPending}
          className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            uniqueCurrentCourses.length === 0
              ? "px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-dashed border-neutral-300 gap-1"
              : "w-6 h-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-300"
          }`}
          title="Editează cursuri"
          aria-label="Editează cursuri"
        >
          <span>+</span>
          {uniqueCurrentCourses.length === 0 && <span className="text-xs font-normal">Adaugă curs</span>}
        </button>
      )}

      {/* Popover Dropdown (Discord Roles Picker Style) */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 p-2.5 z-50 text-neutral-800 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Cursuri disponibile
            </span>
            <span className="text-xs text-neutral-400">
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
                className="w-full px-2.5 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-1">
            {filteredCourses.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-3">Niciun curs găsit</p>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = currentCourseNamesSet.has(course.name.trim().toLowerCase());
                const color = getCourseColor(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                      isSelected
                        ? "bg-blue-50 text-blue-900"
                        : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.dot} flex-shrink-0`} />
                      <span className="truncate font-medium">{course.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCourse(course)}
                      disabled={updateCoursesMutation.isPending}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
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
