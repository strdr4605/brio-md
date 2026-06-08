"use client";

import { use, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export default function GroupCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = Number(id);
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: group } = trpc.group.get.useQuery({ id: groupId });
  const { data: sessions = [] } = trpc.groupSession.listByMonth.useQuery({ groupId, year, month });

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const byDate = useMemo(() => {
    const m = new Map<string, typeof sessions>();
    for (const s of sessions) m.set(s.date, [...(m.get(s.date) ?? []), s]);
    return m;
  }, [sessions]);

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea.</div>;
  if (!group) return <div className="p-6">Se încarcă grupa...</div>;

  return (
    <div className="p-6 space-y-4">
      <div>
        <a href={`/dashboard/groups/${groupId}`} className="text-sm text-blue-600">
          ← {group.name}
        </a>
        <h1 className="text-2xl font-bold">Calendar — {group.name}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1);
          }}
          className="px-3 py-1 border rounded-lg"
        >
          ←
        </button>
        <span className="font-semibold">
          {new Date(year, month - 1, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => {
            if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1);
          }}
          className="px-3 py-1 border rounded-lg"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-neutral-600 mb-1">
        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sb", "Du"].map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const key = c.date ? formatYMD(c.date) : "";
          const daySessions = key ? byDate.get(key) ?? [] : [];
          return (
            <div
              key={i}
              className={`min-h-[80px] border rounded-lg p-1 ${
                c.inMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"
              }`}
            >
              {c.date && (
                <>
                  <div className="text-xs">{c.date.getDate()}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {daySessions.map((s) => (
                      <a
                        key={s.id}
                        href={`/dashboard/teacher/sessions/${s.id}/attendance`}
                        className="block w-2 h-2 rounded-full bg-blue-600"
                        title={s.notes || s.date}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Cell = { date: Date | null; inMonth: boolean };

function buildMonthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = (first.getDay() + 6) % 7;
  const cells: Cell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month - 1, -firstWeekday + i + 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= last.getDate(); day++) {
    cells.push({ date: new Date(year, month - 1, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last2 = cells[cells.length - 1].date!;
    const d = new Date(last2);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
