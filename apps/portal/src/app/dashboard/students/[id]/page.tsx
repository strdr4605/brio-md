"use client";

import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  StudentProfileHeader,
  StudentProfileStateScreen,
} from "@/components/dashboard/StudentProfileHeader";
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
  ChevronLeftIcon,
  PlusIcon,
  TrendingUpIcon,
  BookOpenIcon,
} from "@/components/ui/icons";

export default function StudentProfilePage() {
  const params = useParams();
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

  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"academic" | "billing">(
    urlTab === "billing" ? "billing" : "academic",
  );

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
        <div className="h-44 bg-slate-200/80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
          <div className="h-28 bg-slate-200/80 rounded-2xl" />
        </div>
        <div className="h-96 bg-slate-200/80 rounded-2xl" />
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
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition truncate"
        >
          <ChevronLeftIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">Înapoi la Catalog Studenți</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowEnrollDrawer(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition hover:border-slate-300"
          >
            <PlusIcon className="w-3.5 h-3.5 text-slate-700" />
            <span>Înrolare în Grupă</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEditDrawer(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
          >
            <span>Editează Profil</span>
          </button>
        </div>
      </div>

      {/* 1. Header & Contact Information Card */}
      <StudentProfileHeader
        student={student}
        balanceSummary={balanceSummary}
        createdDateFormatted={createdDateFormatted}
        onOpenBillingTab={() => setActiveTab("billing")}
      />

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-200/80 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab("academic")}
          className={`pb-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === "academic"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpenIcon className="w-4 h-4" />
          <span>Parcurs Academic & Prezență</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {activeEnrollments.length} grupe
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`pb-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === "billing"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingUpIcon className="w-4 h-4" />
          <span>Finanțe & Facturi</span>
          {balanceSummary && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                balanceSummary.currentDebt > 0
                  ? balanceSummary.overdueCount > 0
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {balanceSummary.currentDebt > 0
                ? `${balanceSummary.currentDebt} MDL restanță`
                : "La zi"}
            </span>
          )}
        </button>
      </div>

      {activeTab === "academic" ? (
        <>
          {/* 2. Attendance Summary Widget */}
          <StudentAttendanceTab
            attendanceSummary={attendanceSummary}
            attendanceRecords={attendanceRecords}
            isLoadingAttendance={isLoadingAttendance}
          />

          {/* 3. Enrolled Courses & Groups */}
          <StudentCoursesTab
            activeEnrollments={activeEnrollments}
            historyEnrollments={historyEnrollments}
            isLoadingEnrollments={isLoadingEnrollments}
            onOpenEnrollDrawer={() => setShowEnrollDrawer(true)}
            onOpenStatusModal={handleOpenStatusModal}
          />
        </>
      ) : (
        <StudentBillingTab studentId={studentId} studentName={student.name} />
      )}

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
