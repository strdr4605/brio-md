"use client";

export type ModuleSegment = {
  id: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
};

export type StudentModuleProgressBarProps = {
  currentModule?: number;
  totalModules?: number;
  moduleName?: string;
  className?: string;
};

export function StudentModuleProgressBar({
  currentModule = 2,
  totalModules = 4,
  moduleName = "Modul Curent",
  className = "",
}: StudentModuleProgressBarProps) {
  const clampedTotal = Math.max(1, totalModules);
  const clampedCurrent = Math.min(Math.max(1, currentModule), clampedTotal);
  const percentage = Math.round((clampedCurrent / clampedTotal) * 100);

  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Progres Curricular
          </span>
          <span className="text-sm font-bold text-slate-900">
            Modul {clampedCurrent} din {clampedTotal}
          </span>
          {moduleName && (
            <span className="text-xs text-slate-500 ml-1.5 font-medium">• {moduleName}</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 font-mono">{percentage}%</span>
          <span className="text-[11px] text-slate-500 block font-medium">Finalizat</span>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${clampedTotal}, minmax(0, 1fr))` }}>
          {Array.from({ length: clampedTotal }).map((_, idx) => {
            const moduleNum = idx + 1;
            const isCompleted = moduleNum < clampedCurrent;
            const isCurrent = moduleNum === clampedCurrent;

            return (
              <div key={idx} className="space-y-1">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCompleted
                      ? "bg-slate-900"
                      : isCurrent
                      ? "bg-slate-700"
                      : "bg-slate-100 border border-slate-200"
                  }`}
                  role="progressbar"
                  aria-valuenow={isCompleted ? 100 : isCurrent ? 50 : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Modul ${moduleNum}`}
                />
                <div className="flex items-center justify-between px-0.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      isCurrent ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    M{moduleNum}
                  </span>
                  {isCompleted && (
                    <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
