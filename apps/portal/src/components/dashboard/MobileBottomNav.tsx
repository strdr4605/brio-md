"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  UsersIcon,
  StudentsIcon,
  DoorIcon,
  LogOutIcon,
} from "@/components/ui/icons";

export type MobileBottomNavProps = {
  canManageStudents: boolean;
  isSuperOrAdmin: boolean;
  canAccessDoor: boolean;
};

export function MobileBottomNav({
  canManageStudents,
  isSuperOrAdmin,
  canAccessDoor,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c0e14]/95 backdrop-blur-md border-t border-white/[0.1] md:hidden z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-around py-2 px-1">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 min-w-[52px] py-1 transition-all active:scale-95 ${
            isRouteActive("/dashboard") ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <DashboardIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Panou</span>
        </Link>

        {canManageStudents && (
          <Link
            href="/dashboard/students"
            className={`flex flex-col items-center gap-1 min-w-[52px] py-1 transition-all active:scale-95 ${
              isRouteActive("/dashboard/students") ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <StudentsIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Studenți</span>
          </Link>
        )}

        {isSuperOrAdmin && (
          <Link
            href="/dashboard/users"
            className={`flex flex-col items-center gap-1 min-w-[52px] py-1 transition-all active:scale-95 ${
              isRouteActive("/dashboard/users") ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Utilizatori</span>
          </Link>
        )}

        {canAccessDoor && (
          <Link
            href="/dashboard/roller-door"
            className={`flex flex-col items-center gap-1 min-w-[52px] py-1 transition-all active:scale-95 ${
              isRouteActive("/dashboard/roller-door") ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <DoorIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Roletă</span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-1 min-w-[52px] py-1 text-slate-400 hover:text-rose-400 transition-all active:scale-95"
          aria-label="Deconectare"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Ieșire</span>
        </button>
      </div>
    </nav>
  );
}
