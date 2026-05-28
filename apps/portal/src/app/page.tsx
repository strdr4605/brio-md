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
  const session = await auth();
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
    } catch (error: any) {
      if (error?.digest?.includes("NEXT_REDIRECT")) {
        throw error;
      }
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Portal Personal</h1>

        <LoginForm variant="blue" error={error} onSubmit={handleLogin} />

        <div className="mt-4 text-center">
          <Link href="https://learn.brio.md" className="text-sm text-blue-600 hover:underline">
            Accesează Portalul de Învățare →
          </Link>
        </div>
      </div>
    </div>
  );
}
