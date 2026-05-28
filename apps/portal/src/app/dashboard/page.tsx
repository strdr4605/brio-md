import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = session.user as any;
  const permissions = user.permissions || [];

  return (
    <div className="p-6">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Profilul Tău</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-neutral-500 text-sm">Nume</span>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <span className="text-neutral-500 text-sm">Email</span>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <span className="text-neutral-500 text-sm">Rol</span>
            <p className="font-medium">{user.role}</p>
          </div>
          <div>
            <span className="text-neutral-500 text-sm">Şcoală</span>
            <p className="font-medium">{user.schoolId || "N/A"}</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-neutral-500 text-sm">Permisiuni</span>
          <div className="flex gap-2 mt-1">
            {permissions.map((perm: string) => (
              <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}