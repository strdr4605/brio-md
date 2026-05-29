"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/users", icon: "👥", label: "Utilizatori" },
  { href: "/dashboard/students", icon: "👨‍🎓", label: "Studenţi" },
  { href: "/dashboard/settings", icon: "⚙️", label: "Setări" },
];

export function Nav({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
                  isActive ? "text-blue-600" : "text-neutral-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-xs ${isActive ? "font-bold" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
          <div className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center">
            <span className="text-xl">🚪</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-neutral-500"
            >
              {userName ? userName.split(" ")[0] : ""}
            </button>
          </div>
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] flex-col bg-white border-r border-neutral-200 z-40">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-lg font-bold text-neutral-800">Portal Brio.md</h1>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-neutral-200">
          <div className="px-3 py-2 text-sm text-neutral-600 mb-1">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-neutral-600 hover:bg-neutral-100"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Deconectare</span>
          </button>
        </div>
      </aside>
    </>
  );
}
