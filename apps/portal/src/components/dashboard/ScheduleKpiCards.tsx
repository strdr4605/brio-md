"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  BookOpenIcon,
  DoorIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export type ScheduleKpiCardsProps = {
  totalGroups: number;
  activeRoomsCount: number;
  totalStudents: number;
  conflictSlotsCount: number;
  isLoading?: boolean;
};

export function ScheduleKpiCards({
  totalGroups,
  activeRoomsCount,
  totalStudents,
  conflictSlotsCount,
  isLoading = false,
}: ScheduleKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 sm:h-28 bg-slate-100 rounded-2xl border border-slate-200/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Grupe în Orar */}
      <MetricCard
        title="Grupe în Orar"
        value={totalGroups}
        icon={<BookOpenIcon />}
        footer="Grupe cu program alocat"
      />

      {/* 2. Săli Utilizate */}
      <MetricCard
        title="Săli Utilizate"
        value={activeRoomsCount}
        icon={<DoorIcon />}
        footer="Cabinete ocupate activ"
      />

      {/* 3. Elevi Cuprinși */}
      <MetricCard
        title="Elevi în Orar"
        value={totalStudents}
        icon={<UsersIcon />}
        footer="Total elevi cu ore stabilite"
      />

      {/* 4. Stare Săli / Conflicte */}
      <MetricCard
        title="Stare Săli"
        value={
          conflictSlotsCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-600">
              <span>{conflictSlotsCount}</span>
              <span className="text-xs font-semibold">
                {conflictSlotsCount === 1 ? "suprapunere" : "suprapuneri"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircleIcon className="w-6 h-6 shrink-0" />
              <span className="text-2xl font-bold">Optimal</span>
            </div>
          )
        }
        icon={
          conflictSlotsCount > 0 ? (
            <AlertTriangleIcon className="text-rose-600" />
          ) : (
            <CheckCircleIcon className="text-emerald-600" />
          )
        }
        footer={
          conflictSlotsCount > 0 ? (
            <span className="text-rose-600 font-semibold">Alerte de suprapunere sală</span>
          ) : (
            "Fără suprapuneri de săli"
          )
        }
      />
    </div>
  );
}
