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
        <h1 className="text-2xl font-bold">Studenți</h1>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : students.length === 0 ? (
        <p className="text-neutral-600">Nu există studenți înregistrați.</p>
      ) : (
        <>
          <div className="md:hidden bg-white rounded-lg shadow divide-y">
            {students.map((student) => {
              const school = schools.find((s) => s.id === student.schoolId);
              return (
                <div key={student.id} className="p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-neutral-900">{student.name}</span>
                    {school && (
                      <span className="text-xs text-neutral-500">{school.name}</span>
                    )}
                  </div>
                  {student.phone && (
                    <p className="text-sm text-neutral-700">{student.phone}</p>
                  )}
                  {student.createdAt && (
                    <p className="text-xs text-neutral-400">
                      {new Date(student.createdAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Nume</th>
                  <th className="px-4 py-3 text-left">Telefon</th>
                  <th className="px-4 py-3 text-left">Școală</th>
                  <th className="px-4 py-3 text-left">Data adăugării</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const school = schools.find((s) => s.id === student.schoolId);
                  return (
                    <tr key={student.id} className="border-t">
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3">{student.phone || "-"}</td>
                      <td className="px-4 py-3">{school?.name || "-"}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString("ro-RO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
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
