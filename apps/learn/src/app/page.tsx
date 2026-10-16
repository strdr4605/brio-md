import { signIn } from "@/lib/auth";
import { auth } from "@brio-md/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, LoginForm, ExternalLinkIcon } from "@brio-md/ui";

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
      <Card className="p-6 sm:p-8 w-full max-w-md shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg mx-auto mb-3 shadow-xs">
            B
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Learning Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Autentificare Elevi & Profesori</p>
        </div>

        <LoginForm variant="slate" error={error} onSubmit={handleLogin} />

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="https://in.brio.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <span>Portal Staff (Cadre Didactice)</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
