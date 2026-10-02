"use client";

import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { StudentCoursesCell } from "./StudentCoursesCell";
import { StudentRowDetails } from "./StudentRowDetails";
import {
  PhoneIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";

export type StudentMobileCardProps = {
  student: {
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
  };
  school?: { id: number; name: string } | null;
  courses: Array<{ id: number; name: string; schoolId?: number | null }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deletePending?: boolean;
};

export function StudentMobileCard({
  student,
  school,
  courses,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  deletePending = false,
}: StudentMobileCardProps) {
  const studentAvailableCourses = courses.filter(
    (c) => !c.schoolId || !student.schoolId || c.schoolId === student.schoolId,
  );

  return (
    <div
      className={`border-b border-slate-100 last:border-b-0 transition-colors ${
        isExpanded ? "bg-slate-50/90" : "bg-white"
      }`}
    >
      <div className="p-3.5 space-y-3">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/students/${student.id}`}
                className="font-bold text-slate-900 text-sm block truncate hover:text-slate-700 leading-tight"
              >
                {student.name}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">
                  {student.age ? `${student.age} ani` : "Vârstă N/A"}
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                  {school?.name || "Campus Principal"}
                </span>
              </div>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 shrink-0"
            aria-label={isExpanded ? "Restrânge detalii" : "Extinde detalii"}
          >
            <ChevronDownIcon
              className={`w-5 h-5 transition-transform duration-200 ${
                isExpanded ? "rotate-0 text-slate-900" : "-rotate-90"
              }`}
            />
          </button>
        </div>

        {/* Tap-to-Call Contact Badges */}
        {(student.phone || student.parentPhone) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-95 transition"
                title={`Apelează elevul ${student.name}`}
              >
                <PhoneIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{formatPhone(student.phone)}</span>
              </a>
            )}

            {student.parentPhone && (
              <a
                href={`tel:${student.parentPhone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 text-xs font-semibold active:scale-95 transition"
                title={`Apelează părintele: ${student.parentName || ""}`}
              >
                <PhoneIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {student.parentName ? `${student.parentName}: ` : "Părinte: "}
                  {formatPhone(student.parentPhone)}
                </span>
              </a>
            )}
          </div>
        )}

        {/* Assigned Courses Cell */}
        <div className="pt-0.5">
          <StudentCoursesCell
            studentId={student.id}
            currentCourses={student.courses || []}
            availableCourses={studentAvailableCourses}
          />
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/dashboard/students/${student.id}`}
              className="px-2.5 py-1 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Profil
            </Link>
            <button
              type="button"
              onClick={onEdit}
              className="px-2.5 py-1 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Editează
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deletePending}
              className="px-2.5 py-1 rounded-lg font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
            >
              Șterge
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 px-1.5 transition"
          >
            {isExpanded ? "Ascunde fișa" : "Fișă completă"}
          </button>
        </div>
      </div>

      {/* Expanded Details Sub-view */}
      {isExpanded && (
        <div className="border-t border-slate-200/80 bg-slate-50/90 p-3">
          <StudentRowDetails
            student={student}
            schoolName={school?.name}
            availableCourses={studentAvailableCourses}
            onEdit={onEdit}
            onDelete={onDelete}
            deletePending={deletePending}
          />
        </div>
      )}
    </div>
  );
}
