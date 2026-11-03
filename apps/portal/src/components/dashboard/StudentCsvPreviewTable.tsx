"use client";

import type { ParsedCandidate } from "@/lib/studentCsvParser";

type Props = {
  candidates: ParsedCandidate[];
};

export function StudentCsvPreviewTable({ candidates }: Props) {
  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
          <tr>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Nume Elev</th>
            <th className="py-2 px-3">Telefon</th>
            <th className="py-2 px-3">Părinte & Tel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((c, idx) => (
            <tr key={idx} className={c.isValid ? "hover:bg-slate-50" : "bg-rose-50/40"}>
              <td className="py-2 px-3">
                {c.isValid ? (
                  <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                    ✓ Valid
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center text-rose-600 font-semibold text-[11px]"
                    title={c.error}
                  >
                    ⚠️ {c.error}
                  </span>
                )}
              </td>
              <td className="py-2 px-3 font-semibold text-slate-900">{c.name || "—"}</td>
              <td className="py-2 px-3 font-mono text-slate-600">{c.phone || "—"}</td>
              <td className="py-2 px-3 text-slate-600">
                {c.parentName ? `${c.parentName} (${c.parentPhone || "fără tel"})` : c.parentPhone || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
