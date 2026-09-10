import { signIn } from "@/lib/auth";
import { auth } from "@brio-md/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@brio-md/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in, redirect based on role
  const session = await auth();
  if (session?.user) {
    const isTeacher =
      session.user.role === "teacher" ||
      session.user.role === "admin" ||
      session.user.role === "superadmin" ||
      session.user.permissions?.includes("teach") ||
      session.user.permissions?.includes("admin") ||
      session.user.permissions?.includes("super");

    if (isTeacher && !session.user.studentId) {
      redirect("/teacher");
    } else {
      redirect("/courses");
    }
  }

  const params = await searchParams;
  const error = params.error;

  async function handleLogin(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn(
        "credentials",
        {
          email,
          password,
        },
        {
          redirectTo: "/courses",
        },
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes("NEXT_REDIRECT")) {
        throw error;
      }
      // Otherwise redirect to error page
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Learning Portal</h1>

        <LoginForm variant="green" error={error} onSubmit={handleLogin} />

        <div className="mt-4 text-center">
          <Link href="https://in.brio.md" className="text-sm text-green-600 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
