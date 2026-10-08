"use client";


export function CurriculumLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-xl w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
      </div>
      <div className="h-64 bg-white rounded-2xl border border-slate-200" />
    </div>
  );
}

type CurriculumErrorBannerProps = {
  message?: string;
  onRetry: () => void;
};

export function CurriculumErrorBanner({ message, onRetry }: CurriculumErrorBannerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto shadow-2xs my-8">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold border border-rose-100">
        ⚠️
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">
        Eroare la încărcarea resurselor cursului
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {message || "Nu s-au putut prelua materialele de curs."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-2xs"
      >
        Reîncearcă
      </button>
    </div>
  );
}
