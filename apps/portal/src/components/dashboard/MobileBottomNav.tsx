"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  UserCheckIcon,
  StudentsIcon,
  InvoiceIcon,
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  MenuIcon,
} from "@/components/ui/icons";
import { useTranslation } from "@/lib/i18n";

export type MobileBottomNavProps = {
  canManageStudents: boolean;
  isSuperOrAdmin: boolean;
  canAccessDoor?: boolean;
  isBillingAllowed?: boolean;
  overdueCount?: number;
  onOpenMobile?: () => void;
};

export function MobileBottomNav({
  canManageStudents,
  isSuperOrAdmin,
  canAccessDoor: _canAccessDoor,
  isBillingAllowed = false,
  overdueCount = 0,
  onOpenMobile,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { locale, t } = useTranslation();

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/invoices") return pathname === "/dashboard/invoices";
    return pathname.startsWith(href);
  };

  const labels = {
    attendance: locale === "ru" ? "Посещ." : locale === "en" ? "Attend." : "Prezență",
    schedule: locale === "ru" ? "Расписание" : locale === "en" ? "Schedule" : "Orar",
    dashboard: locale === "ru" ? "Панель" : locale === "en" ? "Home" : "Panou",
    menu: locale === "ru" ? "Меню" : locale === "en" ? "Menu" : "Meniu",
    students: locale === "ru" ? "Ученики" : locale === "en" ? "Students" : "Studenți",
    courses: locale === "ru" ? "Курсы" : locale === "en" ? "Courses" : "Cursuri",
    invoices: locale === "ru" ? "Счета" : locale === "en" ? "Billing" : "Facturi",
    users: locale === "ru" ? "Аккаунты" : locale === "en" ? "Users" : "Utilizatori",
  };

  // Determine contextual destination (Facturi if billing allowed, or Utilizatori/Panou)
  const fourthItem = isBillingAllowed
    ? {
        href: "/dashboard/invoices",
        label: labels.invoices,
        Icon: InvoiceIcon,
        badge: overdueCount > 0 ? overdueCount : undefined,
      }
    : isSuperOrAdmin
      ? {
          href: "/dashboard/users",
          label: labels.users,
          Icon: UsersIcon,
          badge: undefined,
        }
      : {
          href: "/dashboard",
          label: labels.dashboard,
          Icon: DashboardIcon,
          badge: undefined,
        };

  return (
    <nav
      aria-label="Navigare rapidă mobil"
      className="fixed bottom-0 left-0 right-0 bg-[#0c0e14]/95 backdrop-blur-xl border-t border-white/[0.08] md:hidden z-40 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="grid grid-cols-5 items-center px-1.5 max-w-md mx-auto relative">
        {/* Tab 1: Prezență */}
        {canManageStudents ? (
          <Link
            href="/dashboard/attendance"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard/attendance")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheckIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.attendance}
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard/schedule"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard/schedule")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.schedule}
            </span>
          </Link>
        )}

        {/* Tab 2: Orar */}
        {canManageStudents ? (
          <Link
            href="/dashboard/schedule"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard/schedule")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.schedule}
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <DashboardIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.dashboard}
            </span>
          </Link>
        )}

        {/* Tab 3: CENTER HERO FAB — Super Sleek Radial Menu Opener */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex flex-col items-center justify-center -mt-3.5 group transition-transform active:scale-90 cursor-pointer min-w-0"
          aria-label={t("nav.openMenu", "Deschide meniul rapid")}
        >
          <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-900 border border-white/80 shadow-md shadow-white/10 ring-4 ring-[#0c0e14] flex items-center justify-center group-hover:scale-105 group-hover:shadow-white/20 transition-all">
            <MenuIcon className="w-4 h-4 text-slate-900 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white tracking-tight leading-none mt-1 truncate max-w-full">
            {labels.menu}
          </span>
        </button>

        {/* Tab 4: Studenți */}
        {canManageStudents ? (
          <Link
            href="/dashboard/students"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard/students")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <StudentsIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.students}
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard/courses"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
              isRouteActive("/dashboard/courses")
                ? "text-white font-bold bg-white/[0.08] shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpenIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {labels.courses}
            </span>
          </Link>
        )}

        {/* Tab 5: Contextual (Facturi / Panou / Utilizatori) */}
        <Link
          href={fourthItem.href}
          className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 min-w-0 ${
            isRouteActive(fourthItem.href)
              ? "text-white font-bold bg-white/[0.08] shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <fourthItem.Icon className="w-5 h-5 shrink-0" />
          {fourthItem.badge !== undefined && fourthItem.badge > 0 && (
            <span
              data-testid="mobile-bottom-badge"
              className="absolute top-1 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0c0e14]"
            >
              {fourthItem.badge > 99 ? "99+" : fourthItem.badge}
            </span>
          )}
          <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
            {fourthItem.label}
          </span>
        </Link>
      </div>
    </nav>
  );
}
