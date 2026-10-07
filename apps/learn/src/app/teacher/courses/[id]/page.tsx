import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { CourseRosterView } from "./CourseRosterView";

export default async function TeacherCourseRosterPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const isTeacher =
    session.user.role === "teacher" ||
    session.user.role === "admin" ||
    session.user.role === "superadmin" ||
    session.user.permissions?.includes("teach") ||
    session.user.permissions?.includes("admin") ||
    session.user.permissions?.includes("super");

  if (!isTeacher) {
    redirect("/courses");
  }

  const resolvedParams = await params;
  const courseId = parseInt(resolvedParams.id, 10);

  if (isNaN(courseId)) {
    redirect("/teacher");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="relative min-h-screen bg-[#fafafc] text-slate-900 pb-16 selection:bg-rose-500/10 selection:text-rose-600">
      {/* Meta / Instagram Ambient Mesh Glows (Fixed Background) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        {/* Instagram Aurora: Purple & Fuchsia Top-Left Glow */}
        <div className="absolute -top-44 -left-36 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-purple-500/12 via-fuchsia-500/10 to-transparent blur-[110px]" />

        {/* Sunset Coral & Amber Top-Right Glow */}
        <div className="absolute -top-32 right-[-10%] w-[580px] h-[580px] rounded-full bg-gradient-to-bl from-rose-500/10 via-orange-400/8 to-transparent blur-[120px]" />

        {/* Meta Tech / Emerald Mint Center Ambient Glow */}
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[760px] h-[480px] rounded-full bg-gradient-to-tr from-emerald-400/10 via-teal-300/8 to-indigo-400/8 blur-[140px]" />

        {/* Subtle Micro-Dot Texture Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-25 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_20%,#000_60%,transparent_100%)]" />

        {/* Top Vignette Sheen */}
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-white/70 via-transparent to-transparent" />
      </div>

      {/* Meta / Instagram Frosted Glass Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher"
              className="text-lg font-black tracking-tight text-slate-900 hover:text-slate-700 transition flex items-center gap-2.5"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                B
              </span>
              <span>Learning Portal</span>
            </Link>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Teacher Mode</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/teacher"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition"
            >
              ← All Courses
            </Link>
            {/* User chip with Instagram-style story ring avatar */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/70 shadow-2xs">
              <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-800">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">{session.user.name}</span>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-full transition cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <CourseRosterView courseId={courseId} />

      </main>

      {/* Semantic Footer (Best Practice 2026) */}
      <footer className="container mx-auto px-4 sm:px-6 max-w-6xl mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-500 font-medium">
          © 2026 Brio Learning Portal • Sincronizare automată activă
        </p>
        <Link
          href="https://in.brio.md"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition px-3.5 py-1.5 rounded-full hover:bg-white/90 border border-slate-200/70 shadow-2xs"
        >
          <span>Go to Staff Portal</span>
          <span>→</span>
        </Link>
      </footer>
    </div>
  );
}
