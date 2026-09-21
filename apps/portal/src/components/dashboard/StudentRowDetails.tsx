"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { CalendarIcon, SchoolIcon } from "@/components/ui/icons";
import { StudentCoursesCell, getCourseColor } from "./StudentCoursesCell";
import { EnrollmentDrawer } from "./EnrollmentDrawer";
import { ParentCallWidget } from "./ParentCallWidget";
import { trpc } from "@/lib/trpc";

type CourseItem = {
  id: number;
  name: string;
  level?: string | null;
};

type Props = {
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
  schoolName?: string;
  availableCourses: CourseItem[];
  onEdit: () => void;
  onDelete: () => void;
  deletePending: boolean;
};

export function StudentRowDetails({
  student,
  schoolName,
  availableCourses,
  onEdit,
  onDelete,
  deletePending,
}: Props) {
  const [showEnrollmentDrawer, setShowEnrollmentDrawer] = useState(false);

  const { data: studentEnrollments = [] } = trpc.enrollment.getByStudent.useQuery(
    { studentId: student.id },
    { enabled: Boolean(student.id) },
  );

  const activeEnrollments = useMemo(
    () => studentEnrollments.filter((enr) => enr.status === "active"),
    [studentEnrollments],
  );

  type GroupDisplayItem =
    | {
        type: "enrolled";
        key: string;
        courseId: number;
        courseName: string;
        groupName: string;
      }
    | {
        type: "no_group";
        key: string;
        courseId: number;
        courseName: string;
      };

  const groupDisplayItems = useMemo<GroupDisplayItem[]>(() => {
    // Deduplicate courses by normalized name to preserve exact course order
    const seenCourseKeys = new Set<string>();
    const uniqueCourses = (student.courses || []).filter((course) => {
      const key = course.name.trim().toLowerCase();
      if (seenCourseKeys.has(key)) return false;
      seenCourseKeys.add(key);
      return true;
    });

    const items: GroupDisplayItem[] = [];
    const matchedEnrollmentIds = new Set<number>();

    // 1. Follow the exact order of enrolled courses
    for (const course of uniqueCourses) {
      const courseEnrollments = activeEnrollments.filter((enr) => enr.courseId === course.id);
      if (courseEnrollments.length > 0) {
        for (const enr of courseEnrollments) {
          matchedEnrollmentIds.add(enr.id);
          items.push({
            type: "enrolled",
            key: `enr-${enr.id}`,
            courseId: course.id,
            courseName: course.name,
            groupName: enr.groupName,
          });
        }
      } else {
        items.push({
          type: "no_group",
          key: `no-group-${course.id}`,
          courseId: course.id,
          courseName: course.name,
        });
      }
    }

    // 2. Append any active group enrollments not tied to courses in student.courses
    for (const enr of activeEnrollments) {
      if (!matchedEnrollmentIds.has(enr.id)) {
        items.push({
          type: "enrolled",
          key: `enr-${enr.id}`,
          courseId: enr.courseId,
          courseName: enr.courseName,
          groupName: enr.groupName,
        });
      }
    }

    return items;
  }, [student.courses, activeEnrollments]);

  const createdDateStr = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/20 border-t border-slate-200/80 space-y-4 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Col 1: Guardian / Contact */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Părinte / Tutore
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              Contact Primar
            </span>
          </div>
          <ParentCallWidget
            parentName={student.parentName}
            parentPhone={student.parentPhone}
          />

          {student.phone && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Telefon Student
              </span>
              <a
                href={`tel:${student.phone}`}
                className="block text-xs font-medium text-slate-700 hover:text-blue-600 mt-0.5"
              >
                {formatPhone(student.phone)}
              </a>
            </div>
          )}
        </div>

        {/* Col 2: Academic & School info */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Detalii Înscriere
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              {student.age ? `${student.age} ani` : "Vârstă N/A"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <SchoolIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800">{schoolName || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Înscris la {createdDateStr}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
              Cursuri Înrolate
            </span>
            <StudentCoursesCell
              studentId={student.id}
              currentCourses={student.courses || []}
              availableCourses={availableCourses}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Grupe & Cohorte
              </span>
              <button
                type="button"
                onClick={() => setShowEnrollmentDrawer(true)}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+</span>
                <span>Înrolare Grupe</span>
              </button>
            </div>

            {groupDisplayItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nu este înrolat în niciun curs sau grupă</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {groupDisplayItems.map((item) => {
                  const color = getCourseColor(item.courseId);

                  if (item.type === "enrolled") {
                    return (
                      <span
                        key={item.key}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-all ${color.bg} ${color.text} ${color.border}`}
                        title={`${item.courseName} - ${item.groupName} (activ)`}
                      >
                        <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
                        <span className="font-semibold">{item.courseName}:</span>
                        <span>{item.groupName}</span>
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setShowEnrollmentDrawer(true)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed shadow-xs transition-all cursor-pointer hover:opacity-90 ${color.bg} ${color.text} ${color.border}`}
                      title={`${item.courseName}: Nicio grupă selectată. Click pentru a înrola într-o grupă.`}
                    >
                      <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
                      <span className="font-semibold">{item.courseName}:</span>
                      <span className="italic opacity-80">Nicio grupă selectată</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Notes & Quick Actions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Observații Pedagogice
            </span>
            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
              {student.info || "Nu sunt menționate notițe sau recomandări speciale."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Link
              href={`/dashboard/students/${student.id}`}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
            >
              Dosar Elev →
            </Link>
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition"
            >
              Editează Profil
            </button>
            <button
              onClick={onDelete}
              disabled={deletePending}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition disabled:opacity-50"
            >
              Șterge
            </button>
          </div>
        </div>
      </div>

      {/* Enrollment Drawer */}
      {showEnrollmentDrawer && (
        <EnrollmentDrawer
          isOpen={showEnrollmentDrawer}
          onClose={() => setShowEnrollmentDrawer(false)}
          studentId={student.id}
          studentName={student.name}
          schoolId={student.schoolId}
          courses={student.courses}
        />
      )}
    </div>
  );
}
