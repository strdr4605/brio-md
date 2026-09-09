import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { CourseList } from "./CourseList";

export default async function CoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Learning Portal</h1>
          <div className="flex items-center gap-4">
            <span>{session.user.name}</span>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm underline cursor-pointer">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Courses</h2>

        <CourseList />

        {/* Quick link to Staff Portal */}
        <div className="mt-8 text-center">
          <Link href="https://in.brio.md" className="text-green-600 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}
