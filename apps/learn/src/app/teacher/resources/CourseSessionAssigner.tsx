"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type CourseOption = {
  id: number;
  name: string;
};

type Props = {
  courseId: string;
  setCourseId: (val: string) => void;
  courses: CourseOption[];
  sessionNumber: string;
  setSessionNumber: (val: string) => void;
  orderIndex: number;
  setOrderIndex: (val: number) => void;
};

export function CourseSessionAssigner({
  courseId,
  setCourseId,
  courses,
  sessionNumber,
  setSessionNumber,
  orderIndex,
  setOrderIndex,
}: Props) {
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  const selectedCourseIdNum = courseId ? parseInt(courseId, 10) : null;
  const { data: sessionData } = trpc.resource.getNextCourseSession.useQuery(
    { courseId: selectedCourseIdNum! },
    { enabled: Boolean(selectedCourseIdNum) },
  );

  // Automatically pre-fill the next session number whenever a course is selected
  useEffect(() => {
    if (sessionData && !sessionNumber) {
      setSessionNumber(String(sessionData.nextSessionNumber));
    }
  }, [sessionData, sessionNumber, setSessionNumber]);

  const handleCourseChange = (val: string) => {
    setCourseId(val);
    setSessionNumber("");
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Course Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Asignează la curs (Opțional)
          </label>
          <select
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full text-sm p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Fără curs (Global în Bibliotecă)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Session Number */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Număr Sesiune {courseId && <span className="text-slate-400">(Opțional)</span>}
            </label>
            {sessionData && (
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                Următoarea: #{sessionData.nextSessionNumber}
              </span>
            )}
          </div>
          <input
            type="number"
            min={1}
            disabled={!courseId}
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
            placeholder={
              courseId
                ? sessionData
                  ? String(sessionData.nextSessionNumber)
                  : "ex. 1"
                : "Selectează un curs întâi"
            }
            className="w-full text-sm p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Session Quick-Pills (Shown when course is selected) */}
      {courseId && sessionData && (
        <div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Alege sesiune:</span>
            {sessionData.existingSessions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSessionNumber(String(s))}
                className={`px-2 py-0.5 text-[11px] rounded-lg border transition cursor-pointer ${
                  sessionNumber === String(s)
                    ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                Sesiunea {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSessionNumber(String(sessionData.nextSessionNumber))}
              className={`px-2 py-0.5 text-[11px] rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                sessionNumber === String(sessionData.nextSessionNumber)
                  ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span>+ Sesiunea {sessionData.nextSessionNumber} (Nouă ✨)</span>
            </button>
          </div>
        </div>
      )}

      {/* Ordine Afișare (Shown when course is selected) */}
      {courseId && (
        <div className="pt-2 border-t border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Ordine Afișare în Sesiune
            </label>
            <button
              type="button"
              onClick={() => setShowCustomOrder(!showCustomOrder)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              {showCustomOrder ? "Ascunde număr" : "⚙️ Număr personalizat"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Principal", desc: "La început", value: 0 },
              { label: "Standard", desc: "Implicit", value: 10 },
              { label: "La final", desc: "La sfârșit", value: 100 },
            ].map((preset) => {
              const isSelected = !showCustomOrder && orderIndex === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setShowCustomOrder(false);
                    setOrderIndex(preset.value);
                  }}
                  className={`py-2 px-2 text-center rounded-xl border text-xs transition cursor-pointer flex flex-col items-center gap-0.5 ${
                    isSelected
                      ? "bg-white border-slate-900 text-slate-900 shadow-2xs font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {showCustomOrder && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
              <label className="text-[11px] font-medium text-slate-600 shrink-0">
                Poziție numerică exactă:
              </label>
              <input
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                placeholder="1, 2, 3..."
                className="w-24 text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
