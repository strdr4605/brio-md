import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || (session.user as any).expired) {
    redirect("/");
  }

  return (
    <SessionProvider session={session}>
      <DashboardShell
        userName={session.user.name ?? undefined}
        permissions={session.user.permissions || []}
        role={session.user.role || undefined}
        schoolId={session.user.schoolId ?? null}
      >
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
