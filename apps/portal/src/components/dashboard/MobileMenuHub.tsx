"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DashboardIcon,
  BookOpenIcon,
  UsersIcon,
  DoorIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
  ShieldCheckIcon,
  KeyIcon,
  InvoiceIcon,
} from "@/components/ui/icons";

export type MobileMenuHubProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  role?: string;
  permissions?: string[];
  isSuperOrAdmin?: boolean;
  canAccessDoor?: boolean;
  isBillingAllowed?: boolean;
};

export function MobileMenuHub({
  isOpen,
  onClose,
  userName = "Utilizator",
  role = "user",
  permissions: _permissions = [],
  isSuperOrAdmin = false,
  canAccessDoor = false,
  isBillingAllowed = false,
}: MobileMenuHubProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const roleLabel =
    role === "superadmin"
      ? "Super Administrator"
      : role === "admin"
        ? "Administrator Școală"
        : role === "teacher"
          ? "Profesor / Instructor"
          : "Membru Brio";

  const userInitial = (userName?.[0] || "U").toUpperCase();

  // Define hub action items based on permissions
  const hubActions = [
    {
      href: "/dashboard",
      label: "Panou Principal",
      description: "Statistici & rezumat",
      Icon: DashboardIcon,
      visible: true,
    },
    {
      href: "/dashboard/courses",
      label: "Cursuri & Grupe",
      description: "Gestionare academică",
      Icon: BookOpenIcon,
      visible: true,
    },
    {
      href: "/dashboard/invoices",
      label: "Facturare",
      description: "Registru & plăți",
      Icon: InvoiceIcon,
      visible: isBillingAllowed,
    },
    {
      href: "/dashboard/users",
      label: "Utilizatori",
      description: "Profesori & conturi",
      Icon: UsersIcon,
      visible: isSuperOrAdmin,
    },
    {
      href: "/dashboard/keys",
      label: "Securitate & Chei",
      description: "Chei RFID & acces",
      Icon: KeyIcon,
      visible: isSuperOrAdmin,
    },
    {
      href: "/dashboard/roller-door",
      label: "Roletă Garaj",
      description: "Control acces intrare",
      Icon: DoorIcon,
      visible: canAccessDoor,
    },
    {
      href: "/dashboard/invoices/statistics",
      label: "Statistici Financiare",
      description: "Încasări & restanțe",
      Icon: BarChartIcon,
      visible: isBillingAllowed,
    },
    {
      href: "/dashboard/settings",
      label: "Setări Sistem",
      description: "Preferințe & școală",
      Icon: SettingsIcon,
      visible: isSuperOrAdmin,
    },
  ].filter((a) => a.visible);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Meniu principal mobil"
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Hub Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5 pb-6 pt-4 flex flex-col items-center animate-fade-in-up">
        {/* User Profile Pill */}
        <div className="w-full bg-white/[0.07] border border-white/[0.12] backdrop-blur-2xl rounded-2xl p-3.5 mb-6 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/20 text-white font-black text-base flex items-center justify-center shadow-inner shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white truncate leading-tight">
                {userName}
              </h4>
              <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{roleLabel}</span>
              </p>
            </div>
          </div>

          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/[0.08] transition active:scale-95 cursor-pointer shrink-0"
            title="Deconectare"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Action Hub Circular Grid */}
        <div className="w-full grid grid-cols-3 gap-3 max-h-[58vh] overflow-y-auto px-1 py-1 mb-5 scrollbar-none">
          {hubActions.map((action) => {
            const isActive =
              action.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(action.href);

            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 group transition active:scale-95 cursor-pointer"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-950 shadow-lg shadow-white/10 ring-2 ring-white/50 scale-105"
                      : "bg-white/[0.08] group-hover:bg-white/[0.14] text-white border border-white/[0.12] backdrop-blur-xl shadow-md group-hover:scale-105"
                  }`}
                >
                  <action.Icon className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-center">
                  <span
                    className={`block text-[11px] font-bold tracking-tight leading-tight line-clamp-1 ${
                      isActive ? "text-white font-black" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {action.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Center Close Circular Button (Matching Reference Arc FAB) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide meniul"
            className="w-14 h-14 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all cursor-pointer ring-4 ring-black/40"
          >
            <XIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
            Închide
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
