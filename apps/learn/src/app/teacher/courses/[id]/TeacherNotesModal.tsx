"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseId: number;
  studentId: number;
  initialNotes: string | null;
  currentSession: number;
  totalSessions: number;
};

const PRESET_TAGS = [
  "Отличная работа на уроке ⭐",
  "Нужно повторить ДЗ 📝",
  "Пропустил занятие ⚠️",
  "Готов к итоговому тесту 🎯",
  "Успешно сдал проект 🚀",
];

export function TeacherNotesModal({
  isOpen,
  onClose,
  studentName,
  courseId,
  studentId,
  initialNotes,
  currentSession,
  totalSessions,
}: Props) {
  const [notes, setNotes] = useState(initialNotes || "");
  const utils = trpc.useUtils();

  useEffect(() => {
    setNotes(initialNotes || "");
  }, [initialNotes, isOpen]);

  const updateMutation = trpc.teacher.updateStudentProgress.useMutation({
    onSuccess: () => {
      utils.teacher.getCourseStudentsProgress.invalidate({ courseId });
      utils.teacher.getMyCourses.invalidate();
      utils.course.invalidate();
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    if (!notes.trim()) {
      setNotes(tag);
    } else {
      setNotes((prev) => `${prev.trim()}\n${tag}`);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      courseId,
      studentId,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Student Progress Notes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {studentName} • Session {currentSession} of {totalSessions}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Quick Preset Tags */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-2">Quick feedback tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-neutral-200 text-neutral-700 transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label htmlFor="teacher-notes" className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Feedback & Comments for Student
            </label>
            <textarea
              id="teacher-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter feedback notes, homework remarks, or learning milestones..."
              className="w-full text-sm p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Visible to the student on their course timeline.
            </p>
          </div>

          {updateMutation.error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {updateMutation.error.message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
          >
            {updateMutation.isPending ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
