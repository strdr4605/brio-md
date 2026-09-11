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
        <div className="h-36 bg-slate-200/70 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-200/70 rounded-2xl" />
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Welcome Banner with Motion Animation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0e14] via-[#141824] to-[#1c2234] text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 border border-slate-800/80">
        {/* Floating Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-56 h-56 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
        <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-glow-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] text-xs font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
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
            <Link
              href="/dashboard/settings"
              title="Setări școală"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs font-semibold transition hover:scale-105 active:scale-95"
            >
              <SchoolIcon className="w-4 h-4 text-blue-400" />
              <span>{currentSchool?.name || (isSuperAdmin ? "Superadmin Global" : "Campus Principal")}</span>
              <ChevronRightIcon className="w-3.5 h-3.5 text-blue-400/80" />
            </Link>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Luxury KPI Stat Cards with Hover Lift & Rotational Icon Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
          <Link href={isSuperOrAdmin ? "/dashboard/users" : "/dashboard"} className="block">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Total Utilizatori
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight group-hover:text-blue-600 transition-colors">
                  {isSuperOrAdmin ? (loadingUsers ? "..." : users.length) : "1"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>
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
            {isSuperOrAdmin ? (
              <Link
                href="/dashboard/users"
                className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group/link"
              >
                <span>Detalii</span>
                <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link href="/dashboard/settings" className="font-semibold text-blue-600 hover:underline">
                Setări
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
          <Link href={canManageStudents ? "/dashboard/students" : "/dashboard"} className="block">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Studenți Înregistrați
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight group-hover:text-emerald-600 transition-colors">
                  {canManageStudents ? (loadingStudents ? "..." : students.length) : "—"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <StudentsIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {canManageStudents ? (
                <>
                  <span className="font-semibold text-emerald-600">{studentsWithCourses}</span> înrolați
                </>
              ) : (
                "Acces restricționat"
              )}
            </span>
            {canManageStudents && (
              <Link
                href="/dashboard/students"
                className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group/link"
              >
                <span>Catalog</span>
                <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Courses & Programs with Working Links */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
          <Link href="/dashboard/students" className="block" title="Vezi studenții înrolați pe cursuri">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Cursuri & Programe
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight group-hover:text-purple-600 transition-colors">
                  {canManageStudents ? (loadingCourses ? "..." : courses.length) : "—"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BookOpenIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/students"
              className="text-slate-500 hover:text-purple-600 font-medium transition inline-flex items-center gap-0.5 group/cur"
            >
              <span>Curriculum</span>
              <ChevronRightIcon className="w-3 h-3 group-hover/cur:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="http://localhost:3003"
              target="_blank"
              rel="noopener noreferrer"
              title="Deschide aplicația Brio Learn"
              className="inline-flex items-center gap-1 font-bold text-purple-600 hover:text-purple-700 hover:underline transition group/learn"
            >
              <SparklesIcon className="w-3.5 h-3.5 group-hover/learn:rotate-12 transition-transform" />
              <span>Brio Learn</span>
              <span className="text-purple-400 font-mono text-[11px] group-hover/learn:translate-x-0.5 transition-transform">↗</span>
            </a>
          </div>
        </div>

        {/* Card 4: Roller Door / Security */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
          <Link href={canAccessDoor ? "/dashboard/roller-door" : "/dashboard"} className="block">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Acces Securitate
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight group-hover:text-amber-600 transition-colors">
                  {canAccessDoor ? "Activ" : "Standby"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <DoorIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hardware Tasmota</span>
            {canAccessDoor ? (
              <Link
                href="/dashboard/roller-door"
                className="font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 group/link"
              >
                <span>Control</span>
                <ChevronRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="text-slate-400">Fără acces</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel with Motion Feedback */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-600" />
          Acțiuni Rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canManageStudents && (
            <Link
              href="/dashboard/students?new=1"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-blue-500/50 hover:bg-blue-50/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0">
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
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-indigo-500/50 hover:bg-indigo-50/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0">
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
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-amber-500/50 hover:bg-amber-50/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0">
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
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/80 hover:border-purple-500/50 hover:bg-purple-50/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0">
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
            <Link
              href="/dashboard/settings"
              className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition active:scale-95"
            >
              {role || "Staff"} • Setări ↗
            </Link>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100/60 transition"
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

        {/* Security & System Info with Working Links */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Informații Sistem</h2>
            <p className="text-xs text-slate-500 mb-5">Stare platformă & securitate</p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Brio Portal</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> v2.4 Pro
                </span>
              </div>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition group"
              >
                <span className="text-slate-600 font-medium group-hover:text-slate-900">Izolare Multi-Tenant</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <span>Activă</span>
                  <ChevronRightIcon className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
              <Link
                href="/dashboard/roller-door"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition group"
              >
                <span className="text-slate-600 font-medium group-hover:text-slate-900">Hardware Roletă</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <span>Tasmota v12+</span>
                  <ChevronRightIcon className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
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
