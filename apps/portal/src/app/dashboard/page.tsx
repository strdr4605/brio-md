"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  UsersIcon,
  StudentsIcon,
  BookOpenIcon,
  DoorIcon,
  ShieldCheckIcon,
  PlusIcon,
  SchoolIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";
  const canManageStudents = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";
  const canAccessDoor = permissions.includes("open-front-door") || isSuperOrAdmin;

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

  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: isSuperOrAdmin,
  });

  const currentSchool = schools.find((s) => s.id === session?.user?.schoolId);

  const todayStr = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (status === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200/70 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-200/70 rounded-2xl" />
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
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0e14] via-[#141824] to-[#1c2234] text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 border border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Operațional • Conexiune Securizată</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white capitalize">
              Bună ziua, {session?.user?.name || "Coleg"}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Bine ai venit în centrul de comandă Brio.md. Gestionează activitatea școlară,
              utilizatorii și infrastructura securizată dintr-un singur loc.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
              <SchoolIcon className="w-4 h-4 text-blue-400" />
              <span>{currentSchool?.name || (isSuperAdmin ? "Superadmin Global" : "Campus Principal")}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Luxury KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Total Utilizatori
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
                {isSuperOrAdmin ? (loadingUsers ? "..." : users.length) : "1"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {isSuperOrAdmin ? (
                <>
                  <span className="font-semibold text-emerald-600">{activeUsersCount}</span> activi
                </>
              ) : (
                "Profilul curent"
              )}
            </span>
            {isSuperOrAdmin && (
              <Link
                href="/dashboard/users"
                className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group/link"
              >
                Detalii <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Studenți Înregistrați
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
                {canManageStudents ? (loadingStudents ? "..." : students.length) : "—"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <StudentsIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {canManageStudents ? (
                <>
                  <span className="font-semibold text-emerald-600">{studentsWithCourses}</span> înrolați în cursuri
                </>
              ) : (
                "Acces restricționat"
              )}
            </span>
            {canManageStudents && (
              <Link
                href="/dashboard/students"
                className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 group/link"
              >
                Catalog <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Courses */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Cursuri & Programe
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
                {canManageStudents ? (loadingCourses ? "..." : courses.length) : "—"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <BookOpenIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Curriculum activ</span>
            <span className="inline-flex items-center gap-1 font-semibold text-purple-600">
              <SparklesIcon className="w-3.5 h-3.5" /> Brio Learn
            </span>
          </div>
        </div>

        {/* Card 4: Roller Door / Security */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Acces Securitate
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                {canAccessDoor ? "Activ" : "Standby"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <DoorIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Control Roletă Tasmota</span>
            {canAccessDoor ? (
              <Link
                href="/dashboard/roller-door"
                className="font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-0.5 group/link"
              >
                Control <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <span className="text-slate-400">Fără acces</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-600" />
          Acțiuni Rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canManageStudents && (
            <Link
              href="/dashboard/students"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-blue-500/50 hover:bg-blue-50/50 transition duration-150 group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <PlusIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Înregistrează Student
                </span>
                <span className="block text-xs text-slate-400">Adaugă în catalogul școlii</span>
              </div>
            </Link>
          )}

          {isSuperOrAdmin && (
            <Link
              href="/dashboard/users"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-indigo-500/50 hover:bg-indigo-50/50 transition duration-150 group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  Gestiune Utilizatori
                </span>
                <span className="block text-xs text-slate-400">Administrează conturi & roluri</span>
              </div>
            </Link>
          )}

          {canAccessDoor && (
            <Link
              href="/dashboard/roller-door"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-amber-500/50 hover:bg-amber-50/50 transition duration-150 group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <DoorIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition">
                  Deschide / Închide Roletă
                </span>
                <span className="block text-xs text-slate-400">Control fizic intrare</span>
              </div>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/dashboard/permissions"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-purple-500/50 hover:bg-purple-50/50 transition duration-150 group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 group-hover:text-purple-600 transition">
                  Matrice Permisiuni
                </span>
                <span className="block text-xs text-slate-400">Configurare drepturi avansate</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Account Profile & Security Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Profil Utilizator Curent</h2>
              <p className="text-xs text-slate-500">Informațiile sesiunii active și drepturile atribuite</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {role || "Staff"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nume Complet</span>
              <p className="text-base font-bold text-slate-800 mt-1">{session?.user?.name || "Nespecificat"}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adresă Email</span>
              <p className="text-base font-bold text-slate-800 mt-1 truncate">{session?.user?.email || "—"}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Școală / Tenant</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {currentSchool?.name || (session?.user?.schoolId ? `Școala #${session.user.schoolId}` : "Global")}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Utilizator</span>
              <p className="text-base font-bold text-slate-800 mt-1">#{session?.user?.id}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permisiuni Active</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {permissions.length > 0 ? (
                permissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80"
                  >
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-500" />
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Fără permisiuni explicite</span>
              )}
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Informații Sistem</h2>
            <p className="text-xs text-slate-500 mb-5">Stare platformă & securitate</p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Brio Portal</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> v2.4 Pro
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Izolare Multi-Tenant</span>
                <span className="font-bold text-blue-600">Activă</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Hardware Roletă</span>
                <span className="font-bold text-slate-700">Tasmota v12+</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Baza de Date</span>
                <span className="font-bold text-slate-700">PostgreSQL (Drizzle)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              © {new Date().getFullYear()} Brio.md Platformă Educațională Securizată
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
