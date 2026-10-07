"use client";

type SessionItem = {
  sessionNumber: number;
  status: "completed" | "current" | "upcoming";
};

type Props = {
  sessionsList: SessionItem[];
  total: number;
  courseStatus?: string | null;
};

export function CourseTimelineList({ sessionsList, total, courseStatus }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-8 hover:border-slate-300 transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Plan Sesiuni & Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structura progresivă a lecțiilor de la Sesiunea 1 la {total}
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0 w-fit border border-slate-200">
          Status: <span className="capitalize">{courseStatus?.replace("_", " ") || "În desfășurare"}</span>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sessionsList.map((session) => {
          const isCompleted = session.status === "completed";
          const isCurrent = session.status === "current";

          return (
            <div key={session.sessionNumber} className="relative flex items-center gap-4">
              {/* Timeline Node Bullet */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                      ? "bg-slate-900 text-white ring-slate-200"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[10px]">{session.sessionNumber}</span>
                )}
              </div>

              {/* Session Box */}
              <div
                className={`flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl border transition ${
                  isCurrent
                    ? "border-slate-400 bg-slate-50/80 shadow-xs"
                    : isCompleted
                      ? "border-emerald-100 bg-emerald-50/20"
                      : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? "text-slate-900 font-bold"
                        : isCompleted
                          ? "text-slate-800"
                          : "text-slate-600"
                    }`}
                  >
                    Sesiunea {session.sessionNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isCompleted
                      ? "Lecție finalizată"
                      : isCurrent
                        ? "Lecția activă curentă"
                        : "Sesiune programată viitoare"}
                  </p>
                </div>

                <div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Finalizată
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                      În curs
                    </span>
                  )}
                  {!isCompleted && !isCurrent && (
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      Viitoare
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
