"use client";

import { useState } from "react";
import { AttendanceStatus } from "./AttendanceCell";
import { JournalStudentItem } from "./AttendanceJournalDesktopTable";
import { PhoneIcon, XIcon, NoteIcon } from "@/components/ui/icons";

export type StudentCheckinCardProps = {
  student: JournalStudentItem;
  index: number;
  selectedDate: string;
  record?: { status: AttendanceStatus; comment: string | null };
  canEdit: boolean;
  onCellUpdate: (
    studentId: number,
    date: string,
    status: AttendanceStatus,
    comment?: string | null,
  ) => void;
};

export function StudentCheckinCard({
  student,
  index,
  selectedDate,
  record,
  canEdit,
  onCellUpdate,
}: StudentCheckinCardProps) {
  const currentStatus = record?.status || null;

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(record?.comment || "");

  const handleOpenNote = () => {
    setNoteDraft(record?.comment || "");
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    const status = currentStatus || "absent";
    onCellUpdate(student.studentId, selectedDate, status, noteDraft.trim() || null);
    setIsEditingNote(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5 transition">
      {/* Top Row: Index + Name + Age + Call Parent Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/60">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm truncate font-black text-slate-900">
                {student.studentName}
              </span>
              {student.age && (
                <span className="text-xs text-slate-400 font-normal shrink-0">
                  ({student.age} ani)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Parent Phone 1-Tap Call */}
        {Boolean(student.parentPhone) && (
          <a
            href={`tel:${student.parentPhone}`}
            title={`Sună părinte: ${student.parentName || "Familie"} (${student.parentPhone})`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/90 text-xs font-bold transition active:scale-95 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sună</span>
          </a>
        )}
      </div>

      {/* Note quote bubble if present */}
      {Boolean(record?.comment) && !isEditingNote && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs text-amber-900">
          <span className="italic inline-flex items-center gap-1.5">
            <NoteIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{record?.comment}</span>
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenNote}
              className="text-amber-700 hover:underline font-bold text-[11px] ml-2 cursor-pointer"
            >
              Modifică
            </button>
          )}
        </div>
      )}

      {/* Inline note edit form */}
      {isEditingNote && (
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Motiv absență / notă..."
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNote();
              if (e.key === "Escape") setIsEditingNote(false);
            }}
          />
          <button
            type="button"
            onClick={handleSaveNote}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-blue-700 cursor-pointer"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setIsEditingNote(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Presence Status Buttons (Touch-Optimized) */}
      <div className="pt-1">
        {canEdit ? (
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() =>
                onCellUpdate(
                  student.studentId,
                  selectedDate,
                  currentStatus === "present" ? null : "present",
                  record?.comment,
                )
              }
              className={`py-2 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                currentStatus === "present"
                  ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40"
                  : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
              }`}
            >
              <span>Prezent</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = currentStatus === "absent" ? null : "absent";
                onCellUpdate(student.studentId, selectedDate, next, record?.comment);
                if (next === "absent" && !record?.comment) {
                  handleOpenNote();
                }
              }}
              className={`py-2 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                currentStatus === "absent"
                  ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/40"
                  : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700"
              }`}
            >
              <span>Absent</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onCellUpdate(
                  student.studentId,
                  selectedDate,
                  currentStatus === "late" ? null : "late",
                  record?.comment,
                )
              }
              className={`py-2 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                currentStatus === "late"
                  ? "bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/40"
                  : "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700"
              }`}
            >
              <span>Întârziat</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNote}
              className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1 border cursor-pointer ${
                record?.comment
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Adaugă sau modifică notă"
            >
              <NoteIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{record?.comment ? "Notă ✓" : "Notă"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                currentStatus === "present"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentStatus === "absent"
                    ? "bg-rose-100 text-rose-800"
                    : currentStatus === "late"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStatus === "present" && "Prezent"}
              {currentStatus === "absent" && "Absent"}
              {currentStatus === "late" && "Întârziat"}
              {!currentStatus && "Nemarcat"}
            </span>
            {record?.comment && (
              <span className="text-xs text-slate-500 italic truncate">
                "{record.comment}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
