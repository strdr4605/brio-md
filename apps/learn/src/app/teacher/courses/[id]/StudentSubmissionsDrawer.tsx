"use client";

import { useState } from "react";
import { Drawer } from "@brio-md/ui";
import { trpc } from "@/lib/trpc";
import { LogManualSubmissionModal } from "./LogManualSubmissionModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  studentId: number;
  studentName: string;
};

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "reviewed":
      return { label: "Evaluat", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "completed":
      return { label: "Predat", class: "bg-slate-100 text-slate-800 border-slate-200" };
    case "in_progress":
      return { label: "În lucru", class: "bg-slate-100 text-slate-700 border-slate-200" };
    default:
      return { label: "Atribuit", class: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

export function StudentSubmissionsDrawer({
  isOpen,
  onClose,
  courseId,
  studentId,
  studentName,
}: Props) {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<string>("");
  const [editMaxScore, setEditMaxScore] = useState<string>("100");
  const [editFeedback, setEditFeedback] = useState<string>("");

  const utils = trpc.useUtils();

  const { data: allSubmissions = [], isLoading } = trpc.lesson.getLessonSubmissions.useQuery(
    { courseId },
    { enabled: isOpen },
  );

  const studentSubmissions = allSubmissions.filter((s) => s.studentId === studentId);

  const recordMutation = trpc.lesson.recordStudentSubmission.useMutation({
    onSuccess: () => {
      utils.lesson.getLessonSubmissions.invalidate({ courseId });
      setEditingSubId(null);
    },
  });

  const handleStartReview = (sub: (typeof studentSubmissions)[0]) => {
    setEditingSubId(sub.id);
    setEditScore(sub.score !== null ? String(sub.score) : "");
    setEditMaxScore(sub.maxScore !== null ? String(sub.maxScore) : "100");
    setEditFeedback(sub.teacherFeedback || "");
  };

  const handleSaveReview = async (sub: (typeof studentSubmissions)[0]) => {
    const parsedScore = editScore.trim() !== "" ? parseInt(editScore, 10) : null;
    const parsedMaxScore = editMaxScore.trim() !== "" ? parseInt(editMaxScore, 10) : null;

    await recordMutation.mutateAsync({
      courseId,
      studentId,
      resourceId: sub.resourceId,
      status: "reviewed",
      score: parsedScore,
      maxScore: parsedMaxScore,
      teacherFeedback: editFeedback.trim() || undefined,
    });
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Sarcini & Evaluare: ${studentName}`}
        description={`Evidența temelor, fișelor și notelor elevului pentru cursul curent.`}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Înregistrează notă manuală
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
            >
              Închide
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ) : studentSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-slate-700">Nu există sarcini înregistrate pentru acest elev.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Poți nota o fișă fizică sau o sarcină de la clasă folosind butonul de mai jos.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                + Înregistrează notă manuală
              </button>
            </div>
          ) : (
            studentSubmissions.map((sub) => {
              const badge = getStatusBadge(sub.status);
              const isEditing = editingSubId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.class}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          {sub.resourceType}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">{sub.resourceTitle}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      {sub.score !== null ? (
                        <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 inline-block">
                          <span className="text-sm font-extrabold text-slate-900">{sub.score}</span>
                          {sub.maxScore !== null && <span className="text-xs text-slate-500">/{sub.maxScore}</span>}
                          <span className="text-[10px] text-slate-600 ml-1">pct</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Neevaluat</span>
                      )}
                    </div>
                  </div>

                  {sub.teacherFeedback && !isEditing && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-600">
                      <strong className="text-slate-700">Notă profesor: </strong>
                      {sub.teacherFeedback}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 uppercase">Notă / Scor</label>
                          <input
                            type="number"
                            value={editScore}
                            onChange={(e) => setEditScore(e.target.value)}
                            placeholder="Ex: 90"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 uppercase">Scor Max</label>
                          <input
                            type="number"
                            value={editMaxScore}
                            onChange={(e) => setEditMaxScore(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">Feedback</label>
                        <textarea
                          rows={2}
                          value={editFeedback}
                          onChange={(e) => setEditFeedback(e.target.value)}
                          placeholder="Comentarii, observații..."
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-900"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingSubId(null)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Anulează
                        </button>
                        <button
                          type="button"
                          disabled={recordMutation.isPending}
                          onClick={() => handleSaveReview(sub)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                        >
                          Salvează Nota
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                      {sub.resourceUrl ? (
                        <a
                          href={sub.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                        >
                          Vezi fișa ↗
                        </a>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartReview(sub)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        {sub.status === "reviewed" ? "Modifică nota" : "Evaluează & Notează"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Drawer>

      <LogManualSubmissionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        courseId={courseId}
        studentId={studentId}
        studentName={studentName}
      />
    </>
  );
}
