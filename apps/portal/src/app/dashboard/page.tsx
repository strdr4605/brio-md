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
          <h1 className="text-xl font-bold">Portal Brio.md</h1>
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">{user.name}</span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-sm rounded">
              {user.role}
            </span>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Deconectare
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Panoul de Control</h2>

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

        {/* Admin/SuperAdmin Section */}
        {(isSuper || isAdmin) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Gestionare Utilizatori</h3>
            <p className="text-neutral-600 mb-4">
              {isSuper
                ? "Poţi vizualiza şi gestiona toţi utilizatorii din toate şcolile."
                : "Poţi vizualiza şi gestiona utilizatorii din şcoala ta."}
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Gestionează Utilizatori
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="https://learn.brio.md"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h4 className="font-semibold text-lg mb-2">Portal de Învăţare</h4>
            <p className="text-neutral-600 text-sm">Vizualizează cursuri şi materiale</p>
          </Link>
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">Prezenţă</h4>
            <p className="text-neutral-600 text-sm">Urmăreşte prezenţa elevilor (în curând)</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">Plăţi</h4>
            <p className="text-neutral-600 text-sm">Gestionează contracte şi plăţi (în curând)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
