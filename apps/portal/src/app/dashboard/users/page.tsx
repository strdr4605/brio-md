"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { UserFormDrawer, type UserFormUser } from "@/components/dashboard/UserForm";
import { UserKpiCards } from "@/components/dashboard/UserKpiCards";
import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  SchoolIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormUser | null>(null);

  const { data: users = [], isLoading } = trpc.user.list.useQuery(
    {},
    { enabled: isSuperOrAdmin }
  );
  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: isSuperOrAdmin,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (user.name || "").toLowerCase().includes(q);
        const matchesEmail = (user.email || "").toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      if (activeFilter === "active" && !user.active) return false;
      if (activeFilter === "inactive" && user.active) return false;

      if (roleFilter !== "all" && user.role !== roleFilter) return false;

      return true;
    });
  }, [users, search, activeFilter, roleFilter]);

  if (status === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-28 bg-slate-200/80 rounded-2xl" />
        <div className="h-96 bg-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <UsersIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">Nu ai permisiuni suficiente pentru gestiunea utilizatorilor.</p>
      </div>
    );
  }

  const handleEdit = (user: (typeof users)[number]) => {
    setEditingUser(user as UserFormUser);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "superadmin").length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Utilizatori</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {users.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrează conturile de acces, rolurile de securitate și școlile asociate.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Adaugă Utilizator</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <UserKpiCards
        totalUsers={users.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        adminCount={adminCount}
      />

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toate Statusurile</option>
            <option value="active">Doar Activi</option>
            <option value="inactive">Doar Inactivi</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toate Rolurile</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Profesor</option>
          </select>
        </div>
      </div>

      {/* Main Luxury Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <p className="text-sm text-slate-500">Se încarcă utilizatorii...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Niciun utilizator găsit</p>
          <p className="text-xs text-slate-400 mt-1">Încearcă să ajustezi filtrele de căutare.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Utilizator</th>
                  <th className="px-5 py-3.5">Rol</th>
                  {isSuperOrAdmin && <th className="px-5 py-3.5">Școală</th>}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const school = schools.find((s) => s.id === user.schoolId);

                  const roleBadgeClass =
                    user.role === "superadmin"
                      ? "bg-purple-50 text-purple-700 border-purple-200/80"
                      : user.role === "admin"
                      ? "bg-blue-50 text-blue-700 border-blue-200/80"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200/80";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-sm block truncate">
                              {user.name}
                            </span>
                            <span className="text-xs text-slate-400 block truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${roleBadgeClass}`}
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          {user.role}
                        </span>
                      </td>

                      {/* School */}
                      {isSuperOrAdmin && (
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                            <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
                            {school?.name || "Global"}
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactiv
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
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
        </div>
      )}

      {/* Edit / Create Drawer */}
      {showForm && (
        <UserFormDrawer
          user={editingUser}
          schools={schools}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowForm(false)}
          currentUserSchoolId={session?.user?.schoolId ?? undefined}
        />
      )}
    </div>
  );
}
