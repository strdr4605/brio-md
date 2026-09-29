"use client";

import { formatPhone } from "@/lib/phone";
import { PhoneIcon } from "@/components/ui/icons";

export type CourseRosterMemberRowProps = {
  member: {
    enrollmentId: number;
    studentName: string;
    studentPhone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    status: string | null;
    joinedAt?: Date | string | null;
  };
  onStatusChange: (enrollmentId: number, nextStatus: "active" | "inactive" | "archived") => void;
  isUpdating: boolean;
};

export function CourseRosterMemberRow({
  member,
  onStatusChange,
  isUpdating,
}: CourseRosterMemberRowProps) {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{member.studentName}</span>
          {member.status === "active" ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Activ
            </span>
          ) : member.status === "inactive" ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
              Inactiv
            </span>
          ) : member.status === "archived" ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Arhivat
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              Completat
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {member.studentPhone && (
            <a
              href={`tel:${member.studentPhone}`}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition"
            >
              <PhoneIcon className="w-3 h-3 text-slate-400" />
              <span>{formatPhone(member.studentPhone)}</span>
            </a>
          )}
          {member.parentName && (
            <span>
              Tutore: <strong className="text-slate-700 font-semibold">{member.parentName}</strong>
              {member.parentPhone ? ` (${formatPhone(member.parentPhone)})` : ""}
            </span>
          )}
          {member.joinedAt && (
            <span>
              Înscris la {new Date(member.joinedAt).toLocaleDateString("ro-RO")}
            </span>
          )}
        </div>
      </div>

      {/* Fast Toggle / Dropdown for Status */}
      <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span className="text-[11px] text-slate-400 font-medium">Modifică Status:</span>
        <select
          value={member.status || "active"}
          onChange={(e) =>
            onStatusChange(
              member.enrollmentId,
              e.target.value as "active" | "inactive" | "archived",
            )
          }
          disabled={isUpdating}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none cursor-pointer text-slate-800 transition"
        >
          <option value="active">Activ</option>
          <option value="inactive">Inactiv</option>
          <option value="archived">Arhivat</option>
        </select>
      </div>
    </div>
  );
}
