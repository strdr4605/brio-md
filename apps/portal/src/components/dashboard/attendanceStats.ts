import { AttendanceStatus } from "./AttendanceCell";

export const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

export function getMonthLabel(monthStr: string): string {
  const [yStr, mStr] = monthStr.split("-");
  const mIdx = parseInt(mStr, 10) - 1;
  return `${MONTH_NAMES[mIdx] || mStr} ${yStr}`;
}

export function shiftMonth(monthStr: string, delta: number): string {
  const [yStr, mStr] = monthStr.split("-");
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + delta;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function computeStudentStats(
  students: Array<{ studentId: number }>,
  dates: Array<{ date: string }>,
  records: Record<string, { status: AttendanceStatus }>,
): Record<number, { present: number; absent: number; total: number; pct: number }> {
  const stats: Record<number, { present: number; absent: number; total: number; pct: number }> = {};
  for (const s of students) {
    let p = 0;
    let a = 0;
    let totalMarked = 0;
    for (const d of dates) {
      const rec = records[`${s.studentId}_${d.date}`];
      if (rec?.status === "present" || rec?.status === "late") {
        p += 1;
        totalMarked += 1;
      } else if (rec?.status === "absent" || rec?.status === "excused") {
        a += 1;
        totalMarked += 1;
      }
    }
    const pct = totalMarked > 0 ? Math.round((p / totalMarked) * 100) : 100;
    stats[s.studentId] = { present: p, absent: a, total: totalMarked, pct };
  }
  return stats;
}

export function computeDateTotals(
  dates: Array<{ date: string }>,
  students: Array<{ studentId: number }>,
  records: Record<string, { status: AttendanceStatus }>,
): Record<string, { present: number; absent: number }> {
  const totals: Record<string, { present: number; absent: number }> = {};
  for (const d of dates) {
    let p = 0;
    let a = 0;
    for (const s of students) {
      const rec = records[`${s.studentId}_${d.date}`];
      if (rec?.status === "present" || rec?.status === "late") p++;
      if (rec?.status === "absent" || rec?.status === "excused") a++;
    }
    totals[d.date] = { present: p, absent: a };
  }
  return totals;
}
