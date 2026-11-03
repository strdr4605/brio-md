"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { StudentsIcon, BookOpenIcon } from "@/components/ui/icons";
import { useTranslation } from "@/lib/i18n";

type Props = {
  totalStudents: number;
  unenrolledCount: number;
};

export function StudentKpiCards({ totalStudents, unenrolledCount }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        title={t("students.kpiTotalTitle", "Total Studenți")}
        value={totalStudents}
        icon={<StudentsIcon />}
        footer={t("students.kpiTotalFooter", "Total elevi înregistrați")}
      />
      <MetricCard
        title={t("students.kpiUnenrolledTitle", "Fără Curs")}
        value={unenrolledCount}
        icon={<BookOpenIcon />}
        footer={t("students.kpiUnenrolledFooter", "Necesită distribuire")}
      />
    </div>
  );
}
