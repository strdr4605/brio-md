"use client";

type CurriculumOverviewBannerProps = {
  effectiveTotalSessions: number;
  plannedSessions: number;
  totalWeeks: number;
  sessionsPerWeek: number;
  totalResources: number;
  totalWorksheets: number;
  totalMinigames: number;
  syllabusCoveragePercent: number;
  scheduleDays?: string[] | null;
  onSessionsPerWeekChange: (val: number) => void;
}

export function CurriculumOverviewBanner({
  effectiveTotalSessions,
  plannedSessions,
  totalWeeks,
  sessionsPerWeek,
  totalResources,
  totalWorksheets,
  totalMinigames,
  syllabusCoveragePercent,
  scheduleDays,
  onSessionsPerWeekChange,
}: CurriculumOverviewBannerProps) {
  return (
    <div className="space-y-4">
      {/* Metric Cards Banner (Monochrome Slate First) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sesiuni
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {effectiveTotalSessions}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalWeeks} {totalWeeks === 1 ? "săptămână" : "săptămâni"} ({sessionsPerWeek} ses./săpt.)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Resurse Atașate
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalResources}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalWorksheets} fișe de lucru • {totalMinigames} minijocuri
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Acoperire Syllabus
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {syllabusCoveragePercent}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Planificat inițial: {plannedSessions} sesiuni
          </p>
        </div>
      </div>

      {/* Cadence Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="font-bold text-slate-900">Structură Curs:</span>
          <span className="text-slate-500">
            {totalWeeks} {totalWeeks === 1 ? "săptămână" : "săptămâni"} • {effectiveTotalSessions} sesiuni
          </span>
          {scheduleDays && scheduleDays.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              {scheduleDays.join(", ").toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sessions-per-week" className="text-xs font-semibold text-slate-500">
            Ritm Săptămânal:
          </label>
          <select
            id="sessions-per-week"
            value={sessionsPerWeek}
            onChange={(e) => onSessionsPerWeekChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-2.5 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition shadow-2xs"
          >
            <option value={1}>1 sesiune / săpt.</option>
            <option value={2}>2 sesiuni / săpt.</option>
            <option value={3}>3 sesiuni / săpt.</option>
            <option value={4}>4 sesiuni / săpt.</option>
          </select>
        </div>
      </div>
    </div>
  );
}
