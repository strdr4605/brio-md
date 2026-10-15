import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { CourseList } from "./CourseList";
import { StudentNavbar } from "@/components/layout/StudentNavbar";

export default async function CoursesPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    redirect("/");
  }

  if (!session?.user || session.user.expired) {
    redirect("/");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const isTeacher =
    session.user.role === "teacher" ||
    session.user.role === "admin" ||
    session.user.role === "superadmin" ||
    session.user.permissions?.includes("teach") ||
    session.user.permissions?.includes("admin") ||
    session.user.permissions?.includes("super");

  if (isTeacher) {
    redirect("/teacher");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Harmonized Student Navbar */}
      <StudentNavbar userName={session.user.name} onSignOut={handleSignOut} />

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Cursurile Mele
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accesează materialele, sarcinile interactive și progresele tale la fiecare curs
          </p>
        </div>

        <CourseList />

        {/* Quick link to Staff Portal */}
        <div className="mt-12 text-center">
          <Link
            href="https://in.brio.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs"
          >
            <span>Portal Staff (Cadre Didactice)</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
