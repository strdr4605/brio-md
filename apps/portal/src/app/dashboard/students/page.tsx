"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { StudentFormDrawer, type StudentFormStudent } from "@/components/dashboard/StudentForm";
import { StudentCoursesCell } from "@/components/dashboard/StudentCoursesCell";
import { StudentRowDetails } from "@/components/dashboard/StudentRowDetails";
import { StudentKpiCards } from "@/components/dashboard/StudentKpiCards";
import { StudentFiltersBar } from "@/components/dashboard/StudentFiltersBar";
import { formatPhone } from "@/lib/phone";
import {
  StudentsIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";

export default function StudentiPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";
  const canManageStudents = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormStudent | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "all">("all");
  const [courseFilter, setCourseFilter] = useState<"all" | "enrolled" | "unenrolled">("all");

  const utils = trpc.useUtils();
  const deleteMutation = trpc.student.delete.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la ștergere");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Sigur doriți să ștergeți acest student?")) {
      deleteMutation.mutate({ id });
      if (expandedStudentId === id) setExpandedStudentId(null);
    }
  };

  const { data: students = [], isLoading } = trpc.student.list.useQuery(undefined, {
    enabled: canManageStudents,
  });
  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: canManageStudents,
  });
  const { data: courses = [] } = trpc.user.listCourses.useQuery(undefined, {
    enabled: canManageStudents,
  });

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = (student.name || "").toLowerCase().includes(q);
          const matchesPhone = (student.phone || "").includes(q);
          const matchesParent = (student.parentName || "").toLowerCase().includes(q);
          const matchesParentPhone = (student.parentPhone || "").includes(q);
          if (!matchesName && !matchesPhone && !matchesParent && !matchesParentPhone) return false;
        }

        if (selectedSchoolId !== "all" && student.schoolId !== selectedSchoolId) {
          return false;
        }

        const studentCourses = (student as any).courses || [];
        if (courseFilter === "enrolled" && studentCourses.length === 0) return false;
        if (courseFilter === "unenrolled" && studentCourses.length > 0) return false;

        return true;
      })
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "ro", { sensitivity: "base" })
      );
  }, [students, search, selectedSchoolId, courseFilter]);

  if (status === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-28 bg-slate-200/80 rounded-2xl" />
        <div className="h-96 bg-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  if (!canManageStudents) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <StudentsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">Nu ai permisiuni suficiente pentru catalogul de studenți.</p>
      </div>
    );
  }

  const handleCreate = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student: (typeof students)[number]) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const toggleExpand = (id: number) => {
    setExpandedStudentId((prev) => (prev === id ? null : id));
  };

  const enrolledCount = students.filter((s: any) => s.courses && s.courses.length > 0).length;
  const unenrolledCount = students.length - enrolledCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalog Studenți</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {students.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestionează datele de contact, înscrierile și activitatea fiecărui elev.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Adaugă Student</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <StudentKpiCards
        totalStudents={students.length}
        enrolledCount={enrolledCount}
        unenrolledCount={unenrolledCount}
        schoolsCount={schools.length || 1}
      />

      {/* Filters Toolbar */}
      <StudentFiltersBar
        search={search}
        setSearch={setSearch}
        selectedSchoolId={selectedSchoolId}
        setSelectedSchoolId={setSelectedSchoolId}
        schools={schools}
        courseFilter={courseFilter}
        setCourseFilter={setCourseFilter}
      />

      {/* Main Table with Smart Expandable Rows ("Умная раскрывашка") */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <p className="text-sm text-slate-500">Se încarcă catalogul...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <StudentsIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Niciun student găsit</p>
          <p className="text-xs text-slate-400 mt-1">Încearcă să ajustezi filtrele sau căutarea.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
                {filteredStudents.map((student) => {
                  const school = schools.find((s) => s.id === student.schoolId);
                  const isExpanded = expandedStudentId === student.id;
                  const displayPhone = student.phone || student.parentPhone;

                  return (
                    <tr key={student.id} className="contents">
                      {/* Main Summary Row */}
                      <tr
                        onClick={() => toggleExpand(student.id)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isExpanded ? "bg-blue-50/40" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 group-hover:text-blue-600 transition"
                            aria-label={isExpanded ? "Restrânge detalii" : "Extinde detalii"}
                          >
                            <ChevronDownIcon
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-0 text-blue-600" : "-rotate-90"
                              }`}
                            />
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">
                                {student.name}
                              </span>
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
                              className="font-medium text-slate-700 hover:text-blue-600 inline-flex items-center gap-1"
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
                            currentCourses={(student as any).courses || []}
                            availableCourses={courses}
                          />
                        </td>

                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              disabled={deleteMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                            >
                              Șterge
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Smart Expandable Detail Row ("Умная раскрывашка") */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <StudentRowDetails
                              student={student}
                              schoolName={school?.name}
                              availableCourses={courses}
                              onEdit={() => handleEdit(student)}
                              onDelete={() => handleDelete(student.id)}
                              deletePending={deleteMutation.isPending}
                            />
                          </td>
                        </tr>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Drawer */}
      {showForm && (
        <StudentFormDrawer
          student={editingStudent}
          schools={schools}
          courses={courses}
          isSuperAdmin={permissions.includes("super") || role === "superadmin"}
          onClose={() => setShowForm(false)}
          currentUserSchoolId={session?.user?.schoolId ?? undefined}
        />
      )}
    </div>
  );
}
