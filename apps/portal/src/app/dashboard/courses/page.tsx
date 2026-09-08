"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { CourseFormDrawer } from "@/components/dashboard/CourseForm";

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    name: string | null;
    description: string | null;
    active: boolean | null;
  } | null>(null);

  const { data: courses = [], isLoading } = trpc.course.list.useQuery({ active: activeFilter });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea să accesezi această pagină.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cursuri</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă curs
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
          onChange={(e) => {
            const v = e.target.value;
            setActiveFilter(v === "all" ? undefined : v === "active");
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Toate</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : courses.length === 0 ? (
        <p className="text-neutral-600">Nu există cursuri.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Descriere</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.description || "-"}</td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="text-green-600">Activ</span>
                    ) : (
                      <span className="text-red-600">Inactiv</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Editează
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <CourseFormDrawer course={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}
