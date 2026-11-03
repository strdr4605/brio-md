import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { LoginClientCard } from "./LoginClientCard";

// Polyfill/guard performance.measure against Next.js Turbopack negative timestamp bugs
if (
  typeof globalThis.performance !== "undefined" &&
  typeof globalThis.performance.measure === "function"
) {
  const origMeasure = globalThis.performance.measure.bind(globalThis.performance);
  globalThis.performance.measure = function (name: string, ...args: unknown[]) {
    try {
      return origMeasure(name, ...(args as [any, any]));
    } catch {
      return {
        name,
        entryType: "measure",
        startTime: 0,
        duration: 0,
        toJSON: () => ({}),
      } as unknown as PerformanceMeasure;
    }
  };
}

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

  if (session?.user && !session.user.expired) {
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
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <LoginClientCard error={error} onSubmitAction={handleLogin} />
    </div>
  );
}
