"use client";

import { Fragment } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { ChevronDownIcon } from "@/components/ui/icons";
import { StudentCoursesCell } from "./StudentCoursesCell";
import { StudentRowDetails } from "./StudentRowDetails";

export type StudentDesktopTableProps = {
  students: any[];
  schools: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; name: string; schoolId?: number | null }>;
  expandedStudentId: number | null;
  onToggleExpand: (id: number) => void;
  onEdit: (student: any) => void;
  onDelete: (id: number) => void;
  deletePending: boolean;
};

export function StudentDesktopTable({
  students,
  schools,
  courses,
  expandedStudentId,
  onToggleExpand,
  onEdit,
  onDelete,
  deletePending,
}: StudentDesktopTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="w-10 px-4 py-3.5 text-center"></th>
            <th className="px-4 py-3.5">Student</th>
            <th className="px-4 py-3.5">Telefon Contact</th>
            <th className="px-4 py-3.5">Școală</th>
            <th className="px-4 py-3.5">Cursuri Asignate</th>
            <th className="px-4 py-3.5 text-right">Acțiuni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((student) => {
            const school = schools.find((s) => s.id === student.schoolId);
            const isExpanded = expandedStudentId === student.id;
            const displayPhone = student.phone || student.parentPhone;
            const studentAvailableCourses = courses.filter(
              (c) => !c.schoolId || !student.schoolId || c.schoolId === student.schoolId,
            );

            return (
              <Fragment key={student.id}>
                {/* Main Summary Row */}
                <tr
                  onClick={() => onToggleExpand(student.id)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50/80"
                  }`}
                >
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 group-hover:text-slate-900 transition"
                      aria-label={isExpanded ? "Restrânge detalii" : "Extinde detalii"}
                    >
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-0 text-slate-900" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 text-sm block hover:text-slate-700 hover:underline transition"
                        >
                          {student.name}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {student.age ? `${student.age} ani` : "Vârstă N/A"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {displayPhone ? (
                      <a
                        href={`tel:${displayPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                      >
                        {formatPhone(displayPhone)}
                        {!student.phone && student.parentPhone && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            părinte
                          </span>
                        )}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {school?.name || "Campus Principal"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 min-w-[220px]" onClick={(e) => e.stopPropagation()}>
                    <StudentCoursesCell
                      studentId={student.id}
                      currentCourses={student.courses || []}
                      availableCourses={studentAvailableCourses}
                    />
                  </td>

                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                      >
                        Profil
                      </Link>
                      <button
                        onClick={() => onEdit(student)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => onDelete(student.id)}
                        disabled={deletePending}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Smart Expandable Detail Row */}
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <StudentRowDetails
                        student={student}
                        schoolName={school?.name}
                        availableCourses={studentAvailableCourses}
                        onEdit={() => onEdit(student)}
                        onDelete={() => onDelete(student.id)}
                        deletePending={deletePending}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
