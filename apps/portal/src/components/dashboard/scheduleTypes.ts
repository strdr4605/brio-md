export const DAYS_OF_WEEK = [
  { key: "mon", label: "Luni", short: "Luni" },
  { key: "tue", label: "Marți", short: "Marți" },
  { key: "wed", label: "Miercuri", short: "Miercuri" },
  { key: "thu", label: "Joi", short: "Joi" },
  { key: "fri", label: "Vineri", short: "Vineri" },
  { key: "sat", label: "Sâmbătă", short: "Sâmbătă" },
  { key: "sun", label: "Duminică", short: "Duminică" },
];

export const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
];

export type AcademicPair = {
  index: number;
  label: string;
  startMinutes: number;
  endMinutes: number;
};

// Standard Academic Pairs
export const ACADEMIC_PAIRS: AcademicPair[] = [
  { index: 1, label: "08:00 - 09:30", startMinutes: 8 * 60, endMinutes: 9 * 60 + 30 },
  { index: 2, label: "09:45 - 11:15", startMinutes: 9 * 60 + 45, endMinutes: 11 * 60 + 15 },
  { index: 3, label: "11:30 - 13:00", startMinutes: 11 * 60 + 30, endMinutes: 13 * 60 },
  { index: 4, label: "13:30 - 15:00", startMinutes: 13 * 60 + 30, endMinutes: 15 * 60 },
  { index: 5, label: "15:15 - 16:45", startMinutes: 15 * 60 + 15, endMinutes: 16 * 60 + 45 },
  { index: 6, label: "17:00 - 18:30", startMinutes: 17 * 60, endMinutes: 18 * 60 + 30 },
  { index: 7, label: "18:45 - 20:15", startMinutes: 18 * 60 + 45, endMinutes: 20 * 60 + 15 },
];

export const COLOR_PALETTES = [
  { bg: "bg-blue-50 hover:bg-blue-100/90", border: "border-blue-200", text: "text-blue-900" },
  { bg: "bg-emerald-50 hover:bg-emerald-100/90", border: "border-emerald-200", text: "text-emerald-900" },
  { bg: "bg-purple-50 hover:bg-purple-100/90", border: "border-purple-200", text: "text-purple-900" },
  { bg: "bg-amber-50 hover:bg-amber-100/90", border: "border-amber-200", text: "text-amber-900" },
  { bg: "bg-rose-50 hover:bg-rose-100/90", border: "border-rose-200", text: "text-rose-900" },
  { bg: "bg-indigo-50 hover:bg-indigo-100/90", border: "border-indigo-200", text: "text-indigo-900" },
];

export function getCourseColor(courseId: number) {
  return COLOR_PALETTES[courseId % COLOR_PALETTES.length];
}

export function parseStartHour(timeStr: string | null | undefined): string {
  if (!timeStr) return "09:00";
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "09:00";
  const hour = parseInt(match[1], 10);
  const formattedHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;
  return HOURS.includes(formattedHour) ? formattedHour : "09:00";
}

export function matchAcademicPairIndex(timeStr: string | null | undefined): number {
  if (!timeStr) return 1;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 1;
  const minutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);

  let closestIndex = 1;
  let minDiff = Infinity;

  ACADEMIC_PAIRS.forEach((pair) => {
    const diff = Math.abs(pair.startMinutes - minutes);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = pair.index;
    }
  });

  return closestIndex;
}

export function getOccupiedPairIndicesForDay(
  groups: { scheduleDays?: string[] | null; scheduleTime?: string | null }[],
  dayKey: string
): Set<number> {
  const indices = new Set<number>();
  groups.forEach((g) => {
    const hasDay = (g.scheduleDays || []).some((d) => d.toLowerCase() === dayKey.toLowerCase());
    if (hasDay && g.scheduleTime) {
      indices.add(matchAcademicPairIndex(g.scheduleTime));
    }
  });
  return indices;
}

export function getOccupiedHoursForDay(
  groups: { scheduleDays?: string[] | null; scheduleTime?: string | null }[],
  dayKey?: string
): Set<string> {
  const hours = new Set<string>();
  groups.forEach((g) => {
    if (!dayKey || (g.scheduleDays || []).some((d) => d.toLowerCase() === dayKey.toLowerCase())) {
      if (g.scheduleTime) {
        hours.add(parseStartHour(g.scheduleTime));
      }
    }
  });
  return hours;
}
