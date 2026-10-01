"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  DashboardIcon, UsersIcon, StudentsIcon, BookOpenIcon, CalendarIcon,
  KeyIcon, DoorIcon, SettingsIcon, ChevronDownIcon, ChevronLeftIcon,
  ChevronRightIcon, LogOutIcon, XIcon, UserCheckIcon, BarChartIcon, InvoiceIcon,
} from "@/components/ui/icons";
import { MobileBottomNav } from "./MobileBottomNav";
import { trpc } from "@/lib/trpc";

export type NavProps = {
  userName?: string;
  permissions?: string[];
  role?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Nav({
  userName,
  permissions = [],
  role,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: NavProps) {
  const pathname = usePathname();
  const isSuperAdmin = permissions?.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions?.includes("admin") || role === "admin";
  const isBillingAllowed = permissions?.includes("manage_billing") || isSuperOrAdmin;
  const canManageStudents = isSuperOrAdmin || permissions?.includes("teach") || role === "teacher";
  const canAccessDoor = permissions?.includes("open-front-door") || isSuperOrAdmin;

  const { data: overdueCount = 0 } = trpc.billing.getOverdueCount.useQuery(
    undefined,
    { enabled: isBillingAllowed, staleTime: 60_000 },
  );

  const [academicOpen, setAcademicOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/invoices") return pathname === "/dashboard/invoices";
    return pathname.startsWith(href);
  };

  const renderNavLink = (
    href: string,
    label: string,
    IconComponent: React.ComponentType<{ className?: string }>,
    badgeCount?: number,
    collapsed: boolean = false,
  ) => {
    const active = isRouteActive(href);

    if (collapsed) {
      return (
        <Link
          href={href}
          onClick={onCloseMobile}
          className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 group relative ${
            active
              ? "bg-white/10 text-white border border-white/20 shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]"
          }`}
          title={label}
        >
          <IconComponent
            className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${active ? "text-white" : ""}`}
          />
          {Boolean(badgeCount && badgeCount > 0) && (
            <span
              data-testid="overdue-badge-collapsed"
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0c0e14]"
            />
          )}
        </Link>
      );
    }

    return (
      <Link
        href={href}
        onClick={onCloseMobile}
        className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
          active
            ? "bg-white/10 text-white font-semibold border-l-2 border-white shadow-xs"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
        }`}
        title={label}
      >
        <IconComponent
          className={`w-6 h-6 shrink-0 ${active ? "text-white" : "text-slate-400"}`}
        />
        <span className="text-[15px] font-semibold flex-1 truncate">{label}</span>
        {Boolean(badgeCount && badgeCount > 0) && (
          <span
            data-testid="overdue-badge"
            className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0"
          >
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  const renderNavContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full select-none w-full overflow-hidden">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-white/[0.08] shrink-0 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-11 h-11 rounded-xl bg-slate-800 text-white font-extrabold text-base flex items-center justify-center hover:bg-slate-700 transition group shadow-xs"
            title="Extinde meniul"
            aria-label="Extinde meniul"
          >
            <ChevronRightIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group min-w-0"
              title="Acasă Dashboard"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-extrabold text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                B
              </div>
              <div className="flex flex-col">
                <span className="text-white font-extrabold text-lg tracking-tight leading-none">
                  Brio<span className="text-blue-500">.md</span>
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mt-1">
                  Portal Management
                </span>
              </div>
            </Link>

            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              title="Restrânge meniul"
              aria-label="Restrânge meniul"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
          aria-label="Închide meniul"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 py-4 space-y-3.5 overflow-y-auto overflow-x-hidden scrollbar-thin ${collapsed ? "px-2" : "px-3"}`}>
        {/* Principal / Overview */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3.5 pb-1 text-xs font-extrabold tracking-wider uppercase text-slate-400">
              Prezentare
            </div>
          )}
          {renderNavLink("/dashboard", "Panou Principal", DashboardIcon, undefined, collapsed)}
        </div>

        {/* Group: Gestiune Academică */}
        {(isSuperOrAdmin || canManageStudents) && (
          <div className="space-y-1">
            {collapsed ? (
              <div className="border-t border-white/[0.08] my-2 mx-1" />
            ) : (
              <button
                type="button"
                onClick={() => setAcademicOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 pb-1 text-xs font-extrabold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition group"
              >
                <span>Gestiune Academică</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    academicOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}

            {(academicOpen || collapsed) && (
              <div className="space-y-1">
                {canManageStudents && renderNavLink("/dashboard/attendance", "Prezență", UserCheckIcon, undefined, collapsed)}
                {renderNavLink("/dashboard/schedule", "Orar & Săli", CalendarIcon, undefined, collapsed)}
                {canManageStudents && renderNavLink("/dashboard/students", "Studenți", StudentsIcon, undefined, collapsed)}
                {isSuperOrAdmin && renderNavLink("/dashboard/courses", "Cursuri", BookOpenIcon, undefined, collapsed)}
                {isBillingAllowed && renderNavLink("/dashboard/invoices", "Facturare", InvoiceIcon, overdueCount, collapsed)}
                {isSuperOrAdmin && renderNavLink("/dashboard/invoices/statistics", "Statistici Financiare", BarChartIcon, undefined, collapsed)}
                {isSuperOrAdmin && renderNavLink("/dashboard/users", "Utilizatori", UsersIcon, undefined, collapsed)}
              </div>
            )}
          </div>
        )}

        {/* Group: Securitate & Control */}
        {(canAccessDoor || isSuperAdmin) && (
          <div className="space-y-1">
            {collapsed ? (
              <div className="border-t border-white/[0.08] my-2 mx-1" />
            ) : (
              <button
                type="button"
                onClick={() => setSecurityOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 pb-1 text-xs font-extrabold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition group"
              >
                <span>Control & Acces</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    securityOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}

            {(securityOpen || collapsed) && (
              <div className="space-y-1">
                {canAccessDoor && renderNavLink("/dashboard/roller-door", "Roletă Intrare", DoorIcon, undefined, collapsed)}
                {isSuperAdmin && renderNavLink("/dashboard/permissions", "Permisiuni", KeyIcon, undefined, collapsed)}
              </div>
            )}
          </div>
        )}

        {/* Group: Sistem */}
        <div className="space-y-1">
          {collapsed ? (
            <div className="border-t border-white/[0.08] my-2 mx-1" />
          ) : (
            <div className="px-3.5 pb-1 text-xs font-extrabold tracking-wider uppercase text-slate-400">
              Sistem
            </div>
          )}
          {renderNavLink("/dashboard/settings", "Setări", SettingsIcon, undefined, collapsed)}
        </div>
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className={`border-t border-white/[0.08] bg-black/30 shrink-0 ${collapsed ? "p-2.5" : "p-3.5"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center ring-1 ring-white/10 hover:scale-105 transition"
              title={`Profil: ${userName || "Utilizator"}`}
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition active:scale-95"
              title="Deconectare"
              aria-label="Deconectare"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 min-w-0 group"
              title="Setări cont"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0 ring-1 ring-white/20 group-hover:scale-105 transition">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-100 truncate leading-tight group-hover:text-blue-400 transition-colors">
                  {userName || "Utilizator"}
                </span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider truncate mt-0.5">
                  {role || "Staff"}
                </span>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0 active:scale-95"
              title="Deconectare"
              aria-label="Deconectare"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 bg-[#0c0e14] border-r border-white/[0.08] z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? "w-[72px]" : "w-[270px]"
        }`}
      >
        {renderNavContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[280px] max-w-[85vw] bg-[#0c0e14] h-full shadow-2xl z-10 border-r border-white/[0.1] overflow-hidden">
            {renderNavContent(false)}
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick-Action Bar */}
      <MobileBottomNav
        canManageStudents={canManageStudents}
        isSuperOrAdmin={isSuperOrAdmin}
        canAccessDoor={canAccessDoor}
      />
    </>
  );
}