"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceSheet } from "@/components/dashboard/AttendanceSheet";
import { CalendarIcon, ChevronDownIcon } from "@/components/ui/icons";

export default function AttendancePage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";
  const canAccessAttendance = isSuperOrAdmin || permissions.includes("teach") || role === "teacher";

  // Date selection (defaults to today's date in YYYY-MM-DD format)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // 1. Fetch accessible groups
  const { data: groupsList = [], isLoading: isGroupsLoading } = trpc.group.list.useQuery(undefined, {
    enabled: canAccessAttendance,
  });

  // Automatically select first group when groups are loaded
  const currentGroupId = selectedGroupId ?? (groupsList.length > 0 ? groupsList[0].id : null);
  const selectedGroup = groupsList.find((g) => g.id === currentGroupId);

  // 2. Fetch attendance sheet for current group & date
  const utils = trpc.useUtils();
  const {
    data: sheetData = [],
    isLoading: isSheetLoading,
  } = trpc.attendance.getSheet.useQuery(
    {
      groupId: currentGroupId as number,
      date: selectedDate,
    },
    {
      enabled: canAccessAttendance && !!currentGroupId,
    },
  );

  // 3. Mutation to submit attendance records
  const submitMutation = trpc.attendance.submit.useMutation({
    onSuccess: (data) => {
      setSaveSuccessMessage(`Prezența a fost salvată cu succes pentru ${data.count} elevi.`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
      utils.attendance.getSheet.invalidate({ groupId: currentGroupId as number, date: selectedDate });
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la salvarea prezenței.");
    },
  });

  const handleSaveAttendance = (
    records: { studentId: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }[],
  ) => {
    if (!currentGroupId) return;
    submitMutation.mutate({
      groupId: currentGroupId,
      date: selectedDate,
      records,
    });
  };

  if (!canAccessAttendance) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu ai permisiuni suficiente pentru a gestiona catalogul de prezență.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Catalog Prezență
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Înregistrează prezența, notează motivele absențelor și contactează părinții în 1 click.
          </p>
        </div>

        {/* Filter Bar: Group and Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Group Selector */}
          <div className="relative">
            <select
              value={currentGroupId || ""}
              onChange={(e) => {
                setSelectedGroupId(Number(e.target.value));
              }}
              disabled={isGroupsLoading || groupsList.length === 0}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs disabled:opacity-50"
            >
              {groupsList.length === 0 ? (
                <option value="">Nicio grupă disponibilă</option>
              ) : (
                groupsList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseName})
                  </option>
                ))
              )}
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
            />
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fade-in">
          <span>{saveSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Attendance Sheet */}
      {isSheetLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs animate-pulse">
          <p className="text-sm font-medium text-slate-400">Se încarcă lista elevilor...</p>
        </div>
      ) : currentGroupId ? (
        <AttendanceSheet
          students={sheetData}
          groupName={selectedGroup?.name || "Grupa"}
          date={selectedDate}
          isSaving={submitMutation.isPending}
          onSave={handleSaveAttendance}
        />
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">Selectați o grupă pentru a deschide catalogul de prezență.</p>
        </div>
      )}
    </div>
  );
}
