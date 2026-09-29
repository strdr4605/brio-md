"use client";

import { useSession } from "next-auth/react";
import { ScheduleCalendar } from "@/components/dashboard/ScheduleCalendar";
import { CalendarIcon } from "@/components/ui/icons";

export default function SchedulePage() {
  const { status: authStatus } = useSession();

  if (authStatus === "loading") {
    return (
      <div className="p-6">
        <p className="text-neutral-500 text-sm">Se încarcă sesiunea...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Orar & Distribuție Săli
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Planificarea cabinetelor, a orelor și a grupelor pe săli în timp real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Schedule Grid */}
      <ScheduleCalendar />
    </div>
  );
}
