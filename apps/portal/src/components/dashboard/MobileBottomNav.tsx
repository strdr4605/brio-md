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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c0e14]/95 backdrop-blur-md border-t border-white/[0.1] md:hidden z-40">
      <div className="flex justify-around py-2.5 px-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 min-w-[48px] py-1 ${
            isRouteActive("/dashboard") ? "text-blue-400 font-bold" : "text-slate-400"
          }`}
        >
          <DashboardIcon className="w-5 h-5" />
          <span className="text-[10px]">Panou</span>
        </Link>

        {canManageStudents && (
          <Link
            href="/dashboard/students"
            className={`flex flex-col items-center gap-1 min-w-[48px] py-1 ${
              isRouteActive("/dashboard/students") ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <StudentsIcon className="w-5 h-5" />
            <span className="text-[10px]">Studenți</span>
          </Link>
        )}

        {isSuperOrAdmin && (
          <Link
            href="/dashboard/users"
            className={`flex flex-col items-center gap-1 min-w-[48px] py-1 ${
              isRouteActive("/dashboard/users") ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="text-[10px]">Utilizatori</span>
          </Link>
        )}

        {canAccessDoor && (
          <Link
            href="/dashboard/roller-door"
            className={`flex flex-col items-center gap-1 min-w-[48px] py-1 ${
              isRouteActive("/dashboard/roller-door") ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <DoorIcon className="w-5 h-5" />
            <span className="text-[10px]">Roletă</span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-slate-400 hover:text-rose-400"
          aria-label="Deconectare"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="text-[10px]">Ieșire</span>
        </button>
      </div>
    </nav>
  );
}
