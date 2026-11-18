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

export type TimeSlot = {
  key: string;
  label: string;
  startMinutes: number;
};

const NO_TIME_SLOT: TimeSlot = { key: "none", label: "Oră nestabilită", startMinutes: Infinity };

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Derives a matrix row from a group's real lesson time (e.g. "10:00-12:00" or "17:30")
export function getTimeSlot(timeStr: string | null | undefined): TimeSlot {
  const times = [...(timeStr || "").matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (times.length === 0) return NO_TIME_SLOT;
  const [start, end] = times.map((m) => `${pad(parseInt(m[1], 10))}:${m[2]}`);
  const label = end ? `${start} - ${end}` : start;
  const startMinutes = parseInt(times[0][1], 10) * 60 + parseInt(times[0][2], 10);
  return { key: label, label, startMinutes };
}

export function hasScheduleDay(group: { scheduleDays?: string[] | null }, dayKey: string) {
  return (group.scheduleDays || []).some((d) => d.toLowerCase() === dayKey.toLowerCase());
}

export function getTimeSlotsForDay(
  groups: { scheduleDays?: string[] | null; scheduleTime?: string | null }[],
  dayKey: string
): TimeSlot[] {
  const slots = new Map<string, TimeSlot>();
  groups.forEach((g) => {
    if (hasScheduleDay(g, dayKey)) {
      const slot = getTimeSlot(g.scheduleTime);
      slots.set(slot.key, slot);
    }
  });
  return [...slots.values()].sort((a, b) => a.startMinutes - b.startMinutes);
}

// Clean Monochrome Enterprise styling tokens for schedule cards
export const SCHEDULE_CARD_THEME = {
  bg: "bg-white hover:bg-slate-50",
  border: "border-slate-200/90 hover:border-slate-300",
  text: "text-slate-900",
};

export function getCourseColor(_courseId: number) {
  return SCHEDULE_CARD_THEME;
}

export function parseStartHour(timeStr: string | null | undefined): string {
  if (!timeStr) return "09:00";
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "09:00";
  const hour = parseInt(match[1], 10);
  const formattedHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;
  return HOURS.includes(formattedHour) ? formattedHour : "09:00";
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
