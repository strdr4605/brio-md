import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
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
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header with Teacher Mode branding */}
      <header className="bg-emerald-700 text-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/teacher" className="text-xl font-bold tracking-tight hover:opacity-95">
              Learning Portal
            </Link>
            <span className="bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>👨‍🏫</span> Teacher Mode
            </span>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <span className="text-emerald-100/90 font-medium">{session.user.name}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-emerald-100 hover:text-white underline cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <TeacherDashboard />

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
