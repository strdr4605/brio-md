import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { TeacherNavbar } from "@/components/layout/TeacherNavbar";
import { TeacherCourseView } from "./TeacherCourseView";

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
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Design System Compliant Teacher Header */}
      <TeacherNavbar
        userName={session.user.name}
        activeTab="courses"
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <TeacherCourseView courseId={courseId} />
      </main>

      {/* Semantic Footer (Monochrome Slate Design System) */}
      <footer className="container mx-auto px-4 sm:px-6 max-w-6xl mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-500 font-medium">
          © 2026 Brio Learning Portal • Sincronizare automată activă
        </p>
        <Link
          href="https://in.brio.md"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3.5 py-1.5 rounded-full hover:bg-white/90 border border-slate-200/70 shadow-2xs"
        >
          <span>Portal Staff</span>
          <span>→</span>
        </Link>
      </footer>
    </div>
  );
}
