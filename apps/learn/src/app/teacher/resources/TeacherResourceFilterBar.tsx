"use client";

export type TabType =
  | "all"
  | "worksheet"
  | "theory"
  | "video"
  | "minigame";

export type AssignmentStatus = "all" | "assigned" | "unassigned";

export type CourseOption = {
  id: number;
  name: string;
};

type TeacherResourceFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: TabType;
  onTypeChange: (value: TabType) => void;
  courseId: string;
  onCourseChange: (value: string) => void;
  status: AssignmentStatus;
  onStatusChange: (value: AssignmentStatus) => void;
  courses: CourseOption[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

export function TeacherResourceFilterBar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  courseId,
  onCourseChange,
  status,
  onStatusChange,
  courses,
  hasActiveFilters,
  onResetFilters,
}: TeacherResourceFilterBarProps) {
  const isCourseDisabled = status === "unassigned";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-2 sm:p-2.5 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center gap-2 w-full xl:w-fit max-w-full">
      {/* Compact Search Input */}
      <div className="relative w-full xl:w-72 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Caută materiale..."
          className="w-full pl-8.5 pr-10 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 focus:bg-white transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-[11px] font-medium cursor-pointer"
          >
            Șterge
          </button>
        )}
      </div>

      {/* Filter Controls Group */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
        {/* Resource Type Filter */}
        <div className="relative min-w-[170px] flex-1 sm:flex-none">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as TabType)}
            aria-label="Filtrează după tipul de resursă"
            className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 focus:bg-white transition appearance-none cursor-pointer"
          >
            <option value="all">Toate materialele</option>
            <option value="worksheet">✍️ Fișe & Practică</option>
            <option value="theory">📖 Lectură & Teorie</option>
            <option value="video">🎥 Lecții Video</option>
            <option value="minigame">🎮 Jocuri & Interactiv</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Course Filter Dropdown (Option A) */}
        <div className="relative min-w-[155px] flex-1 sm:flex-none">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <select
            value={courseId}
            disabled={isCourseDisabled}
            onChange={(e) => onCourseChange(e.target.value)}
            aria-label="Filtrează după curs"
            className={`w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition appearance-none cursor-pointer ${
              isCourseDisabled
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-slate-50 text-slate-700 border-slate-200 focus:bg-white"
            }`}
          >
            <option value="all">Toate cursurile</option>
            {courses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {course.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Assignment Status Filter (Option B) */}
        <div className="relative min-w-[150px] flex-1 sm:flex-none">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as AssignmentStatus)}
            aria-label="Filtrează după status asignare"
            className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 focus:bg-white transition appearance-none cursor-pointer"
          >
            <option value="all">Toate statusurile</option>
            <option value="assigned">Asignate</option>
            <option value="unassigned">Neasignate</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            title="Resetează toate filtrele"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
            aria-label="Resetează filtrele"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
