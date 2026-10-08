"use client";

import { useState } from "react";
import { CourseRosterView } from "./CourseRosterView";
import { CourseCurriculumView } from "./CourseCurriculumView";

type Props = {
  courseId: number;
  initialTab?: "roster" | "curriculum";
};

export function TeacherCourseView({ courseId, initialTab = "roster" }: Props) {
  const [activeTab, setActiveTab] = useState<"roster" | "curriculum">(initialTab);

  return (
    <div className="space-y-6">
      {/* Top Tab Navigation (Design System Compliant) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "roster"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>👥</span>
            <span>Studenți & Progres</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("curriculum")}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "curriculum"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>📚</span>
            <span>Plan Curs & Resurse</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3 hidden md:block">
          Curs #{courseId} • Management Academic
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "roster" ? (
        <CourseRosterView courseId={courseId} />
      ) : (
        <CourseCurriculumView courseId={courseId} />
      )}
    </div>
  );
}
