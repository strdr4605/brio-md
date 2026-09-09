"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: courses = [], isLoading } = trpc.course.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Learning Portal</h1>
          <div className="flex items-center gap-4">
            <span>{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm underline cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Courses</h2>

        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-neutral-600">No courses assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Open Course
                </button>
              </div>
            ))}
          </div>
        )}

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
