"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupFormDrawer } from "@/components/dashboard/GroupForm";
import { EnrollmentFormDrawer } from "@/components/dashboard/EnrollmentForm";
import { SessionFormDrawer } from "@/components/dashboard/SessionForm";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = Number(id);
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const { data: group } = trpc.group.get.useQuery({ id: groupId });
  const { data: course } = trpc.course.get.useQuery(
    { id: group?.courseId ?? 0 },
    { enabled: !!group?.courseId },
  );
  const { data: enrollments = [] } = trpc.enrollment.listByGroup.useQuery({ groupId });
  const { data: sessions = [] } = trpc.groupSession.listByGroup.useQuery({ groupId });
  const { data: students = [] } = trpc.student.list.useQuery();

  const removeEnrollment = trpc.enrollment.remove.useMutation({
    onSuccess: () => trpc.useUtils().enrollment.listByGroup.invalidate({ groupId }),
  });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea.</div>;
  if (!group) return <div className="p-6">Se încarcă grupa...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-neutral-600">{course?.name}</p>
            <p className="text-sm mt-2">
              Status: {group.active ? <span className="text-green-600">Activă</span> : <span className="text-red-600">Inactivă</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/dashboard/groups/${groupId}/calendar`} className="px-3 py-2 border rounded-lg text-sm">
              Calendar
            </a>
            <button
              onClick={() => setShowGroupForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Editează
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Elevi înscriși</h2>
          <button
            onClick={() => setShowEnrollForm(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Adaugă elev
          </button>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-neutral-600">Niciun elev înscris.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Elev</th>
                  <th className="px-4 py-3 text-left">Tip</th>
                  <th className="px-4 py-3 text-left">Preț</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const st = students.find((s) => s.id === e.studentId);
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-3">{st?.name ?? `#${e.studentId}`}</td>
                      <td className="px-4 py-3">{e.type}</td>
                      <td className="px-4 py-3">{(e.price / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">{e.startDate}</td>
                      <td className="px-4 py-3">{e.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm("Ștergi înscrierea?")) removeEnrollment.mutate({ id: e.id });
                          }}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Lecții</h2>
          <button
            onClick={() => setShowSessionForm(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Lecție nouă
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-neutral-600">Nicio lecție.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/teacher/sessions/${s.id}/attendance`}
                        className="text-blue-600 hover:underline"
                      >
                        {s.date}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{s.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGroupForm && <GroupFormDrawer group={group} onClose={() => setShowGroupForm(false)} />}
      {showEnrollForm && (
        <EnrollmentFormDrawer
          groupId={groupId}
          onClose={() => setShowEnrollForm(false)}
        />
      )}
      {showSessionForm && (
        <SessionFormDrawer
          groupId={groupId}
          onClose={() => setShowSessionForm(false)}
        />
      )}
    </div>
  );
}
