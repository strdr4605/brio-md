"use client";

type Props = {
  studentName: string;
  studentStatus: string;
  currentSession: number;
  totalSessions: number;
  progressPercentage: number;
  currentIndex: number;
  totalStudents: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function DossierHeader({
  studentName,
  studentStatus,
  currentSession,
  totalSessions,
  progressPercentage,
  currentIndex,
  totalStudents,
  onPrev,
  onNext,
  onClose,
}: Props) {
  return (
    <div className="px-5 py-4 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
          {studentName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {studentName}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
              {studentStatus.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sesiunea activă: <strong>{currentSession} din {totalSessions}</strong> • {progressPercentage}% completat
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {/* Sequential Navigator */}
        {totalStudents > 1 && (
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 gap-1">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={onPrev}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
              title="Elevul anterior (Săgeată stânga)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[11px] font-bold text-slate-500 px-1.5 whitespace-nowrap">
              {currentIndex + 1} / {totalStudents}
            </span>
            <button
              type="button"
              disabled={currentIndex >= totalStudents - 1}
              onClick={onNext}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
              title="Elevul următor (Săgeată dreapta)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="Închide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
