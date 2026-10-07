"use client";

type ResourceItem = {
  id: number;
  schoolId: number | null;
  title: string;
  description: string | null;
  type: string;
  url: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

type AssignmentItem = {
  resourceId: number;
  courseId: number;
  courseName: string;
  sessionNumber: number | null;
};

type Props = {
  resources: ResourceItem[];
  assignments?: AssignmentItem[];
  onPreview: (resource: ResourceItem) => void;
  onUseInCourse: (resource: ResourceItem) => void;
  onEdit?: (resource: ResourceItem) => void;
};

function getTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case "worksheet":
      return {
        label: "Fișă & Practică",
        className: "bg-slate-100 text-slate-700 border-slate-200/80",
        icon: "✍️",
      };
    case "manual":
    case "textbook":
    case "pdf":
      return {
        label: "Lectură & Teorie",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "📖",
      };
    case "video":
    case "vdr":
      return {
        label: "Lecție Video",
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "🎥",
      };
    case "minigame":
    case "link":
    default:
      return {
        label: "Joc & Interactiv",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🎮",
      };
  }
}

export function TeacherResourceGrid({
  resources,
  assignments = [],
  onPreview,
  onUseInCourse,
  onEdit,
}: Props) {
  const assignmentsByResource = new Map<number, AssignmentItem[]>();
  for (const a of assignments) {
    const list = assignmentsByResource.get(a.resourceId) || [];
    list.push(a);
    assignmentsByResource.set(a.resourceId, list);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {resources.map((res) => {
        const badge = getTypeBadge(res.type);
        const assignedCourses = assignmentsByResource.get(res.id) || [];
        const meta = (res.metadata || {}) as Record<string, unknown>;
        const level = typeof meta.level === "string" ? meta.level : null;
        const maxScore = typeof meta.maxScore === "number" ? meta.maxScore : null;

        return (
          <div
            key={res.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
          >
            <div>
              {/* Type Badge & Metadata Top */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {level && (
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      Nivel {level}
                    </span>
                  )}

                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(res)}
                      title="Editează resursa didactică"
                      aria-label={`Editează ${res.title}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-slate-500 hover:text-slate-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                {res.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                {res.description || "Resursă educațională cross-course disponibilă pentru activități didactice."}
              </p>

              {/* Supported Courses Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Cursuri asignate:</span>
                  {maxScore && (
                    <span className="text-emerald-700 font-medium">Max: {maxScore} pct</span>
                  )}
                </div>

                {assignedCourses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Disponibil global (neasociat la un curs specific)
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {assignedCourses.slice(0, 2).map((ac, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 truncate max-w-[200px]"
                        title={ac.courseName}
                      >
                        {ac.courseName}
                        {ac.sessionNumber ? ` (Ses. ${ac.sessionNumber})` : ""}
                      </span>
                    ))}
                    {assignedCourses.length > 2 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        +{assignedCourses.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPreview(res)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Previzualizare</span>
              </button>

              {assignedCourses.length > 0 ? (
                <button
                  type="button"
                  disabled
                  title="Resursa este deja asignată la curs."
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/90 shadow-2xs select-none cursor-default"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Asignat</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onUseInCourse(res)}
                  title="Asignează la un curs."
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition cursor-pointer"
                >
                  <span>+</span>
                  <span>Asignează</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
