import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { TeacherNavbar } from "@/components/layout/TeacherNavbar";
import { TeacherResourcesView } from "./TeacherResourcesView";

export default async function TeacherResourcesPage() {
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
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Design System Compliant Teacher Header */}
      <TeacherNavbar
        userName={session.user.name}
        activeTab="resources"
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 h-64"
                />
              ))}
            </div>
          }
        >
          <TeacherResourcesView />
        </Suspense>

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
