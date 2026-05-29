"use client";

import { UserFormDrawer } from "@/components/dashboard/UserForm";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function UsersPage() {
  const { data: session } = useSession();
  const permissions = (session?.user as any)?.permissions || [];
  const isSuperAdmin = permissions.includes("super");
  const isAdmin = permissions.includes("admin");

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { data: users = [], isLoading } = trpc.user.list.useQuery({ active: activeFilter });
  const { data: schools = [] } = trpc.user.listSchools.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Utilizatori</h1>
        <div className="flex gap-2">
          <select
            value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === "all" ? undefined : val === "active");
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Toți</option>
            <option value="active">Activ</option>
            <option value="inactive">Inactiv</option>
          </select>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Adaugă Utilizator
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : users.length === 0 ? (
        <p className="text-neutral-600">Nu există utilizatori.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                {isSuperAdmin && <th className="px-4 py-3 text-left">Şcoală</th>}
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const school = schools.find((s: any) => s.id === user.schoolId);
                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          user.role === "superadmin"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    {isSuperAdmin && <td className="px-4 py-3">{school?.name || "-"}</td>}
                    <td className="px-4 py-3">
                      {user.active ? (
                        <span className="text-green-600">Activ</span>
                      ) : (
                        <span className="text-red-600">Inactiv</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:underline"
                      >
                        Editează
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <UserFormDrawer
          user={editingUser}
          schools={schools}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          onClose={() => setShowForm(false)}
          currentUserSchoolId={(session?.user as any)?.schoolId}
        />
      )}
    </div>
  );
}
