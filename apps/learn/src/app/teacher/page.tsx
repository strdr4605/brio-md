import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { TeacherNavbar } from "@/components/layout/TeacherNavbar";
import { TeacherDashboard } from "./TeacherDashboard";

export default async function TeacherPage() {
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

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Design System Compliant Teacher Header */}
      <TeacherNavbar
        userName={session.user.name}
        activeTab="courses"
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <TeacherDashboard />

        {/* Staff Portal Link */}
        <div className="mt-12 text-center">
          <Link href="https://in.brio.md" className="text-sm text-slate-500 hover:text-slate-800 transition font-medium">
            Portal Staff →
          </Link>
        </div>
      </main>
    </div>
  );
}
