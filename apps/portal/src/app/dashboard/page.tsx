"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  UsersIcon,
  StudentsIcon,
  BookOpenIcon,
  CalendarIcon,
  UserCheckIcon,
  TrendingUpIcon,
  InvoiceIcon,
  BarChartIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SchoolIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";
  const canManageStudents = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";
  const isBillingAllowed = permissions.includes("manage_billing") || isSuperOrAdmin;

  // Real-time telemetry queries
  const { data: students = [], isLoading: loadingStudents } = trpc.student.list.useQuery(undefined, {
    enabled: canManageStudents,
  });

  const { data: users = [], isLoading: loadingUsers } = trpc.user.list.useQuery(
    {},
    { enabled: isSuperOrAdmin }
  );

  const { data: courses = [], isLoading: loadingCourses } = trpc.user.listCourses.useQuery(undefined, {
    enabled: canManageStudents,
  });

  const { data: groups = [], isLoading: loadingGroups } = trpc.group.list.useQuery(undefined, {
    enabled: canManageStudents,
  });

  const { data: kpiSummary, isLoading: loadingKpi } = trpc.billing.getInvoicesSummary.useQuery(undefined, {
    enabled: isBillingAllowed,
    staleTime: 30_000,
  });

  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (status === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200/70 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeUsersCount = users.filter((u) => u.active).length;
  const studentsWithCourses = students.filter(
    (s: any) => Array.isArray(s.courses) && s.courses.length > 0
  ).length;

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in-up pb-12">
      {/* Clean Minimalist Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Panou Principal
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1.5">
          Prezentare generală a activității școlare, elevilor și indicatorilor financiari.
        </p>
      </div>

      {/* SECTION 1: Analitică Utilizatori & Elevi */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
            Analitică Utilizatori & Elevi
          </h2>
          {isSuperOrAdmin && (
            <Link
              href="/dashboard/users"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
            >
              Gestiune utilizatori <ChevronRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <MetricCard
            title="Total Utilizatori"
            value={loadingUsers ? "..." : users.length}
            icon={<UsersIcon className="w-6 h-6" />}
            href={isSuperOrAdmin ? "/dashboard/users" : undefined}
            footer={
              <>
                <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                <span>{activeUsersCount} conturi active în platformă</span>
              </>
            }
          />
          <MetricCard
            title="Studenți Înregistrați"
            value={loadingStudents ? "..." : students.length}
            icon={<StudentsIcon className="w-6 h-6" />}
            href={canManageStudents ? "/dashboard/students" : undefined}
            footer={
              <>
                <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                <span>{studentsWithCourses} înrolați pe cursuri active</span>
              </>
            }
          />
          <MetricCard
            title="Personal & Profesori"
            value={loadingUsers ? "..." : activeUsersCount}
            icon={<UserCheckIcon className="w-6 h-6" />}
            href={isSuperOrAdmin ? "/dashboard/users" : undefined}
            footer={
              <>
                <CheckCircleIcon className="w-4 h-4 text-slate-600" />
                <span>Acces securizat configurat</span>
              </>
            }
          />
        </div>
      </section>

      {/* SECTION 2: Activitate Academică & Orar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
            Activitate Academică & Orar
          </h2>
          {canManageStudents && (
            <Link
              href="/dashboard/schedule"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
            >
              Vezi orar complet <ChevronRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <MetricCard
            title="Cursuri & Programe"
            value={loadingCourses ? "..." : courses.length}
            icon={<BookOpenIcon className="w-6 h-6" />}
            href="/dashboard/courses"
            footer={
              <>
                <span className="font-semibold text-slate-900">Curriculum activ</span>
                <span>• Brio.md</span>
              </>
            }
          />
          <MetricCard
            title="Grupe de Studiu"
            value={loadingGroups ? "..." : groups.length}
            icon={<CalendarIcon className="w-6 h-6" />}
            href="/dashboard/schedule"
            footer={<span>Orar sincronizat pe săli</span>}
          />
          <MetricCard
            title="Rată Înrolare Cursuri"
            value={loadingStudents ? "..." : `${Math.round(((studentsWithCourses) / (students.length || 1)) * 100)}%`}
            icon={<SchoolIcon className="w-6 h-6" />}
            href="/dashboard/students"
            footer={<span>Grad înrolare elevi</span>}
          />
        </div>
      </section>

      {/* SECTION 3: Finanțe & Abonamente */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
            Finanțe & Abonamente
          </h2>
          {isBillingAllowed && (
            <Link
              href="/dashboard/invoices"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
            >
              Registru facturi <ChevronRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <MetricCard
            title="Încasări Confirmate"
            value={loadingKpi ? "..." : `${formatMdl(kpiSummary?.totalCollected || 0)} MDL`}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            href={isBillingAllowed ? "/dashboard/invoices?tab=paid" : undefined}
            footer={
              <>
                <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                <span>Venit total colectat din taxe</span>
              </>
            }
          />
          <MetricCard
            title="Facturat Total (Abonamente)"
            value={loadingKpi ? "..." : `${formatMdl(kpiSummary?.totalInvoiced || 0)} MDL`}
            icon={<BarChartIcon className="w-6 h-6" />}
            href={isBillingAllowed ? "/dashboard/invoices" : undefined}
            footer={
              <>
                <InvoiceIcon className="w-4 h-4 text-slate-500" />
                <span>Volum facturi generate</span>
              </>
            }
          />
          <MetricCard
            title="Restanțe Active (Datorii)"
            value={loadingKpi ? "..." : `${formatMdl(kpiSummary?.activeDebt || 0)} MDL`}
            icon={<AlertTriangleIcon className="w-6 h-6" />}
            href={isBillingAllowed ? "/dashboard/invoices?tab=overdue" : undefined}
            footer={
              <div className="w-full flex items-center justify-between">
                <span>{kpiSummary?.overdueCount || 0} facturi cu termen depășit</span>
                <span className="font-semibold text-slate-700">Detalii →</span>
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
}
