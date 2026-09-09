import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { CourseDetailView } from "./CourseDetailView";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { id } = await params;
  const courseId = parseInt(id, 10);

  if (isNaN(courseId)) {
    redirect("/courses");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/courses" className="text-xl font-bold tracking-tight hover:opacity-95">
            Learning Portal
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{session.user.name}</span>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm underline hover:opacity-80 cursor-pointer">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <CourseDetailView courseId={courseId} />

        {/* Quick link to Staff Portal */}
        <div className="mt-12 text-center">
          <Link href="https://in.brio.md" className="text-sm text-green-700 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}
