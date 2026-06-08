"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export default function StudentiPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isSuperOrAdmin = permissions.includes("super") || permissions.includes("admin");

  const { data: students = [], isLoading } = trpc.student.list.useQuery();

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
      <h1 className="text-2xl font-bold mb-4">Studenţi</h1>
      {isLoading ? (
        <p>Se încarcă...</p>
      ) : students.length === 0 ? (
        <p className="text-neutral-600">Nu există studenți.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Părinte</th>
                <th className="px-4 py-3 text-left">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.parentName || "-"}</td>
                  <td className="px-4 py-3">{s.parentPhone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
