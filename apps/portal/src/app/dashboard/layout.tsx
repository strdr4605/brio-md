import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { Nav } from "@/components/dashboard/Nav";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || (session.user as any).expired) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav
        userName={session.user.name ?? undefined}
        permissions={session.user.permissions || []}
        role={session.user.role || undefined}
      />

      <main className="md:ml-[200px] pb-20 md:pb-0 pt-0">
        <SessionProvider session={session}>{children}</SessionProvider>
      </main>
    </div>
  );
}
