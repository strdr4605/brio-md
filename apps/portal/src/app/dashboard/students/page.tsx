"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

export default function StudentiPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  const { data: students = [], isLoading } = trpc.student.list.useQuery(undefined, {
    enabled: isSuperOrAdmin,
  });
  const { data: schools = [] } = trpc.user.listSchools.useQuery(undefined, {
    enabled: isSuperOrAdmin,
  });

  if (status === "loading") {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Se încarcă...</p>
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Studenţi</h1>
      </div>

      {isLoading ? (
        <p className="text-neutral-600">Se încarcă...</p>
      ) : students.length === 0 ? (
        <p className="text-neutral-600">Nu există studenți.</p>
      ) : (
        <>
          <div className="md:hidden bg-white rounded-lg shadow divide-y">
            {students.map((student) => {
              const school = schools.find((s) => s.id === student.schoolId);
              return (
                <div key={student.id} className="p-4 space-y-1">
                  <div className="font-semibold text-base">{student.name}</div>
                  <div className="text-sm text-neutral-600">
                    Școală: {school?.name ?? student.schoolId ?? "-"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Adăugat:{" "}
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString("ro-RO")
                      : "-"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-100 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-sm text-neutral-700">Nume</th>
                  <th className="px-4 py-3 font-semibold text-sm text-neutral-700">Școală</th>
                  <th className="px-4 py-3 font-semibold text-sm text-neutral-700">Data creării</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {students.map((student) => {
                  const school = schools.find((s) => s.id === student.schoolId);
                  return (
                    <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-900 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {school
                          ? `${school.name} (#${student.schoolId})`
                          : student.schoolId
                            ? `#${student.schoolId}`
                            : "-"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-sm">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString("ro-RO", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

