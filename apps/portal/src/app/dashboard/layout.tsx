import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { Nav } from "@/components/dashboard/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav />
      {/* Header - desktop only, mobile uses bottom nav */}
      <header className="hidden md:block bg-white shadow-sm fixed top-0 left-[200px] right-0 z-30">
        <div className="px-6 py-4 flex justify-between items-center">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">{(session.user as any).name}</span>
          </div>
        </div>
      </header>

      {/* Main content - pushed right on desktop, above bottom nav on mobile */}
      <main className="md:ml-[200px] pb-20 md:pb-0 pt-0 md:pt-[65px]">
        {children}
      </main>
    </div>
  );
}