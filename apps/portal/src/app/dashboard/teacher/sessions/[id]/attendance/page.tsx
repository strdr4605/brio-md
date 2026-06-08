"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

type Row = { studentId: number; status: "present" | "absent"; notes: string };

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sessionId = Number(id);
  const router = useRouter();

  const { data: session } = trpc.groupSession.get.useQuery({ id: sessionId });
  const { data: group } = trpc.group.get.useQuery(
    { id: session?.groupId ?? 0 },
    { enabled: !!session?.groupId },
  );
  const { data: enrollments = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: session?.groupId ?? 0 },
    { enabled: !!session?.groupId },
  );
  const { data: students = [] } = trpc.student.list.useQuery();
  const { data: existing = [] } = trpc.attendance.listBySession.useQuery({ groupSessionId: sessionId });

  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollments.length) return;
    setRows((prev) => {
      if (prev.length) return prev;
      return enrollments
        .filter((e) => e.status === "active")
        .map((e) => {
          const prior = existing.find((a) => a.studentId === e.studentId);
          return {
            studentId: e.studentId,
            status: (prior?.status as "present" | "absent") ?? "present",
            notes: prior?.notes ?? "",
          };
        });
    });
  }, [enrollments, existing]);

  const bulkSave = trpc.attendance.bulkSave.useMutation({
    onSuccess: (r) => {
      setSaving(false);
      trpc.useUtils().attendance.listBySession.invalidate({ groupSessionId: sessionId });
      if (r.rejected.length === 0) {
        setMessage("Prezență salvată");
      } else {
        const names = r.rejected
          .map((rj) => students.find((s) => s.id === rj.studentId)?.name ?? `#${rj.studentId}`)
          .join(", ");
        setMessage(`Salvat. Respinși (fără înscriere activă): ${names}`);
      }
    },
    onError: (e) => {
      setSaving(false);
      setMessage(`Eroare: ${e.message}`);
    },
  });

  if (!session) return <div className="p-6">Se încarcă...</div>;

  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <button onClick={() => router.back()} className="text-sm text-blue-600 mb-2">
          ← Înapoi
        </button>
        <h1 className="text-2xl font-bold">Prezență — {group?.name ?? "..."}</h1>
        <p className="text-neutral-600">{session.date}</p>
      </div>

      {activeEnrollments.length === 0 ? (
        <p className="text-neutral-600">Niciun elev activ în această grupă.</p>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {rows.map((row, idx) => {
            const st = students.find((s) => s.id === row.studentId);
            return (
              <div key={row.studentId} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{st?.name ?? `#${row.studentId}`}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setRows((r) => r.map((x, i) => (i === idx ? { ...x, status: "present" } : x)))
                      }
                      className={`px-3 py-1 rounded-lg text-sm ${
                        row.status === "present" ? "bg-green-600 text-white" : "bg-neutral-100"
                      }`}
                    >
                      Prezent
                    </button>
                    <button
                      onClick={() =>
                        setRows((r) => r.map((x, i) => (i === idx ? { ...x, status: "absent" } : x)))
                      }
                      className={`px-3 py-1 rounded-lg text-sm ${
                        row.status === "absent" ? "bg-red-600 text-white" : "bg-neutral-100"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={row.notes}
                  onChange={(e) =>
                    setRows((r) => r.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x)))
                  }
                  placeholder="Note (opțional)"
                  className="w-full border rounded-lg px-3 py-1 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      {message && <p className="text-sm">{message}</p>}

      <button
        onClick={() => {
          setSaving(true);
          setMessage(null);
          bulkSave.mutate({ groupSessionId: sessionId, rows });
        }}
        disabled={saving || rows.length === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Se salvează..." : "Salvează prezența"}
      </button>
    </div>
  );
}
