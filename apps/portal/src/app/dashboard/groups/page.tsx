"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupFormDrawer } from "@/components/dashboard/GroupForm";

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");
  const [courseFilter, setCourseFilter] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    name: string | null;
    courseId: number | null;
    teacherId: number | null;
    active: boolean | null;
  } | null>(null);

  const { data: courses = [] } = trpc.course.list.useQuery();
  const { data: groups = [], isLoading } = trpc.group.list.useQuery(
    courseFilter ? { courseId: courseFilter } : undefined,
  );

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea să accesezi această pagină.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grupe</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă grupă
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={courseFilter ?? ""}
          onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Toate cursurile</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : groups.length === 0 ? (
        <p className="text-neutral-600">Nu există grupe.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Curs</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const course = courses.find((c) => c.id === g.courseId);
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/groups/${g.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {g.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">{course?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      {g.active ? (
                        <span className="text-green-600">Activă</span>
                      ) : (
                        <span className="text-red-600">Inactivă</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditing(g);
                          setShowForm(true);
                        }}
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
        <GroupFormDrawer
          group={editing}
          defaultCourseId={courseFilter}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
