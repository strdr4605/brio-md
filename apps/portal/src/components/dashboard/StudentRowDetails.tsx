"use client";

import { formatPhone } from "@/lib/phone";
import { PhoneIcon, CalendarIcon, SchoolIcon } from "@/components/ui/icons";
import { StudentCoursesCell } from "./StudentCoursesCell";

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
          <div>
            <p className="text-sm font-bold text-slate-800">
              {student.parentName || "Nume nespecificat"}
            </p>
            {student.parentPhone ? (
              <a
                href={`tel:${student.parentPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mt-1"
              >
                <PhoneIcon className="w-3.5 h-3.5" />
                <span>{formatPhone(student.parentPhone)}</span>
              </a>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Fără număr înregistrat</p>
            )}
          </div>

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
    </div>
  );
}
