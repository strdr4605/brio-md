import { z } from "zod";
import { TRPCError } from "@trpc/server";

export function assertTeacherGroupAccess(
  group: { id: number; teacherId: number | null },
  user: { id: string; role: string; permissions: string[] },
) {
  const permissions = user.permissions || [];
  const role = user.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";

  // Admins have global permission across all groups and dates
  if (isSuper || isAdmin) {
    return { isAdmin: true };
  }

  // Teachers are only allowed for their own assigned groups
  const isTeacher = permissions.includes("teach") || role === "teacher";
  const userIdNumber = Number(user.id);

  if (isTeacher && group.teacherId === userIdNumber) {
    return { isTeacher: true, isAdmin: false };
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Profesorii au permisiunea de a gestiona prezența doar pentru grupele atribuite.",
  });
}

export const attendanceRecordItemSchema = z.object({
  studentId: z.number().int().positive(),
  status: z.enum(["present", "absent", "late", "excused"]),
  comment: z.string().optional().nullable(),
});

export const submitAttendanceSchema = z.object({
  groupId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD"),
  records: z.array(attendanceRecordItemSchema),
});

export const quickMarkSchema = z.object({
  groupId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD"),
  status: z.enum(["present", "absent", "late", "excused"]).nullable(),
  comment: z.string().optional().nullable(),
});

export const getJournalSchema = z.object({
  groupId: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formatul lunii trebuie să fie YYYY-MM").optional(),
});

export type JournalDateHeader = {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  dayLabel: string;
  shortDay: string;
  isToday: boolean;
};

const DAY_OF_WEEK_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DAY_LABELS: Record<string, { label: string; short: string }> = {
  mon: { label: "Luni", short: "L" },
  tue: { label: "Marți", short: "Ma" },
  wed: { label: "Miercuri", short: "Mi" },
  thu: { label: "Joi", short: "J" },
  fri: { label: "Vineri", short: "V" },
  sat: { label: "Sâmbătă", short: "S" },
  sun: { label: "Duminică", short: "D" },
};

/**
 * Generates all expected session dates for a group in a given month (YYYY-MM)
 * based on its scheduleDays, plus any extra dates where attendance was recorded.
 */
export function generateJournalDates(
  scheduleDays: string[] | null | undefined,
  monthStr: string, // YYYY-MM
  recordedDates: string[] = [],
): JournalDateHeader[] {
  const [yearStr, monthPart] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthPart, 10); // 1-12

  const activeDayKeys = new Set(
    (scheduleDays || []).map((d) => d.toLowerCase().trim()),
  );

  const datesSet = new Set<string>();

  // Add all scheduled dates for that month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayKey = DAY_OF_WEEK_KEYS[d.getDay()];
    if (activeDayKeys.has(dayKey)) {
      const dayFormatted = String(day).padStart(2, "0");
      const monthFormatted = String(month).padStart(2, "0");
      datesSet.add(`${year}-${monthFormatted}-${dayFormatted}`);
    }
  }

  // Also include any recorded dates in this month
  for (const recDate of recordedDates) {
    if (recDate.startsWith(monthStr)) {
      datesSet.add(recDate);
    }
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return Array.from(datesSet)
    .sort()
    .map((dateStr) => {
      const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
      const dateObj = new Date(y, m - 1, d);
      const dayKey = DAY_OF_WEEK_KEYS[dateObj.getDay()];
      const meta = DAY_LABELS[dayKey] || { label: dayKey, short: dayKey };
      return {
        date: dateStr,
        dayOfWeek: dayKey,
        dayNumber: d,
        dayLabel: meta.label,
        shortDay: meta.short,
        isToday: dateStr === todayStr,
      };
    });
}

/**
 * Parses a scheduleTime string into start & end minutes from midnight.
 * Handles "17:00 - 18:30" or "17:00". Defaults duration to 90 min.
 */
export function parseScheduleTimeRange(scheduleTime: string | null | undefined): {
  startMinutes: number;
  endMinutes: number;
} | null {
  if (!scheduleTime) return null;

  const matches = scheduleTime.match(/(\d{1,2}):(\d{2})/g);
  if (!matches || matches.length === 0) return null;

  const [h1, m1] = matches[0].split(":").map((v) => parseInt(v, 10));
  const startMinutes = h1 * 60 + m1;

  let endMinutes = startMinutes + 90; // Default 1.5h
  if (matches.length > 1) {
    const [h2, m2] = matches[1].split(":").map((v) => parseInt(v, 10));
    endMinutes = h2 * 60 + m2;
  }

  return { startMinutes, endMinutes };
}
