"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, ChevronRightIcon } from "@/components/ui/icons";
import { GlobalSearch } from "./GlobalSearch";

type TopHeaderProps = {
  userName?: string;
  role?: string;
  schoolId?: number | null;
  onOpenMobileNavAction?: () => void;
};

const ROUTE_TITLES: Record<string, { title: string; section: string; sectionHref: string }> = {
  "/dashboard": { title: "Panou Principal", section: "Prezentare", sectionHref: "/dashboard" },
  "/dashboard/users": { title: "Utilizatori", section: "Gestiune", sectionHref: "/dashboard/users" },
  "/dashboard/students": { title: "Studenți", section: "Academic", sectionHref: "/dashboard/students" },
  "/dashboard/courses": { title: "Cursuri", section: "Academic", sectionHref: "/dashboard/courses" },
  "/dashboard/attendance": { title: "Prezență", section: "Academic", sectionHref: "/dashboard/attendance" },
  "/dashboard/attendance/overview": { title: "Matrice Prezență", section: "Academic", sectionHref: "/dashboard/attendance/overview" },
  "/dashboard/schedule": { title: "Orar & Săli", section: "Academic", sectionHref: "/dashboard/schedule" },
  "/dashboard/invoices": { title: "Registru Facturi", section: "Facturare", sectionHref: "/dashboard/invoices" },
  "/dashboard/invoices/statistics": { title: "Statistici Financiare", section: "Facturare", sectionHref: "/dashboard/invoices/statistics" },
  "/dashboard/permissions": { title: "Permisiuni", section: "Securitate", sectionHref: "/dashboard/permissions" },
  "/dashboard/keys": { title: "Securitate & Chei", section: "Securitate", sectionHref: "/dashboard/permissions" },
  "/dashboard/roller-door": { title: "Roletă Intrare", section: "Control Acces", sectionHref: "/dashboard/roller-door" },
  "/dashboard/settings": { title: "Setări Sistem", section: "Configurare", sectionHref: "/dashboard/settings" },
};

export function TopHeader({
  userName,
  role,
  schoolId: _schoolId,
  onOpenMobileNavAction,
}: TopHeaderProps) {
  const pathname = usePathname();
  const current = ROUTE_TITLES[pathname] || {
    title: "Portal",
    section: "Prezentare",
    sectionHref: "/dashboard",
  };

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileNavAction}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 shrink-0"
          aria-label="Deschide meniu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Clickable Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium min-w-0">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-blue-600 font-normal hidden lg:inline transition-colors duration-150"
            title="Acasă Dashboard"
          >
            Brio Portal
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 hidden lg:inline" />
          
          <Link
            href={current.sectionHref}
            className="text-slate-500 hover:text-blue-600 transition-colors duration-150 hidden sm:inline truncate max-w-[120px]"
            title={`Navighează la ${current.section}`}
          >
            {current.section}
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          
          <Link
            href={pathname}
            className="text-slate-900 font-semibold tracking-tight hover:text-blue-600 transition-colors duration-150 truncate max-w-[130px] sm:max-w-[220px] md:max-w-none"
          >
            {current.title}
          </Link>
        </nav>
      </div>

      {/* Global Student & Parent Search */}
      <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-1 sm:mx-4 flex justify-end md:justify-center">
        <GlobalSearch />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* User Mini Chip */}
        <Link
          href="/dashboard/settings"
          title="Setări cont"
          className="flex items-center gap-2 pl-2 hover:opacity-80 transition group active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs ring-2 ring-slate-100 group-hover:scale-105 transition-transform">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
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
