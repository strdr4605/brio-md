"use client";

import { usePathname } from "next/navigation";
import { MenuIcon, SchoolIcon, SparklesIcon, ChevronRightIcon } from "@/components/ui/icons";

type TopHeaderProps = {
  userName?: string;
  role?: string;
  schoolId?: number | null;
  onOpenMobileNav?: () => void;
};

const ROUTE_TITLES: Record<string, { title: string; section: string }> = {
  "/dashboard": { title: "Panou Principal", section: "Prezentare" },
  "/dashboard/users": { title: "Utilizatori", section: "Gestiune" },
  "/dashboard/students": { title: "Studenți", section: "Academic" },
  "/dashboard/permissions": { title: "Permisiuni", section: "Securitate" },
  "/dashboard/roller-door": { title: "Roletă Intrare", section: "Control Acces" },
  "/dashboard/settings": { title: "Setări Sistem", section: "Configurare" },
};

export function TopHeader({
  userName,
  role,
  schoolId,
  onOpenMobileNav,
}: TopHeaderProps) {
  const pathname = usePathname();
  const current = ROUTE_TITLES[pathname] || { title: "Portal", section: "Brio" };

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Deschide meniu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-medium">
          <span className="text-slate-400 font-normal hidden sm:inline">Brio Portal</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="text-slate-500">{current.section}</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold tracking-tight">{current.title}</span>
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* School badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600">
          <SchoolIcon className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium">
            {schoolId ? `Școala ID #${schoolId}` : "Toate Școlile"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Learning platform fast switcher */}
        <a
          href="http://localhost:3003"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 transition shadow-sm"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>Portal Cursuri</span>
          <span className="text-blue-400 font-mono">↗</span>
        </a>

        {/* User Mini Chip */}
        <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-white">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {userName || "Utilizator"}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {role || "Staff"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
