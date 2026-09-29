"use client";

import { useState } from "react";
import { BookOpenIcon, PlusIcon } from "@/components/ui/icons";

const DAY_LABELS: Record<string, string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Fără orar stabilit";
}

function getLevelBadge(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Începător
        </span>
      );
    case "intermediate":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Mediu
        </span>
      );
    case "advanced":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white border border-slate-900">
          Avansat
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {level || "Standard"}
        </span>
      );
  }
}

function getEnrollmentStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "active":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Activ
        </span>
      );
    case "completed":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white border border-slate-900">
          Finalizat
        </span>
      );
    case "archived":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Arhivat
        </span>
      );
    case "inactive":
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Inactiv
        </span>
      );
  }
}

export type StudentCoursesTabProps = {
  activeEnrollments: any[];
  historyEnrollments: any[];
  isLoadingEnrollments: boolean;
  onOpenEnrollDrawer: () => void;
  onOpenStatusModal: (enr: any) => void;
};

export function StudentCoursesTab({
  activeEnrollments,
  historyEnrollments,
  isLoadingEnrollments,
  onOpenEnrollDrawer,
  onOpenStatusModal,
}: StudentCoursesTabProps) {
  const [courseTab, setCourseTab] = useState<"active" | "history">("active");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setCourseTab("active")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              courseTab === "active"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Grupe & Cursuri Active</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {activeEnrollments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCourseTab("history")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              courseTab === "history"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Istoric Cursuri Finalizate & Arhivate</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
              {historyEnrollments.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenEnrollDrawer}
          className="pb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline shrink-0"
        >
          <span>+ Înrolare nouă</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {isLoadingEnrollments ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Se încarcă lista de grupe...
          </div>
        ) : courseTab === "active" ? (
          activeEnrollments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Nicio grupă activă în acest moment
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Elevul nu este înrolat în nicio grupă activă. Folosește butonul de mai jos pentru a-l înrola într-o grupă.
              </p>
              <button
                type="button"
                onClick={onOpenEnrollDrawer}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Înrolează în Curs</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeEnrollments.map((enr) => {
                const joinedDateFormatted = enr.joinedAt
                  ? new Date(enr.joinedAt).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <div
                    key={enr.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {enr.courseName}
                          </span>
                          {getLevelBadge(enr.courseLevel)}
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">
                          {enr.groupName}
                        </h3>
                      </div>
                      {getEnrollmentStatusBadge(enr.status)}
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Orar Săptămânal:</span>
                        <span className="font-bold text-slate-800">
                          {formatSchedule(enr.scheduleDays, enr.scheduleTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Sală / Locație:</span>
                        <span className="font-semibold text-slate-800">{enr.room || "Sala Principală"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Profesor / Mentor:</span>
                        <span className="font-semibold text-slate-800">
                          {enr.teacherName || "Neasignat"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 font-medium">Data Înrolării:</span>
                        <span className="text-slate-700">{joinedDateFormatted}</span>
                      </div>
                    </div>

                    {enr.notes && (
                      <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        Notă: {enr.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onOpenStatusModal(enr)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Schimbă Status / Arhivează
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : historyEnrollments.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Fără istoric de cursuri finalizate</p>
            <p className="text-xs text-slate-400">
              Când un curs este marcat drept finalizat sau arhivat, acesta va apărea aici cu data completării și nivelul atins.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="px-4 py-3">Curs & Nivel</th>
                  <th className="px-4 py-3">Grupă</th>
                  <th className="px-4 py-3">Orar / Profesor</th>
                  <th className="px-4 py-3">Perioadă Înrolare</th>
                  <th className="px-4 py-3">Status Final</th>
                  <th className="px-4 py-3">Observații</th>
                  <th className="px-4 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyEnrollments.map((enr) => {
                  const joinedDateFormatted = enr.joinedAt
                    ? new Date(enr.joinedAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const leftDateFormatted = enr.leftAt
                    ? new Date(enr.leftAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{enr.courseName}</span>
                          {getLevelBadge(enr.courseLevel)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {enr.groupName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{formatSchedule(enr.scheduleDays, enr.scheduleTime)}</div>
                        <div className="text-[11px] text-slate-400">{enr.teacherName || "Neasignat"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <div>Înscris: {joinedDateFormatted}</div>
                        <div className="text-[11px] text-slate-400">Finalizat: {leftDateFormatted}</div>
                      </td>
                      <td className="px-4 py-3">{getEnrollmentStatusBadge(enr.status)}</td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                        {enr.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(enr)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          Modifică / Reactivează
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
    </div>
  );
}
