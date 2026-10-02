"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { ChevronDownIcon, StudentsIcon } from "@/components/ui/icons";
import { StudentCoursesCell } from "./StudentCoursesCell";
import { StudentRowDetails } from "./StudentRowDetails";
import { StudentMobileCard } from "./StudentMobileCard";

export type StudentTableItem = {
  id: number;
  name: string;
  phone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  info?: string | null;
  createdAt?: Date | string | null;
  courses?: Array<{ id: number; name: string }>;
  schoolId?: number | null;
  [key: string]: any;
};

export type StudentsTableProps<T extends StudentTableItem = StudentTableItem> = {
  students: T[];
  schools: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; name: string; schoolId?: number | null }>;
  isLoading?: boolean;
  onEdit: (student: T) => void;
  onDelete: (id: number) => void;
  deletePending?: boolean;
};

export function StudentsTable<T extends StudentTableItem = StudentTableItem>({
  students,
  schools,
  courses,
  isLoading = false,
  onEdit,
  onDelete,
  deletePending = false,
}: StudentsTableProps<T>) {
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedStudentId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <p className="text-sm text-slate-500">Se încarcă catalogul...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <StudentsIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700">Niciun student găsit</p>
        <p className="text-xs text-slate-400 mt-1">Încearcă să ajustezi filtrele sau căutarea.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Mobile Card List (Thumb-friendly touch view) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {students.map((student) => {
          const school = schools.find((s) => s.id === student.schoolId);
          return (
            <StudentMobileCard
              key={student.id}
              student={student}
              school={school}
              courses={courses}
              isExpanded={expandedStudentId === student.id}
              onToggleExpand={() => toggleExpand(student.id)}
              onEdit={() => onEdit(student)}
              onDelete={() => onDelete(student.id)}
              deletePending={deletePending}
            />
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="w-12 px-4 py-3.5 text-center"></th>
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
              const hasNoCourses = !student.courses || student.courses.length === 0;
              const studentAvailableCourses = courses.filter(
                (c) => !c.schoolId || !student.schoolId || c.schoolId === student.schoolId,
              );

              return (
                <Fragment key={student.id}>
                  {/* Summary Row */}
                  <tr
                    onClick={() => toggleExpand(student.id)}
                    className={`group cursor-pointer transition-colors duration-150 ${
                      isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Expand/Collapse Chevron Button */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(student.id);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 group-hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 cursor-pointer mx-auto"
                        aria-label={isExpanded ? "Restrânge detalii" : "Extinde detalii"}
                      >
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-0 text-slate-900" : "-rotate-90"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Student Name & Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {hasNoCourses ? (
                          <div
                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none"
                            title="Fără curs asignat"
                          >
                            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                          </div>
                        )}
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

                    {/* Contact Phone */}
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {displayPhone ? (
                        <a
                          href={`tel:${displayPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5"
                        >
                          {formatPhone(displayPhone)}
                          {!student.phone && student.parentPhone && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              părinte
                            </span>
                          )}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* School */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {school?.name || "Campus Principal"}
                      </span>
                    </td>

                    {/* Assigned Courses (Interactive Popover) */}
                    <td className="px-4 py-3.5 min-w-[220px]" onClick={(e) => e.stopPropagation()}>
                      <StudentCoursesCell
                        studentId={student.id}
                        currentCourses={(student as any).courses || []}
                        availableCourses={studentAvailableCourses}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          Profil
                        </Link>
                        <button
                          type="button"
                          onClick={() => onEdit(student)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Editează
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(student.id)}
                          disabled={deletePending}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <StudentRowDetails
                          student={student}
                          schoolName={school?.name}
                          availableCourses={studentAvailableCourses}
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
    </div>
  );
}
