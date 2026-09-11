"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, SchoolIcon, SparklesIcon, ChevronRightIcon } from "@/components/ui/icons";

type TopHeaderProps = {
  userName?: string;
  role?: string;
  schoolId?: number | null;
  onOpenMobileNav?: () => void;
};

const ROUTE_TITLES: Record<string, { title: string; section: string; sectionHref: string }> = {
  "/dashboard": { title: "Panou Principal", section: "Prezentare", sectionHref: "/dashboard" },
  "/dashboard/users": { title: "Utilizatori", section: "Gestiune", sectionHref: "/dashboard/users" },
  "/dashboard/students": { title: "Studenți", section: "Academic", sectionHref: "/dashboard/students" },
  "/dashboard/courses": { title: "Cursuri", section: "Academic", sectionHref: "/dashboard/courses" },
  "/dashboard/permissions": { title: "Permisiuni", section: "Securitate", sectionHref: "/dashboard/permissions" },
  "/dashboard/roller-door": { title: "Roletă Intrare", section: "Control Acces", sectionHref: "/dashboard/roller-door" },
  "/dashboard/settings": { title: "Setări Sistem", section: "Configurare", sectionHref: "/dashboard/settings" },
};

export function TopHeader({
  userName,
  role,
  schoolId,
  onOpenMobileNav,
}: TopHeaderProps) {
  const pathname = usePathname();
  const current = ROUTE_TITLES[pathname] || {
    title: "Portal",
    section: "Prezentare",
    sectionHref: "/dashboard",
  };

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
          aria-label="Deschide meniu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Clickable Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-medium">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-blue-600 font-normal hidden sm:inline transition-colors duration-150"
            title="Acasă Dashboard"
          >
            Brio Portal
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          
          <Link
            href={current.sectionHref}
            className="text-slate-500 hover:text-blue-600 transition-colors duration-150"
            title={`Navighează la ${current.section}`}
          >
            {current.section}
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
          
          <Link
            href={pathname}
            className="text-slate-900 font-semibold tracking-tight hover:text-blue-600 transition-colors duration-150"
          >
            {current.title}
          </Link>
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* School badge */}
        <Link
          href="/dashboard/settings"
          title="Vezi detalii școală și setări"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs text-slate-600 transition group hover:scale-[1.02] active:scale-[0.98]"
        >
          <SchoolIcon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="font-medium group-hover:text-slate-900 transition-colors">
            {schoolId ? `Școala ID #${schoolId}` : "Toate Școlile"}
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </Link>

        {/* Learning platform fast switcher */}
        <a
          href="http://localhost:3003"
          target="_blank"
          rel="noopener noreferrer"
          title="Deschide platforma Brio Learn într-o filă nouă"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/60 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] group"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-12 transition-transform" />
          <span>Portal Cursuri</span>
          <span className="text-blue-400 font-mono group-hover:translate-x-0.5 transition-transform">↗</span>
        </a>

        {/* User Mini Chip */}
        <Link
          href="/dashboard/settings"
          title="Setări cont"
          className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200/80 hover:opacity-80 transition group active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-white group-hover:scale-105 transition-transform">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
              {userName || "Utilizator"}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {role || "Staff"}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
