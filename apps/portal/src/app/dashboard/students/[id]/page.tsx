"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { formatPhone } from "@/lib/phone";
import { StudentFormDrawer } from "@/components/dashboard/StudentForm";
import { EnrollmentDrawer } from "@/components/dashboard/EnrollmentDrawer";
import { ParentCallWidget } from "@/components/dashboard/ParentCallWidget";
import { ABSENCE_PRESET_CHIPS } from "@/components/dashboard/AbsenceCommentWidget";
import {
  ChevronLeftIcon,
  PhoneIcon,
  CalendarIcon,
  SchoolIcon,
  StudentsIcon,
  PlusIcon,
  XIcon,
  TrendingUpIcon,
  BookOpenIcon,
} from "@/components/ui/icons";

const DAY_LABELS: Record<string, string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Fără orar stabilit";
}

function getLevelBadge(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Avansat
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {level || "Standard"}
        </span>
      );
  }
}

function getEnrollmentStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "active":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Activ
        </span>
      );
    case "completed":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
          Finalizat
        </span>
      );
    case "archived":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Arhivat
        </span>
      );
    case "inactive":
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Inactiv
        </span>
      );
  }
}

function getAttendanceBadge(status: string) {
  switch (status) {
    case "present":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Prezent
        </span>
      );
    case "late":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Întârziat
        </span>
      );
    case "absent":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      );
    case "excused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Învoit
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
}

function formatAbsenceComment(comment: string | null | undefined) {
  if (!comment || !comment.trim()) {
    return <span className="text-slate-400 italic">—</span>;
  }
  const matchedChip = ABSENCE_PRESET_CHIPS.find(
    (chip) =>
      comment.toLowerCase().includes(chip.label.toLowerCase()) ||
      comment.toLowerCase().includes(chip.text.toLowerCase()),
  );

  if (matchedChip) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
        <span>{matchedChip.emoji}</span>
        <span>{comment}</span>
      </span>
    );
  }

  return <span className="text-slate-600 italic">{comment}</span>;
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = Number(params.id);

  const { data: session, status: authStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const canAccess = isSuperAdmin || permissions.includes("admin") || role === "admin" || permissions.includes("teach") || role === "teacher";

  // Modal / Drawer states
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showEnrollDrawer, setShowEnrollDrawer] = useState(false);
  const [statusModalEnrollment, setStatusModalEnrollment] = useState<{
    id: number;
    courseName: string;
    groupName: string;
    status: string | null;
    notes?: string | null;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "archived" | "completed">("completed");
  const [statusNote, setStatusNote] = useState("");

  // Tabs for courses
  const [courseTab, setCourseTab] = useState<"active" | "history">("active");

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
  const { data: courses = [] } = trpc.user.listCourses.useQuery(undefined, {
    enabled: canAccess,
  });

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

  const handleOpenStatusModal = (enr: {
    id: number;
    courseName: string;
    groupName: string;
    status: string | null;
    notes?: string | null;
  }) => {
    setStatusModalEnrollment(enr);
    setNewStatus((enr.status === "active" ? "completed" : "active") as any);
    setStatusNote(enr.notes || "");
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalEnrollment) return;
    updateStatusMutation.mutate({
      enrollmentId: statusModalEnrollment.id,
      status: newStatus,
      notes: statusNote.trim() || null,
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
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <StudentsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu ai permisiuni suficiente pentru a vizualiza dosarul acestui elev.
        </p>
        <Link
          href="/dashboard/students"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Înapoi la catalog
        </Link>
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <StudentsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Elevul nu a fost găsit</h2>
        <p className="text-sm text-slate-500 mt-1">
          {studentError?.message || "Profilul solicitat nu există sau aparține altei școli."}
        </p>
        <Link
          href="/dashboard/students"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Înapoi la catalog
        </Link>
      </div>
    );
  }

  const createdDateFormatted = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

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

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Înapoi la Catalog Studenți</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEnrollDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition hover:border-slate-300"
          >
            <PlusIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Înrolare în Grupă</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEditDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/20 transition hover:scale-[1.01]"
          >
            <span>Editează Profil</span>
          </button>
        </div>
      </div>

      {/* 1. Header & Contact Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                {student.name ? student.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      student.active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {student.active ? "Student Activ" : "Student Inactiv"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {student.age ? `${student.age} ani` : "Vârstă Nespecificată"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.schoolName || "Campus Principal"}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Înscris la {createdDateFormatted}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Direct Contact */}
          <div className="space-y-1.5 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact Student
            </span>
            {student.phone ? (
              <a
                href={`tel:${student.phone}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-600 transition group"
              >
                <PhoneIcon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>{formatPhone(student.phone)}</span>
              </a>
            ) : (
              <p className="text-xs text-slate-400 italic">Fără număr de telefon personal</p>
            )}
            <p className="text-[11px] text-slate-400">Apel direct sau WhatsApp</p>
          </div>

          {/* Parent / Guardian Contact */}
          <div className="space-y-2 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Părinte / Reprezentant Legal
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                Contact Primar
              </span>
            </div>
            <ParentCallWidget
              parentName={student.parentName}
              parentPhone={student.parentPhone}
            />
          </div>

          {/* Pedagogical Notes */}
          <div className="space-y-1.5 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Observații Pedagogice & Recomandări
            </span>
            <p className="text-xs text-slate-600 italic line-clamp-3">
              {student.info || "Nu sunt menționate notițe speciale pentru acest elev."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Attendance Summary Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-blue-600" />
              <span>Sinteză Prezență & Disciplină Cursuri</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculat pe baza tuturor sesiunilor desfășurate în grupele înrolate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Rată Globală:</span>
            {attendanceSummary.attendanceRate === null ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                Fără date
              </span>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-black border ${
                  attendanceSummary.attendanceRate >= 85
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : attendanceSummary.attendanceRate >= 70
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {attendanceSummary.attendanceRate}%
              </span>
            )}
          </div>
        </div>

        {/* 4 Attendance KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Sesiuni
            </span>
            <p className="text-2xl font-black text-slate-900">{attendanceSummary.totalSessions}</p>
            <p className="text-[11px] text-slate-500">Lecții înregistrate în sistem</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Prezențe Totale
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-emerald-700">
                {attendanceSummary.attendedCount}
              </p>
              <span className="text-xs text-emerald-600">
                ({attendanceSummary.presentCount} prezenți, {attendanceSummary.lateCount} întârzieri)
              </span>
            </div>
            <p className="text-[11px] text-emerald-600">Participare activă la clasă</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
              Absențe Nemotivate
            </span>
            <p className="text-2xl font-black text-rose-700">{attendanceSummary.absentCount}</p>
            <p className="text-[11px] text-rose-600">Sesiuni ratate fără învoire</p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
              Învoiri / Motivate
            </span>
            <p className="text-2xl font-black text-blue-700">{attendanceSummary.excusedCount}</p>
            <p className="text-[11px] text-blue-600">Absențe justificate medical/părinte</p>
          </div>
        </div>

        {/* Attendance Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Rata de participare efectivă</span>
            <span>
              {attendanceSummary.attendanceRate === null
                ? "Nicio sesiune desfășurată"
                : `${attendanceSummary.attendanceRate}%`}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            {attendanceSummary.totalSessions > 0 ? (
              <>
                <div
                  style={{
                    width: `${(attendanceSummary.presentCount / attendanceSummary.totalSessions) * 100}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title="Prezent la timp"
                />
                <div
                  style={{
                    width: `${(attendanceSummary.lateCount / attendanceSummary.totalSessions) * 100}%`,
                  }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title="Întârziat"
                />
                <div
                  style={{
                    width: `${(attendanceSummary.excusedCount / attendanceSummary.totalSessions) * 100}%`,
                  }}
                  className="bg-blue-400 h-full transition-all duration-500"
                  title="Învoit"
                />
                <div
                  style={{
                    width: `${(attendanceSummary.absentCount / attendanceSummary.totalSessions) * 100}%`,
                  }}
                  className="bg-rose-500 h-full transition-all duration-500"
                  title="Absent"
                />
              </>
            ) : (
              <div className="w-full h-full bg-slate-100" title="Nicio sesiune înregistrată" />
            )}
          </div>
        </div>

        {/* Detailed Attendance Session Log / Timeline */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cronologie Sesiuni de Curs & Prezență
          </h3>

          {isLoadingAttendance ? (
            <p className="text-xs text-slate-400">Se încarcă istoricul de prezență...</p>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-600">
                Nu există încă sesiuni de prezență înregistrate pentru acest elev.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prezențele vor apărea aici automat când profesorii marchează catalogul la cursuri.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="px-3.5 py-2.5">Dată Sesiune</th>
                    <th className="px-3.5 py-2.5">Curs & Nivel</th>
                    <th className="px-3.5 py-2.5">Grupă & Orar</th>
                    <th className="px-3.5 py-2.5">Sală</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Observație Profesor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.map((rec) => {
                    const sessionDateFormatted = new Date(rec.date + "T00:00:00").toLocaleDateString(
                      "ro-RO",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    );

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                          {sessionDateFormatted}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{rec.courseName}</span>
                            {getLevelBadge(rec.courseLevel)}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-700 block">{rec.groupName}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatSchedule(rec.scheduleDays, rec.scheduleTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">
                          {rec.room || "Lab principal"}
                        </td>
                        <td className="px-3.5 py-2.5">{getAttendanceBadge(rec.status)}</td>
                        <td className="px-3.5 py-2.5 max-w-xs truncate">
                          {formatAbsenceComment(rec.comment)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Enrolled Courses & Groups (Active vs History) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-6 pt-6 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCourseTab("active")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                courseTab === "active"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Grupe & Cursuri Active</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {activeEnrollments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCourseTab("history")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                courseTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Istoric Cursuri Finalizate & Arhivate</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
                {historyEnrollments.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowEnrollDrawer(true)}
            className="pb-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>+ Înrolare nouă</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {isLoadingEnrollments ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Se încarcă lista de grupe...
            </div>
          ) : courseTab === "active" ? (
            activeEnrollments.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  Nicio grupă activă în acest moment
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Elevul nu este înrolat în nicio grupă activă. Folosește butonul de mai jos pentru a-l înrola într-o grupă.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEnrollDrawer(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Înrolează în Curs</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEnrollments.map((enr) => {
                  const joinedDateFormatted = enr.joinedAt
                    ? new Date(enr.joinedAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <div
                      key={enr.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-sm space-y-4 hover:border-blue-200 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {enr.courseName}
                            </span>
                            {getLevelBadge(enr.courseLevel)}
                          </div>
                          <h3 className="text-base font-black text-slate-900 mt-0.5">
                            {enr.groupName}
                          </h3>
                        </div>
                        {getEnrollmentStatusBadge(enr.status)}
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Orar Săptămânal:</span>
                          <span className="font-bold text-slate-800">
                            {formatSchedule(enr.scheduleDays, enr.scheduleTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Sală / Locație:</span>
                          <span className="font-semibold text-slate-800">{enr.room || "Sala Principală"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Profesor / Mentor:</span>
                          <span className="font-semibold text-slate-800">
                            {enr.teacherName || "Neasignat"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                          <span className="text-slate-400 font-medium">Data Înrolării:</span>
                          <span className="text-slate-700">{joinedDateFormatted}</span>
                        </div>
                      </div>

                      {enr.notes && (
                        <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          Notă: {enr.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(enr)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          Schimbă Status / Arhivează
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            historyEnrollments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Fără istoric de cursuri finalizate</p>
                <p className="text-xs text-slate-400">
                  Când un curs este marcat drept finalizat sau arhivat, acesta va apărea aici cu data completării și nivelul atins.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="px-4 py-3">Curs & Nivel</th>
                      <th className="px-4 py-3">Grupă</th>
                      <th className="px-4 py-3">Orar / Profesor</th>
                      <th className="px-4 py-3">Perioadă Înrolare</th>
                      <th className="px-4 py-3">Status Final</th>
                      <th className="px-4 py-3">Observații</th>
                      <th className="px-4 py-3 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyEnrollments.map((enr) => {
                      const joinedDateFormatted = enr.joinedAt
                        ? new Date(enr.joinedAt).toLocaleDateString("ro-RO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";

                      const leftDateFormatted = enr.leftAt
                        ? new Date(enr.leftAt).toLocaleDateString("ro-RO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";

                      return (
                        <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{enr.courseName}</span>
                              {getLevelBadge(enr.courseLevel)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {enr.groupName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{formatSchedule(enr.scheduleDays, enr.scheduleTime)}</div>
                            <div className="text-[11px] text-slate-400">{enr.teacherName || "Neasignat"}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            <div>Înscris: {joinedDateFormatted}</div>
                            <div className="text-[11px] text-slate-400">Finalizat: {leftDateFormatted}</div>
                          </td>
                          <td className="px-4 py-3">{getEnrollmentStatusBadge(enr.status)}</td>
                          <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                            {enr.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(enr)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                            >
                              Modifică / Reactivează
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Status Toggle Modal */}
      {statusModalEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Modifică Status Înscriere
                </h3>
                <p className="text-xs text-slate-500">
                  {statusModalEnrollment.courseName} • {statusModalEnrollment.groupName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalEnrollment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Status Nou
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                >
                  <option value="active">Activ (Grupă în derulare)</option>
                  <option value="completed">Finalizat (A absolvit nivelul cursului)</option>
                  <option value="archived">Arhivat (Retras / Trecut în arhivă)</option>
                  <option value="inactive">Inactiv (Pauză temporară)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Notă sau Motivare (opțional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Ex: A finalizat modulul cu succes, recomandare pentru nivelul următor..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalEnrollment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? "Se salvează..." : "Salvează Modificările"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Drawer */}
      {showEditDrawer && (
        <StudentFormDrawer
          student={student}
          schools={schools}
          courses={courses}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowEditDrawer(false)}
          currentUserSchoolId={session?.user?.schoolId ?? undefined}
        />
      )}

      {/* Enroll in Groups Drawer */}
      {showEnrollDrawer && (
        <EnrollmentDrawer
          isOpen={showEnrollDrawer}
          onClose={() => setShowEnrollDrawer(false)}
          studentId={student.id}
          studentName={student.name}
          schoolId={student.schoolId}
        />
      )}
    </div>
  );
}
