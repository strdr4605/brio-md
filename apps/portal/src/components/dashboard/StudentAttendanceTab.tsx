"use client";

import { TrendingUpIcon } from "@/components/ui/icons";
import { ABSENCE_PRESET_CHIPS } from "@/components/dashboard/AbsenceCommentWidget";

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

function getAttendanceBadge(status: string) {
  switch (status) {
    case "present":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Prezent
        </span>
      );
    case "late":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Întârziat
        </span>
      );
    case "absent":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      );
    case "excused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Învoit
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
}

function formatAbsenceComment(comment: string | null | undefined) {
  if (!comment || !comment.trim()) {
    return <span className="text-slate-400 italic">—</span>;
  }
  const matchedChip = ABSENCE_PRESET_CHIPS.find(
    (chip) =>
      comment.toLowerCase().includes(chip.label.toLowerCase()) ||
      comment.toLowerCase().includes(chip.text.toLowerCase()),
  );

  if (matchedChip) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
        <span>{matchedChip.emoji}</span>
        <span>{comment}</span>
      </span>
    );
  }

  return <span className="text-slate-700 text-xs italic">{comment}</span>;
}

export type StudentAttendanceTabProps = {
  attendanceSummary: {
    totalSessions: number;
    attendedCount: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number | null;
  };
  attendanceRecords: any[];
  isLoadingAttendance: boolean;
};

export function StudentAttendanceTab({
  attendanceSummary,
  attendanceRecords,
  isLoadingAttendance,
}: StudentAttendanceTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-slate-700" />
            <span>Sinteză Prezență & Disciplină Cursuri</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculat pe baza tuturor sesiunilor desfășurate în grupele înrolate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Rată Globală:</span>
          {attendanceSummary.attendanceRate === null ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
              Fără date
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-sm font-black border ${
                attendanceSummary.attendanceRate >= 85
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : attendanceSummary.attendanceRate >= 70
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {attendanceSummary.attendanceRate}%
            </span>
          )}
        </div>
      </div>

      {/* 4 Attendance KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Sesiuni
          </span>
          <p className="text-2xl font-black text-slate-900">{attendanceSummary.totalSessions}</p>
          <p className="text-[11px] text-slate-500">Lecții înregistrate în sistem</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Prezențe Totale
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <p className="text-2xl font-black text-emerald-700">
              {attendanceSummary.attendedCount}
            </p>
            <span className="text-xs text-emerald-600">
              ({attendanceSummary.presentCount} prezenți, {attendanceSummary.lateCount} întârzieri)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Participare activă la clasă</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Absențe Nemotivate
          </span>
          <p className="text-2xl font-black text-rose-700">{attendanceSummary.absentCount}</p>
          <p className="text-[11px] text-slate-500">Sesiuni ratate fără învoire</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
            Învoiri / Motivate
          </span>
          <p className="text-2xl font-black text-slate-900">{attendanceSummary.excusedCount}</p>
          <p className="text-[11px] text-slate-500">Absențe justificate medical/părinte</p>
        </div>
      </div>

      {/* Attendance Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Rata de participare efectivă</span>
          <span>
            {attendanceSummary.attendanceRate === null
              ? "Nicio sesiune desfășurată"
              : `${attendanceSummary.attendanceRate}%`}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          {attendanceSummary.totalSessions > 0 ? (
            <>
              <div
                style={{
                  width: `${(attendanceSummary.presentCount / attendanceSummary.totalSessions) * 100}%`,
                }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title="Prezent la timp"
              />
              <div
                style={{
                  width: `${(attendanceSummary.lateCount / attendanceSummary.totalSessions) * 100}%`,
                }}
                className="bg-amber-400 h-full transition-all duration-500"
                title="Întârziat"
              />
              <div
                style={{
                  width: `${(attendanceSummary.excusedCount / attendanceSummary.totalSessions) * 100}%`,
                }}
                className="bg-slate-400 h-full transition-all duration-500"
                title="Învoit"
              />
              <div
                style={{
                  width: `${(attendanceSummary.absentCount / attendanceSummary.totalSessions) * 100}%`,
                }}
                className="bg-rose-500 h-full transition-all duration-500"
                title="Absent"
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-100" title="Nicio sesiune înregistrată" />
          )}
        </div>
      </div>

      {/* Detailed Attendance Session Log / Timeline */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Cronologie Sesiuni de Curs & Prezență
        </h3>

        {isLoadingAttendance ? (
          <p className="text-xs text-slate-400">Se încarcă istoricul de prezență...</p>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-600">
              Nu există încă sesiuni de prezență înregistrate pentru acest elev.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prezențele vor apărea aici automat când profesorii marchează catalogul la cursuri.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="px-3.5 py-2.5">Dată Sesiune</th>
                  <th className="px-3.5 py-2.5">Curs & Nivel</th>
                  <th className="px-3.5 py-2.5">Grupă & Orar</th>
                  <th className="px-3.5 py-2.5">Sală</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Observație Profesor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.map((rec) => {
                  const sessionDateFormatted = new Date(rec.date + "T00:00:00").toLocaleDateString(
                    "ro-RO",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  );

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                        {sessionDateFormatted}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{rec.courseName}</span>
                          {getLevelBadge(rec.courseLevel)}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-700 block">{rec.groupName}</span>
                          <span className="text-[11px] text-slate-400 block">
                            {formatSchedule(rec.scheduleDays, rec.scheduleTime)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {rec.room || "Lab principal"}
                      </td>
                      <td className="px-3.5 py-2.5">{getAttendanceBadge(rec.status)}</td>
                      <td className="px-3.5 py-2.5 max-w-xs truncate">
                        {formatAbsenceComment(rec.comment)}
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
