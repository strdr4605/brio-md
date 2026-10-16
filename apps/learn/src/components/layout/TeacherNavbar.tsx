import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon } from "@brio-md/ui";

type Props = {
  userName?: string | null;
  activeTab?: "courses" | "resources";
  onSignOut: () => Promise<void>;
};

export function TeacherNavbar({ userName, activeTab, onSignOut }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 max-w-7xl">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/teacher" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              B
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-slate-700 transition">
                Learning Portal
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider hidden sm:inline-block">
                Profesor
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Navigare profesor" className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-5">
            <Link
              href="/teacher"
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                activeTab === "courses"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Cursurile Mele
            </Link>
            <Link
              href="/teacher/resources"
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                activeTab === "resources"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Biblioteca de Resurse
            </Link>
          </nav>
        </div>

        {/* Right Controls: Staff Portal, User Chip, Sign Out */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="https://in.brio.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-2.5 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"
          >
            <span>Portal Staff</span>
            <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs ring-2 ring-slate-100">
              {userName ? userName.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {userName || "Profesor"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Cadru Didactic
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <form action={onSignOut}>
            <button
              type="submit"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer flex items-center gap-1.5"
              title="Deconectare"
            >
              <span>Ieșire</span>
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <nav
        aria-label="Navigare mobilă profesor"
        className="flex md:hidden items-center gap-1.5 px-4 py-2 bg-slate-50/90 border-t border-slate-200/80 overflow-x-auto"
      >
        <Link
          href="/teacher"
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === "courses"
              ? "bg-white text-slate-900 font-bold shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Cursurile Mele
        </Link>
        <Link
          href="/teacher/resources"
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === "resources"
              ? "bg-white text-slate-900 font-bold shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Biblioteca de Resurse
        </Link>
      </nav>
    </header>
  );
}
