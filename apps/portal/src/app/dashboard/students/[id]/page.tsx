"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ACADEMIC_LABELS, type StudentProfileTab } from "@brio-md/ui";
import { trpc } from "@/lib/trpc";
import { StudentProfileStateScreen } from "@/components/dashboard/StudentProfileHeader";
import { StudentProfileBreadcrumb } from "@/components/dashboard/StudentProfileBreadcrumb";
import { StudentDossierSidebar } from "@/components/dashboard/StudentDossierSidebar";
import { StudentModuleProgressBar } from "@/components/dashboard/StudentModuleProgressBar";
import { StudentNotesTab } from "@/components/dashboard/StudentNotesTab";
import { StudentAttendanceTab } from "@/components/dashboard/StudentAttendanceTab";
import { StudentCoursesTab } from "@/components/dashboard/StudentCoursesTab";
import { StudentBillingTab } from "@/components/dashboard/billing/StudentBillingTab";
import {
  StudentEnrollmentStatusModal,
  type EnrollmentStatusItem,
} from "@/components/dashboard/StudentEnrollmentStatusModal";
import { StudentFormDrawer } from "@/components/dashboard/StudentForm";
import { EnrollmentDrawer } from "@/components/dashboard/EnrollmentDrawer";
import {
  TrendingUpIcon,
  BookOpenIcon,
  CalendarIcon,
} from "@/components/ui/icons";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = Number(params.id);

  const { data: session, status: authStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const canAccess =
    isSuperAdmin ||
    permissions.includes("admin") ||
    role === "admin" ||
    permissions.includes("teach") ||
    role === "teacher";

  // Modal / Drawer states
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showEnrollDrawer, setShowEnrollDrawer] = useState(false);
  const [statusModalEnrollment, setStatusModalEnrollment] =
    useState<EnrollmentStatusItem | null>(null);

  // Sync active tab with URL search parameter (?tab=courses)
  const currentTabParam = searchParams.get("tab");
  const activeTab: StudentProfileTab =
    currentTabParam === "attendance" ||
    currentTabParam === "billing" ||
    currentTabParam === "notes"
      ? currentTabParam
      : "courses";

  const handleTabChange = (tab: StudentProfileTab) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  const utils = trpc.useUtils();

  // Queries
  const {
    data: student,
    isLoading: isLoadingStudent,
    error: studentError,
  } = trpc.student.getById.useQuery(
    { id: studentId },
    { enabled: canAccess && Boolean(studentId) },
  );

  const {
    data: enrollments = [],
    isLoading: isLoadingEnrollments,
  } = trpc.enrollment.getByStudent.useQuery(
    { studentId },
    { enabled: canAccess && Boolean(studentId) },
  );

  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
  } = trpc.attendance.getByStudent.useQuery(
    { studentId },
    { enabled: canAccess && Boolean(studentId) },
  );

  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: canAccess,
  });
  const { data: courses = [] } = trpc.user.listCourses.useQuery(
    { schoolId: student?.schoolId ?? undefined },
    { enabled: canAccess },
  );

  const { data: balanceSummary } = trpc.billing.getStudentBalanceSummary.useQuery(
    { studentId },
    { enabled: canAccess && Boolean(studentId) },
  );

  // Mutations
  const updateStatusMutation = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => {
      utils.enrollment.getByStudent.invalidate({ studentId });
      utils.student.getById.invalidate({ id: studentId });
      setStatusModalEnrollment(null);
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la actualizarea statusului");
    },
  });

  const handleOpenStatusModal = (enr: EnrollmentStatusItem) => {
    setStatusModalEnrollment(enr);
  };

  const handleSaveStatus = ({
    enrollmentId,
    status,
    notes,
  }: {
    enrollmentId: number;
    status: "active" | "inactive" | "archived" | "completed";
    notes: string | null;
  }) => {
    updateStatusMutation.mutate({
      enrollmentId,
      status,
      notes,
    });
  };

  // Group enrollments into Active vs. History
  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === "active"),
    [enrollments],
  );

  const historyEnrollments = useMemo(
    () => enrollments.filter((e) => e.status !== "active"),
    [enrollments],
  );

  const createdDateFormatted = useMemo(() => {
    if (!student?.createdAt) return "—";
    return new Date(student.createdAt).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [student?.createdAt]);

  const attendanceSummary = attendanceData?.summary || {
    totalSessions: 0,
    attendedCount: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    attendanceRate: null as number | null,
  };

  const attendanceRecords = attendanceData?.records || [];

  if (authStatus === "loading" || isLoadingStudent) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 h-96 bg-slate-200/80 rounded-2xl" />
          <div className="col-span-12 lg:col-span-8 h-96 bg-slate-200/80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <StudentProfileStateScreen
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        title="Acces Restricționat"
        message="Nu ai permisiuni suficiente pentru a vizualiza dosarul acestui elev."
      />
    );
  }

  if (studentError || !student) {
    return (
      <StudentProfileStateScreen
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        title="Elevul nu a fost găsit"
        message={studentError?.message || "Profilul solicitat nu există sau aparține altei școli."}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb & Action Triggers */}
      <StudentProfileBreadcrumb
        onOpenEnroll={() => setShowEnrollDrawer(true)}
        onOpenEdit={() => setShowEditDrawer(true)}
      />

      {/* Main 30% / 70% Layout Grid (Mobile 390px: single column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (30% on lg:grid-cols-12): Student Identity Dossier */}
        <StudentDossierSidebar
          student={student}
          balanceSummary={balanceSummary}
          createdDateFormatted={createdDateFormatted}
          onOpenBillingTab={() => handleTabChange("billing")}
        />

        {/* Right Column (70% on lg:grid-cols-12): Tabbed Workspace */}
        <main className="col-span-12 lg:col-span-8 space-y-4">
          {/* Tab Navigation Header Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => handleTabChange("courses")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === "courses"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <BookOpenIcon className="w-3.5 h-3.5" />
                <span>{ACADEMIC_LABELS.tabs.courses}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                  {activeEnrollments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("attendance")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === "attendance"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{ACADEMIC_LABELS.tabs.attendance}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("billing")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === "billing"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <TrendingUpIcon className="w-3.5 h-3.5" />
                <span>{ACADEMIC_LABELS.tabs.billing}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("notes")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{ACADEMIC_LABELS.tabs.notes}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEnrollDrawer(true)}
              className="h-8 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1 shrink-0 transition"
            >
              <span>{ACADEMIC_LABELS.profile.addGroup}</span>
            </button>
          </div>

          {/* Tab Workspace Content */}
          {activeTab === "courses" && (
            <div className="space-y-4">
              <StudentModuleProgressBar
                currentModule={2}
                totalModules={4}
                moduleName={activeEnrollments[0]?.courseName || "Modul Curricular"}
              />
              <StudentCoursesTab
                activeEnrollments={activeEnrollments}
                historyEnrollments={historyEnrollments}
                isLoadingEnrollments={isLoadingEnrollments}
                onOpenEnrollDrawer={() => setShowEnrollDrawer(true)}
                onOpenStatusModal={handleOpenStatusModal}
              />
            </div>
          )}

          {activeTab === "attendance" && (
            <StudentAttendanceTab
              attendanceSummary={attendanceSummary}
              attendanceRecords={attendanceRecords}
              isLoadingAttendance={isLoadingAttendance}
            />
          )}

          {activeTab === "billing" && (
            <StudentBillingTab studentId={studentId} studentName={student.name} />
          )}

          {activeTab === "notes" && (
            <StudentNotesTab
              info={student.info}
              parentName={student.parentName}
              parentPhone={student.parentPhone}
            />
          )}
        </main>
      </div>

      {/* Status Toggle Modal */}
      <StudentEnrollmentStatusModal
        enrollment={statusModalEnrollment}
        onClose={() => setStatusModalEnrollment(null)}
        onSave={handleSaveStatus}
        isSaving={updateStatusMutation.isPending}
      />

      {/* Edit Student Drawer */}
      {showEditDrawer && (
        <StudentFormDrawer
          student={student}
          schools={schools}
          courses={courses}
          isSuperAdmin={isSuperAdmin}
          onCloseAction={() => setShowEditDrawer(false)}
          currentUserSchoolId={session?.user?.schoolId ?? undefined}
        />
      )}

      {/* Enroll in Groups Drawer */}
      {showEnrollDrawer && (
        <EnrollmentDrawer
          isOpen={showEnrollDrawer}
          onCloseAction={() => setShowEnrollDrawer(false)}
          studentId={student.id}
          studentName={student.name}
          schoolId={student.schoolId}
          courses={student.courses}
        />
      )}
    </div>
  );
}
