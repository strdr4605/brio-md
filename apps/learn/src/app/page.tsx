import { signIn } from "@/lib/auth";
import { auth } from "@brio-md/auth";
import { redirect } from "next/navigation";
import { LoginRoleCard } from "./LoginRoleCard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in, redirect based on role
  let session = null;
  try {
    session = await auth();
  } catch {
    // Treat as unauthenticated if auth verification fails
  }

  if (session?.user && !session.user.expired) {
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
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <LoginRoleCard error={error} onSubmit={handleLogin} />
    </div>
  );
}
