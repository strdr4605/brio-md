"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { StudentFormDrawer, type StudentFormStudent } from "@/components/dashboard/StudentForm";
import { StudentKpiCards } from "@/components/dashboard/StudentKpiCards";
import { StudentFiltersBar } from "@/components/dashboard/StudentFiltersBar";
import { StudentMobileCard } from "@/components/dashboard/StudentMobileCard";
import { StudentDesktopTable } from "@/components/dashboard/StudentDesktopTable";
import {
  StudentsIcon,
  PlusIcon,
} from "@/components/ui/icons";

export default function StudentiPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") || permissions.includes("admin") || role === "superadmin" || role === "admin";
  const canManageStudents = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormStudent | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "1") {
        setEditingStudent(null);
        setShowForm(true);
      }
    }
  }, []);

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

  const { data: students = [], isLoading } = trpc.student.list.useQuery(undefined, { enabled: canManageStudents });
  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, { enabled: canManageStudents });
  const { data: courses = [] } = trpc.user.listCourses.useQuery(undefined, { enabled: canManageStudents });

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

        if (selectedSchoolId !== "all" && student.schoolId !== selectedSchoolId) return false;
        const studentCourses = (student as any).courses || [];
        if (courseFilter === "enrolled" && studentCourses.length === 0) return false;
        if (courseFilter === "unenrolled" && studentCourses.length > 0) return false;
        return true;
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ro", { sensitivity: "base" }));
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
    <>
      <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalog Studenți</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
              {students.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestionează datele de contact, înscrierile și activitatea fiecărui elev.
          </p>
        </div>

        <button
          type="button"
          data-testid="add-student-button"
          onClick={handleCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
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

      {/* Main Table with Smart Expandable Rows */}
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
          {/* Mobile Card List (Thumb-friendly touch view) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const school = schools.find((s) => s.id === student.schoolId);
              return (
                <StudentMobileCard
                  key={student.id}
                  student={student}
                  school={school}
                  courses={courses}
                  isExpanded={expandedStudentId === student.id}
                  onToggleExpand={() => toggleExpand(student.id)}
                  onEdit={() => handleEdit(student)}
                  onDelete={() => handleDelete(student.id)}
                  deletePending={deleteMutation.isPending}
                />
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <StudentDesktopTable
              students={filteredStudents}
              schools={schools}
              courses={courses}
              expandedStudentId={expandedStudentId}
              onToggleExpand={toggleExpand}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletePending={deleteMutation.isPending}
            />
          </div>
        </div>
      )}
      </div>

      {/* Edit / Create Drawer */}
      {showForm && (
        <StudentFormDrawer
          student={editingStudent}
          schools={schools}
          courses={courses}
          isSuperAdmin={permissions.includes("super") || role === "superadmin"}
          onCloseAction={() => setShowForm(false)}
          currentUserSchoolId={session?.user?.schoolId ?? undefined}
        />
      )}
    </>
  );
}
