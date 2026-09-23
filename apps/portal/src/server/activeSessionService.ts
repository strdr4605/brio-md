import { eq, and } from "drizzle-orm";
import { groups, courses, attendanceRecords } from "@/db/schema";
import { db } from "@/lib/db";
import { parseScheduleTimeRange, getSchoolCurrentTime } from "./attendanceUtils";

export async function findTeacherActiveSession(
  user: { id: string; role: string; permissions: string[] },
) {
  const userIdNumber = Number(user.id);
  if (!userIdNumber) return { activeSession: null };

  const { currentMinutes, currentDayKey, todayStr } = getSchoolCurrentTime();

  const isSuper = user.permissions?.includes("super") || user.role === "superadmin";
  const isAdmin = user.permissions?.includes("admin") || user.role === "admin";

  // Check if user has personal assigned groups
  let targetGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      courseName: courses.name,
      scheduleDays: groups.scheduleDays,
      scheduleTime: groups.scheduleTime,
      room: groups.room,
    })
    .from(groups)
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(eq(groups.teacherId, userIdNumber), eq(groups.active, true)));

  // If admin/superadmin with no assigned groups, inspect all active groups for school
  if (targetGroups.length === 0 && (isSuper || isAdmin)) {
    targetGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        courseName: courses.name,
        scheduleDays: groups.scheduleDays,
        scheduleTime: groups.scheduleTime,
        room: groups.room,
      })
      .from(groups)
      .leftJoin(courses, eq(groups.courseId, courses.id))
      .where(eq(groups.active, true));
  }

  // Filter groups scheduled today
  const todaysGroups = targetGroups.filter((g) =>
    (g.scheduleDays || []).some((d) => d.toLowerCase() === currentDayKey),
  );

  if (todaysGroups.length === 0) {
    return { activeSession: null };
  }

  let uncompletedPastSession: {
    groupId: number;
    groupName: string;
    courseName: string;
    scheduleTime: string;
    date: string;
    type: "uncompleted_past";
    endMinutes?: number;
  } | null = null;

  for (const group of todaysGroups) {
    const range = parseScheduleTimeRange(group.scheduleTime);
    if (!range) continue;

    // Check if lesson is ongoing now (+- 15 min window)
    const isInProgress =
      currentMinutes >= range.startMinutes - 15 && currentMinutes <= range.endMinutes + 15;

    if (isInProgress) {
      // Only prompt/redirect if attendance records do not already exist for today
      const existing = await db
        .select({ id: attendanceRecords.id })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, group.id),
            eq(attendanceRecords.date, todayStr),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          activeSession: {
            groupId: group.id,
            groupName: group.name,
            courseName: group.courseName || "Curs",
            scheduleTime: group.scheduleTime || "",
            date: todayStr,
            type: "in_progress",
          },
        };
      }
    }

    // Check if lesson has ended today
    const isPast = currentMinutes > range.endMinutes + 15;
    if (isPast) {
      // Check if attendance records exist for today
      const existing = await db
        .select({ id: attendanceRecords.id })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, group.id),
            eq(attendanceRecords.date, todayStr),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        if (!uncompletedPastSession || range.endMinutes > (uncompletedPastSession.endMinutes ?? 0)) {
          uncompletedPastSession = {
            groupId: group.id,
            groupName: group.name,
            courseName: group.courseName || "Curs",
            scheduleTime: group.scheduleTime || "",
            date: todayStr,
            type: "uncompleted_past",
            endMinutes: range.endMinutes,
          };
        }
      }
    }
  }

  if (uncompletedPastSession) {
    const { endMinutes: _endMinutes, ...cleanSession } = uncompletedPastSession;
    return { activeSession: cleanSession };
  }

  return { activeSession: null };
}
