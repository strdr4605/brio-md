"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GroupItem } from "./GroupFormModal";
import {
  XIcon,
  CalendarIcon,
  DoorIcon,
  UsersIcon,
  BookOpenIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

type ScheduleEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  group: GroupItem | null;
  hasConflict?: boolean;
  conflictDetails?: string;
  currentUserId?: number | null;
  isSuperOrAdmin?: boolean;
  onOpenEdit?: (group: GroupItem) => void;
  onOpenRoster?: (group: GroupItem) => void;
};

const DAY_LABELS: Record<string, string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

function formatSchedule(days: string[] | null | undefined, time: string | null | undefined) {
  const daysText =
    days && days.length > 0
      ? days.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : null;

  if (daysText && time) return `${daysText} • ${time}`;
  return daysText || time || "Fără program stabilit";
}

export function ScheduleEventModal({
  isOpen,
  onClose,
  group,
  hasConflict,
  conflictDetails,
  currentUserId,
  isSuperOrAdmin = false,
  onOpenEdit,
  onOpenRoster,
}: ScheduleEventModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !group || !mounted) return null;

  const isAssignedTeacher = Boolean(
    currentUserId && group.teacherId && group.teacherId === currentUserId
  );
  const canManage = isSuperOrAdmin || isAssignedTeacher;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100 bg-neutral-50/70">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {group.courseName || "Curs"}
              </span>
              {isAssignedTeacher && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheckIcon className="w-3 h-3" />
                  Grupa Ta
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{group.name}</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-200 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm text-neutral-700">
          {/* Conflict Alert if any */}
          {hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <span className="font-semibold block">Atenție: Suprapunere în sală!</span>
                <span>{conflictDetails || "Această sală este programată concomitent pentru alt curs."}</span>
              </div>
            </div>
          )}

          {/* Details list */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            {/* Schedule */}
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <div className="text-[11px] text-neutral-400 font-semibold uppercase">Orar & Zile</div>
                <div className="font-medium text-neutral-900">
                  {formatSchedule(group.scheduleDays, group.scheduleTime)}
                </div>
              </div>
            </div>

            {/* Room */}
            <div className="flex items-center gap-3">
              <DoorIcon className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <div className="text-[11px] text-neutral-400 font-semibold uppercase">Sală / Cabinet</div>
                <div className="font-medium text-neutral-900">
                  {group.room || <span className="text-neutral-400 italic">Sală nespecificată</span>}
                </div>
              </div>
            </div>

            {/* Teacher */}
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                P
              </div>
              <div>
                <div className="text-[11px] text-neutral-400 font-semibold uppercase">Profesor Asignat</div>
                <div className="font-medium text-neutral-900">
                  {group.teacherName || <span className="text-neutral-400 italic">Neasignat</span>}
                </div>
              </div>
            </div>

            {/* Student Count */}
            <div className="flex items-center gap-3">
              <UsersIcon className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <div className="text-[11px] text-neutral-400 font-semibold uppercase">Înscrieri Active</div>
                <div className="font-semibold text-blue-700">
                  {group.studentCount ?? 0} elevi înscriși
                </div>
              </div>
            </div>
          </div>

          {/* Permission Notice */}
          {!canManage && (
            <div className="p-3 bg-neutral-100 rounded-xl text-xs text-neutral-600">
              ℹ️ Mod vizualizare. Doar profesorul asignat acestei grupe sau administratorii au acces la modificarea setărilor.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-col gap-2">
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenEdit?.(group);
                  onClose();
                }}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition text-center"
              >
                Editează Grupa / Setări
              </button>
              {onOpenRoster && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenRoster(group);
                    onClose();
                  }}
                  className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>Elevi</span>
                </button>
              )}
            </div>
          )}

          <Link
            href={`/dashboard/courses/${group.courseId}`}
            onClick={onClose}
            className="w-full py-2 px-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Vezi Pagina Cursului</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
