"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);
  const [tab, setTab] = useState<"enrollments" | "attendance">("enrollments");

  const { data, isLoading } = trpc.student.getWithHistory.useQuery({ id: studentId });
  const { data: groups = [] } = trpc.group.list.useQuery();
  const { data: courses = [] } = trpc.course.list.useQuery();

  if (isLoading) return <div className="p-6">Se încarcă...</div>;
  if (!data) return <div className="p-6">Elevul nu există.</div>;

  const { student, enrollments, attendances } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <a href="/dashboard/students" className="text-sm text-blue-600">
          ← Studenți
        </a>
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-neutral-600">
          {student.parentName || ""} {student.parentPhone ? `· ${student.parentPhone}` : ""}
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("enrollments")}
          className={`px-4 py-2 text-sm ${tab === "enrollments" ? "border-b-2 border-blue-600 font-semibold" : "text-neutral-600"}`}
        >
          Înscrieri
        </button>
        <button
          onClick={() => setTab("attendance")}
          className={`px-4 py-2 text-sm ${tab === "attendance" ? "border-b-2 border-blue-600 font-semibold" : "text-neutral-600"}`}
        >
          Prezență
        </button>
      </div>

      {tab === "enrollments" &&
        (enrollments.length === 0 ? (
          <p className="text-neutral-600">Nicio înscriere.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Grupă</th>
                  <th className="px-4 py-3 text-left">Curs</th>
                  <th className="px-4 py-3 text-left">Tip</th>
                  <th className="px-4 py-3 text-left">Preț</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const g = groups.find((x) => x.id === e.groupId);
                  const c = g ? courses.find((x) => x.id === g.courseId) : null;
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-3">{g?.name ?? `#${e.groupId}`}</td>
                      <td className="px-4 py-3">{c?.name ?? "-"}</td>
                      <td className="px-4 py-3">{e.type}</td>
                      <td className="px-4 py-3">{(e.price / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">{e.startDate}</td>
                      <td className="px-4 py-3">{e.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "attendance" &&
        (attendances.length === 0 ? (
          <p className="text-neutral-600">Nicio prezență înregistrată.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Grupă</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => {
                  const g = groups.find((x) => x.id === a.groupId);
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-3">{a.sessionDate}</td>
                      <td className="px-4 py-3">{g?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        {a.status === "present" ? (
                          <span className="text-green-600">Prezent</span>
                        ) : (
                          <span className="text-red-600">Absent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{a.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
