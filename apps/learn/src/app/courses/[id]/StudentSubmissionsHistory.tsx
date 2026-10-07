"use client";

type Submission = {
  id: number;
  resourceId: number;
  resourceTitle: string;
  resourceType: string;
  resourceUrl: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  teacherFeedback: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string | null;
};

type Props = {
  submissions: Submission[];
  isLoading?: boolean;
};

function formatSubmissionDate(dateVal: Date | string | null) {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "reviewed":
      return {
        label: "Evaluat",
        class: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "completed":
      return {
        label: "Predat",
        class: "bg-slate-100 text-slate-800 border-slate-200",
      };
    case "in_progress":
      return {
        label: "În lucru",
        class: "bg-slate-100 text-slate-700 border-slate-200",
      };
    default:
      return {
        label: "Atribuit",
        class: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

export function StudentSubmissionsHistory({ submissions, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-48" />
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-20 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Istoric Sarcini & Predări
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sarcinile predate și feedback-ul oferit de profesor
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {submissions.length} {submissions.length === 1 ? "sarcină" : "sarcini"}
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <svg
            className="w-8 h-8 mx-auto text-slate-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-xs font-medium text-slate-600">
            Nu ai predat nicio sarcină încă pentru acest curs.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Rezolvă materialele de lucru sau minijocurile interactive atribuite pentru a le preda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const badge = getStatusBadge(sub.status);
            return (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatSubmissionDate(sub.completedAt || sub.createdAt)}
                      </span>
                    </div>
                    <a
                      href={sub.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition inline-flex items-center gap-1.5"
                    >
                      {sub.resourceTitle}
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="text-right shrink-0">
                    {sub.score !== null ? (
                      <div className="inline-flex items-baseline gap-1 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-base font-extrabold text-slate-900">{sub.score}</span>
                        {sub.maxScore !== null && (
                          <span className="text-xs text-slate-500">/ {sub.maxScore}</span>
                        )}
                        <span className="text-xs font-semibold text-slate-600 ml-1">pct</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 italic">În evaluare</span>
                    )}
                  </div>
                </div>

                {sub.teacherFeedback && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Feedback profesor:
                    </div>
                    <p className="leading-relaxed pl-5">{sub.teacherFeedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
