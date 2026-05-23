import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = session.user as any;
  const permissions = user.permissions || [];
  const isSuper = permissions.includes("super");
  const isAdmin = permissions.includes("admin") || isSuper;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Brio.md Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">{user.name}</span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-sm rounded">
              {user.role}
            </span>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-neutral-500 text-sm">Name</span>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <span className="text-neutral-500 text-sm">Email</span>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-neutral-500 text-sm">Role</span>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <span className="text-neutral-500 text-sm">School</span>
              <p className="font-medium">{user.schoolId || "N/A"}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-neutral-500 text-sm">Permissions</span>
            <div className="flex gap-2 mt-1">
              {permissions.map((perm: string) => (
                <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Admin/SuperAdmin Section */}
        {(isSuper || isAdmin) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">User Management</h3>
            <p className="text-neutral-600 mb-4">
              {isSuper
                ? "You can view and manage all users across all schools."
                : "You can view and manage users in your school."}
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Manage Users
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="https://learn.brio.md"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h4 className="font-semibold text-lg mb-2">Learning Portal</h4>
            <p className="text-neutral-600 text-sm">View courses and materials</p>
          </Link>
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">Attendance</h4>
            <p className="text-neutral-600 text-sm">Track student attendance (coming soon)</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">Payments</h4>
            <p className="text-neutral-600 text-sm">Manage contracts and payments (coming soon)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
