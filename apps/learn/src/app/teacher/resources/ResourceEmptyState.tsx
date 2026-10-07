"use client";

type Props = {
  hasFilters: boolean;
  onResetFilters?: () => void;
  onOpenCreate?: () => void;
};

export function ResourceEmptyState({
  hasFilters,
  onResetFilters,
  onOpenCreate,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      <h4 className="text-lg font-bold text-slate-900 mb-1">
        {hasFilters
          ? "Nicio resursă găsită"
          : "Biblioteca de resurse este goală"}
      </h4>

      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
        {hasFilters
          ? "Nu am găsit materiale care să corespundă criteriilor de căutare selectate. Încearcă să resetezi filtrele."
          : "Nu a fost adăugată nicio resursă încă. Adaugă manuale, fișe de lucru, minijocuri sau videoclipuri pentru cursurile tale."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Resetează filtrele
          </button>
        )}
        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Adaugă prima resursă
          </button>
        )}
      </div>
    </div>
  );
}
