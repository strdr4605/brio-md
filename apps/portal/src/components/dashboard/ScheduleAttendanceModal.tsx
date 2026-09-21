"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { AttendanceSheet } from "./AttendanceSheet";
import { XIcon, CalendarIcon } from "@/components/ui/icons";

export type ScheduleAttendanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  courseName?: string | null;
  defaultDate?: string;
};

export function ScheduleAttendanceModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  courseName,
  defaultDate,
}: ScheduleAttendanceModalProps) {
  const [mounted, setMounted] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(defaultDate || todayStr);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && defaultDate) {
      setSelectedDate(defaultDate);
    }
  }, [isOpen, defaultDate]);

  const utils = trpc.useUtils();

  // 1. Fetch attendance roster for this group and date
  const { data: sheetData = [], isLoading } = trpc.attendance.getSheet.useQuery(
    {
      groupId,
      date: selectedDate,
    },
    {
      enabled: isOpen && !!groupId,
      refetchOnWindowFocus: false,
    },
  );

  // 2. Mutation to submit attendance
  const submitMutation = trpc.attendance.submit.useMutation({
    onSuccess: (data) => {
      setSaveSuccessMessage(`Prezența a fost salvată cu succes pentru ${data.count} elevi.`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
      utils.attendance.getSheet.invalidate({ groupId, date: selectedDate });
      utils.attendance.getMatrix.invalidate();
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la salvarea prezenței.");
    },
  });

  const handleSaveAttendance = (
    records: { studentId: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }[],
  ) => {
    submitMutation.mutate({
      groupId,
      date: selectedDate,
      records,
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100/80">
                {courseName || "Curs"}
              </span>
              <span className="text-xs text-slate-400 font-medium">• Catalog Lecție</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 leading-tight">{groupName}</h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Date Selector */}
            <div className="relative flex items-center">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Închide"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMessage && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fade-in shrink-0">
            <span>✅ {saveSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
              Se încarcă lista elevilor înscriși...
            </div>
          ) : (
            <AttendanceSheet
              students={sheetData}
              groupName={groupName}
              date={selectedDate}
              isSaving={submitMutation.isPending}
              onSaveAction={handleSaveAttendance}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
