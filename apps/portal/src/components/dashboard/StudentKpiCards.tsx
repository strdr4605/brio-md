"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { StudentsIcon, BookOpenIcon } from "@/components/ui/icons";

type Props = {
  totalStudents: number;
  unenrolledCount: number;
};

export function StudentKpiCards({
  totalStudents,
  unenrolledCount,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        title="Total Studenți"
        value={totalStudents}
        icon={<StudentsIcon />}
        footer="Total elevi înregistrați"
      />
      <MetricCard
        title="Fără Curs"
        value={unenrolledCount}
        icon={<BookOpenIcon />}
        footer="Necesită distribuire"
      />
    </div>
  );
}
