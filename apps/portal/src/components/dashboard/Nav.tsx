"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  DashboardIcon,
  UsersIcon,
  StudentsIcon,
  KeyIcon,
  DoorIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  XIcon,
} from "@/components/ui/icons";
import { MobileBottomNav } from "./MobileBottomNav";

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
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";
  const canManageStudents = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";
  const canAccessDoor = permissions.includes("open-front-door") || isSuperOrAdmin;

  // Smart Accordions
  const [academicOpen, setAcademicOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition">
            B
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">
                Brio<span className="text-blue-500">.md</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                Portal Management
              </span>
            </div>
          )}
        </Link>

        {/* Rail Collapse button for Desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          title={isCollapsed ? "Extinde meniul" : "Restrânge meniul"}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>

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
      <nav className="flex-1 px-2.5 py-4 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {/* Principal / Overview */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Prezentare
            </div>
          )}
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
              isRouteActive("/dashboard")
                ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
            title="Panou Principal"
          >
            <DashboardIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard") ? "text-blue-400" : ""}`} />
            {!isCollapsed && <span className="text-sm font-medium">Panou Principal</span>}
          </Link>
        </div>

        {/* Group: Gestiune Academică (Smart Accordion) */}
        {(isSuperOrAdmin || canManageStudents) && (
          <div>
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setAcademicOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition group"
              >
                <span>Gestiune Academică</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    academicOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}

            {(academicOpen || isCollapsed) && (
              <div className="space-y-1 mt-0.5">
                {isSuperOrAdmin && (
                  <Link
                    href="/dashboard/users"
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isRouteActive("/dashboard/users")
                        ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                    title="Utilizatori"
                  >
                    <UsersIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard/users") ? "text-blue-400" : ""}`} />
                    {!isCollapsed && <span className="text-sm">Utilizatori</span>}
                  </Link>
                )}

                {canManageStudents && (
                  <Link
                    href="/dashboard/students"
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isRouteActive("/dashboard/students")
                        ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                    title="Studenți"
                  >
                    <StudentsIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard/students") ? "text-blue-400" : ""}`} />
                    {!isCollapsed && <span className="text-sm">Studenți</span>}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group: Securitate & Control (Smart Accordion) */}
        {(canAccessDoor || isSuperAdmin) && (
          <div>
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setSecurityOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition group"
              >
                <span>Control & Acces</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    securityOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}

            {(securityOpen || isCollapsed) && (
              <div className="space-y-1 mt-0.5">
                {canAccessDoor && (
                  <Link
                    href="/dashboard/roller-door"
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isRouteActive("/dashboard/roller-door")
                        ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                    title="Roletă Intrare"
                  >
                    <DoorIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard/roller-door") ? "text-blue-400" : ""}`} />
                    {!isCollapsed && <span className="text-sm">Roletă Intrare</span>}
                  </Link>
                )}

                {isSuperAdmin && (
                  <Link
                    href="/dashboard/permissions"
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isRouteActive("/dashboard/permissions")
                        ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                    title="Permisiuni"
                  >
                    <KeyIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard/permissions") ? "text-blue-400" : ""}`} />
                    {!isCollapsed && <span className="text-sm">Permisiuni</span>}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group: Sistem */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Sistem
            </div>
          )}
          <Link
            href="/dashboard/settings"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isRouteActive("/dashboard/settings")
                ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white font-semibold border-l-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
            title="Setări"
          >
            <SettingsIcon className={`w-5 h-5 shrink-0 ${isRouteActive("/dashboard/settings") ? "text-blue-400" : ""}`} />
            {!isCollapsed && <span className="text-sm">Setări</span>}
          </Link>
        </div>
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-black/20">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-white/10">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {userName || "Utilizator"}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">
                  {role || "Staff"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
            title="Deconectare"
            aria-label="Deconectare"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 bg-[#0c0e14] border-r border-white/[0.08] z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[280px] max-w-[85vw] bg-[#0c0e14] h-full shadow-2xl z-10 border-r border-white/[0.1]">
            {navContent}
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
