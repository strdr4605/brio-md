"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TeacherLanding() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: myGroups = [] } = trpc.group.listMine.useQuery();
  const { data: courses = [] } = trpc.course.list.useQuery();

  const [courseId, setCourseId] = useState<number | "">("");
  const [groupId, setGroupId] = useState<number | "">("");

  const filteredGroups = courseId
    ? myGroups.filter((g) => g.courseId === Number(courseId))
    : myGroups;

  const create = trpc.groupSession.create.useMutation({
    onSuccess: (row) => {
      if (row) router.push(`/dashboard/teacher/sessions/${row.id}/attendance`);
    },
  });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!session?.user) return <div className="p-6">Neautentificat.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Bun venit, {session.user.name}</h1>
      <p className="text-neutral-600">Creează o lecție nouă pentru a marca prezența.</p>

      {myGroups.length === 0 ? (
        <p className="text-neutral-600">Nu ești asignat la nicio grupă.</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Curs</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value === "" ? "" : Number(e.target.value));
                setGroupId("");
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege curs</option>
              {courses
                .filter((c) => myGroups.some((g) => g.courseId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grupă</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
              disabled={!courseId}
            >
              <option value="">Alege grupă</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              create.mutate({
                groupId: Number(groupId),
                date: new Date().toISOString().slice(0, 10),
              });
            }}
            disabled={!groupId || create.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? "Se creează..." : "Începe lecția"}
          </button>
        </div>
      )}
    </div>
  );
}
