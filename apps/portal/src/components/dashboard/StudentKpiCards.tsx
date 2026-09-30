"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  StudentsIcon,
  UserCheckIcon,
  BookOpenIcon,
  SchoolIcon,
} from "@/components/ui/icons";

type Props = {
  totalStudents: number;
  enrolledCount: number;
  unenrolledCount: number;
  schoolsCount: number;
};

export function StudentKpiCards({
  totalStudents,
  enrolledCount,
  unenrolledCount,
  schoolsCount,
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
        title="Înrolați în Curs"
        value={enrolledCount}
        icon={<UserCheckIcon />}
        footer="Elevi cu grupe active"
      />
      <MetricCard
        title="Fără Curs"
        value={unenrolledCount}
        icon={<BookOpenIcon />}
        footer="Necesită distribuire"
      />
      <MetricCard
        title="Școli Active"
        value={schoolsCount}
        icon={<SchoolIcon />}
        footer="Instituții partenere"
      />
    </div>
  );
}
