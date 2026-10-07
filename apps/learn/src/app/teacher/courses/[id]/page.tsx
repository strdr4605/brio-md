import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { TeacherNavbar } from "@/components/layout/TeacherNavbar";
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
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Design System Compliant Teacher Header */}
      <TeacherNavbar
        userName={session.user.name}
        activeTab="courses"
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <CourseRosterView courseId={courseId} />

        {/* Staff Portal Link */}
        <div className="mt-12 text-center">
          <Link href="https://in.brio.md" className="text-sm text-emerald-700 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}
