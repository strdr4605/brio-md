"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, ChevronRightIcon } from "@/components/ui/icons";
import { GlobalSearch } from "./GlobalSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

type TopHeaderProps = {
  userName?: string;
  role?: string;
  permissions?: string[];
  schoolId?: number | null;
  onOpenMobileNavAction?: () => void;
};

const ROUTE_CONFIG: Record<
  string,
  {
    titleKey: string;
    sectionKey: string;
    sectionHref: string;
    fallbackTitle: string;
    fallbackSection: string;
  }
> = {
  "/dashboard": {
    titleKey: "nav.dashboard",
    sectionKey: "nav.overview",
    sectionHref: "/dashboard",
    fallbackTitle: "Panou Principal",
    fallbackSection: "Prezentare",
  },
  "/dashboard/users": {
    titleKey: "nav.users",
    sectionKey: "nav.management",
    sectionHref: "/dashboard/users",
    fallbackTitle: "Utilizatori",
    fallbackSection: "Gestiune",
  },
  "/dashboard/students": {
    titleKey: "nav.students",
    sectionKey: "nav.academicManagement",
    sectionHref: "/dashboard/students",
    fallbackTitle: "Studenți",
    fallbackSection: "Academic",
  },
  "/dashboard/courses": {
    titleKey: "nav.courses",
    sectionKey: "nav.academicManagement",
    sectionHref: "/dashboard/courses",
    fallbackTitle: "Cursuri",
    fallbackSection: "Academic",
  },
  "/dashboard/attendance": {
    titleKey: "nav.attendance",
    sectionKey: "nav.academicManagement",
    sectionHref: "/dashboard/attendance",
    fallbackTitle: "Prezență",
    fallbackSection: "Academic",
  },
  "/dashboard/attendance/overview": {
    titleKey: "nav.attendanceMatrix",
    sectionKey: "nav.academicManagement",
    sectionHref: "/dashboard/attendance/overview",
    fallbackTitle: "Matrice Prezență",
    fallbackSection: "Academic",
  },
  "/dashboard/schedule": {
    titleKey: "nav.schedule",
    sectionKey: "nav.academicManagement",
    sectionHref: "/dashboard/schedule",
    fallbackTitle: "Orar & Săli",
    fallbackSection: "Academic",
  },
  "/dashboard/invoices": {
    titleKey: "nav.invoicesRegistry",
    sectionKey: "nav.invoices",
    sectionHref: "/dashboard/invoices",
    fallbackTitle: "Registru Facturi",
    fallbackSection: "Facturare",
  },
  "/dashboard/invoices/statistics": {
    titleKey: "nav.financialStats",
    sectionKey: "nav.invoices",
    sectionHref: "/dashboard/invoices/statistics",
    fallbackTitle: "Statistici Financiare",
    fallbackSection: "Facturare",
  },
  "/dashboard/permissions": {
    titleKey: "nav.permissions",
    sectionKey: "nav.security",
    sectionHref: "/dashboard/permissions",
    fallbackTitle: "Permisiuni",
    fallbackSection: "Securitate",
  },
  "/dashboard/roller-door": {
    titleKey: "nav.rollerDoor",
    sectionKey: "nav.accessControl",
    sectionHref: "/dashboard/roller-door",
    fallbackTitle: "Roletă Intrare",
    fallbackSection: "Control Acces",
  },
  "/dashboard/settings": {
    titleKey: "nav.systemSettings",
    sectionKey: "nav.system",
    sectionHref: "/dashboard/settings",
    fallbackTitle: "Setări Sistem",
    fallbackSection: "Configurare",
  },
};

export function TopHeader({
  userName,
  role,
  permissions: _permissions = [],
  schoolId: _schoolId,
  onOpenMobileNavAction,
}: TopHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const currentConf = ROUTE_CONFIG[pathname];
  const currentTitle = currentConf ? t(currentConf.titleKey, currentConf.fallbackTitle) : "Portal";
  const currentSection = currentConf
    ? t(currentConf.sectionKey, currentConf.fallbackSection)
    : t("nav.overview", "Prezentare");
  const sectionHref = currentConf ? currentConf.sectionHref : "/dashboard";

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileNavAction}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 shrink-0"
          aria-label={t("nav.openMenu", "Deschide meniu")}
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Clickable Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium min-w-0"
        >
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-blue-600 font-normal hidden lg:inline transition-colors duration-150"
            title={t("nav.dashboard", "Acasă Dashboard")}
          >
            Brio Portal
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 hidden lg:inline" />

          <Link
            href={sectionHref}
            className="text-slate-500 hover:text-blue-600 transition-colors duration-150 hidden sm:inline truncate max-w-[120px]"
            title={currentSection}
          >
            {currentSection}
          </Link>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />

          <Link
            href={pathname}
            className="text-slate-900 font-semibold tracking-tight hover:text-blue-600 transition-colors duration-150 truncate max-w-[130px] sm:max-w-[220px] md:max-w-none"
          >
            {currentTitle}
          </Link>
        </nav>
      </div>

      {/* Global Student & Parent Search */}
      <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-1 sm:mx-4 flex justify-end md:justify-center">
        <GlobalSearch />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LanguageSwitcher />

        {/* User Mini Chip */}
        <Link
          href="/dashboard/settings"
          title={t("nav.accountSettings", "Setări cont")}
          className="flex items-center gap-2 pl-2 hover:opacity-80 transition group active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs ring-2 ring-slate-100 group-hover:scale-105 transition-transform">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
              {userName || t("nav.userFallback", "Utilizator")}
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
