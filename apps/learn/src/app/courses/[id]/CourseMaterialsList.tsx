"use client";

export type MaterialItem = {
  id: number;
  title: string;
  type: string;
  url: string;
};

export function getMaterialTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case "worksheet":
    case "task":
      return { label: "Fișă de Lucru", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "minigame":
    case "game":
      return { label: "Minijoc Interactiv", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "pdf":
    case "manual":
    case "textbook":
      return { label: "Material / Manual", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "video":
      return { label: "Lecție Video", className: "bg-rose-50 text-rose-700 border-rose-200" };
    case "presentation":
    case "pptx":
    case "ppt":
      return { label: "Prezentare PPTX", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "link":
      return { label: "Link Web", className: "bg-sky-50 text-sky-700 border-sky-200" };
    case "file":
      return { label: "Document", className: "bg-slate-100 text-slate-700 border-slate-200" };
    default:
      return { label: type, className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export function CourseMaterialsList({ materials }: { materials: MaterialItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Materiale de Curs</h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          {materials.length} {materials.length === 1 ? "disponibil" : "disponibile"}
        </span>
      </div>

      {materials.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">
            Nu există materiale adiționale atașate acestui curs.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {materials.map((material) => {
            const badge = getMaterialTypeBadge(material.type);
            return (
              <a
                key={material.id}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition bg-white group gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.className}`}>
                    {badge.label}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition truncate">
                    {material.title}
                  </h3>
                </div>
                <div className="text-slate-400 group-hover:text-slate-700 transition shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
