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
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Orar & Distribuție Săli</h1>
              <p className="text-xs sm:text-sm text-neutral-500">
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
