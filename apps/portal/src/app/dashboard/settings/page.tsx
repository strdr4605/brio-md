"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  SettingsIcon,
  SchoolIcon,
  ShieldCheckIcon,
  DoorIcon,
  SparklesIcon,
  ChevronRightIcon,
  UsersIcon,
  StudentsIcon,
} from "@/components/ui/icons";

export default function SetariPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";
  const canAccessDoor = permissions.includes("open-front-door") || isSuperOrAdmin;

  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: isSuperOrAdmin,
  });

  const currentSchool = schools.find((s) => s.id === session?.user?.schoolId);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Setări Sistem & Cont</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Configurare
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vizualizează configurația tenant-ului, parametrii de rețea și statutul contului tău.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
        >
          <span>← Înapoi la Panou</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{session?.user?.name || "Utilizator"}</h2>
                <p className="text-xs text-slate-500">{session?.user?.email || "Fără adresă de email"}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {role || "Staff"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                    ID #{session?.user?.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold">Campus Școlar Asignat</span>
                <p className="font-bold text-slate-800 text-sm mt-1 flex items-center gap-1.5">
                  <SchoolIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{currentSchool?.name || (session?.user?.schoolId ? `Școala #${session.user.schoolId}` : "Toate Școlile (Global)")}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold">Nivel de Securitate</span>
                <p className="font-bold text-slate-800 text-sm mt-1">
                  {isSuperAdmin ? "Control Total Superadmin" : isSuperOrAdmin ? "Administrator Școală" : "Profesor / Personal"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Permisiuni Active Asignate
              </span>
              <div className="flex flex-wrap gap-2">
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
                  <span className="text-xs text-slate-400 italic">Fără permisiuni specifice</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Links */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              Scurtături Rapide de Navigare
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/students"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition group active:scale-95"
              >
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  <StudentsIcon className="w-4 h-4 text-emerald-600" />
                  <span>Catalog Studenți</span>
                </div>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {isSuperOrAdmin && (
                <Link
                  href="/dashboard/users"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition group active:scale-95"
                >
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 group-hover:text-blue-700">
                    <UsersIcon className="w-4 h-4 text-blue-600" />
                    <span>Gestiune Utilizatori</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {canAccessDoor && (
                <Link
                  href="/dashboard/roller-door"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition group active:scale-95"
                >
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 group-hover:text-amber-700">
                    <DoorIcon className="w-4 h-4 text-amber-600" />
                    <span>Roletă Intrare</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Platform Environment & Architecture */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Arhitectură & Infrastructură</h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Brio Portal</span>
                <span className="font-bold text-emerald-600">v2.4 Pro Production</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Brio Learn LMS</span>
                <a
                  href="http://localhost:3003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <SparklesIcon className="w-3 h-3" />
                  <span>Port 3003 ↗</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Hardware IoT</span>
                <span className="font-bold text-slate-700">Tasmota Wi-Fi Relay</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Izolare Multi-Tenant</span>
                <span className="font-bold text-emerald-600">Strict Enforced</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Toate conexiunile sunt protejate prin JWT criptat și protocoale securizate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
