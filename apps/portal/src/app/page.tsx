import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@brio-md/auth";
import { LoginForm } from "@brio-md/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // If JWT decryption fails or DB is temporarily down, treat as unauthenticated
  }

  if (session?.user) {
    redirect("/dashboard");
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
          redirectTo: "/dashboard",
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tight">Portal Personal</h1>

        <LoginForm variant="blue" error={error} onSubmit={handleLogin} />

        <div className="mt-5 text-center">
          <Link href="https://learn.brio.md" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
            Accesează Portalul de Învățare →
          </Link>
        </div>
      </div>
    </div>
  );
}
