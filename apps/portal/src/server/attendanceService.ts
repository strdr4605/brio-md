import { eq, and, asc } from "drizzle-orm";
import { groups, courses, students, attendanceRecords, studentGroupEnrollments, users } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import {
  assertTeacherGroupAccess,
  generateJournalDates,
  parseScheduleTimeRange,
} from "./attendanceUtils";
import { processAttendanceBilling } from "./billingService";
import { logger } from "@/lib/logger";

export async function fetchJournalData(
  groupId: number,
  monthStr: string, // YYYY-MM
  user: { id: string; role: string; permissions: string[] },
) {
  // 1. Fetch group details
  const [group] = await db
    .select({
      id: groups.id,
      name: groups.name,
      courseId: groups.courseId,
      courseName: courses.name,
      schoolId: groups.schoolId,
      room: groups.room,
      scheduleDays: groups.scheduleDays,
      scheduleTime: groups.scheduleTime,
      teacherId: groups.teacherId,
      teacherName: users.name,
    })
    .from(groups)
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .leftJoin(users, eq(groups.teacherId, users.id))
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Grupul specificat nu a fost găsit.",
    });
  }

  assertTeacherGroupAccess(group, user);

  // 2. Fetch active enrolled students
  const enrolledStudents = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentPhone: students.phone,
      parentName: students.parentName,
      parentPhone: students.parentPhone,
      age: students.age,
    })
    .from(studentGroupEnrollments)
    .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentGroupEnrollments.groupId, groupId),
        eq(studentGroupEnrollments.status, "active"),
      ),
    )
    .orderBy(asc(students.name));

  // 3. Fetch existing attendance records for this month
  // date starts with YYYY-MM
  const existingRecords = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.groupId, groupId));

  const monthRecords = existingRecords.filter((r) => r.date.startsWith(monthStr));
  const recordedDates = Array.from(new Set(monthRecords.map((r) => r.date)));

  // 4. Generate all session dates for this month
  const dates = generateJournalDates(group.scheduleDays, monthStr, recordedDates);

  // 5. Build records map: [studentId_date] -> record
  const recordsMap: Record<
    string,
    { status: "present" | "absent" | "late" | "excused"; comment: string | null }
  > = {};

  for (const r of monthRecords) {
    recordsMap[`${r.studentId}_${r.date}`] = {
      status: r.status as "present" | "absent" | "late" | "excused",
      comment: r.comment,
    };
  }

  return {
    group,
    dates,
    students: enrolledStudents,
    records: recordsMap,
  };
}

export async function executeQuickMark(
  input: {
    groupId: number;
    studentId: number;
    date: string;
    status: "present" | "absent" | "late" | "excused" | null;
    comment?: string | null;
  },
  user: { id: string; role: string; permissions: string[] },
) {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, input.groupId))
    .limit(1);

  if (!group) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Grupul nu a fost găsit." });
  }

  assertTeacherGroupAccess(group, user);

  if (input.status === null) {
    const [existingRecord] = await db
      .select({ id: attendanceRecords.id })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.groupId, input.groupId),
          eq(attendanceRecords.studentId, input.studentId),
          eq(attendanceRecords.date, input.date),
        ),
      )
      .limit(1);

    // Delete record if cleared
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.groupId, input.groupId),
          eq(attendanceRecords.studentId, input.studentId),
          eq(attendanceRecords.date, input.date),
        ),
      );

    if (existingRecord) {
      try {
        await processAttendanceBilling(
          {
            attendanceRecordId: existingRecord.id,
            studentId: input.studentId,
            groupId: input.groupId,
            date: input.date,
            status: null,
          },
          db,
        );
      } catch (error) {
        logger.error("Attendance billing trigger error on clear:", error instanceof Error ? error : { error });
      }
    }

    return { success: true, cleared: true };
  }

  const userIdNumber = Number(user.id) || null;
  const [saved] = await db
    .insert(attendanceRecords)
    .values({
      groupId: input.groupId,
      courseId: group.courseId,
      studentId: input.studentId,
      date: input.date,
      status: input.status,
      comment: input.comment || null,
      markedByUserId: userIdNumber,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        attendanceRecords.groupId,
        attendanceRecords.studentId,
        attendanceRecords.date,
      ],
      set: {
        status: input.status,
        comment: input.comment || null,
        markedByUserId: userIdNumber,
        updatedAt: new Date(),
      },
    })
    .returning();

  try {
    await processAttendanceBilling(
      {
        attendanceRecordId: saved.id,
        studentId: input.studentId,
        groupId: input.groupId,
        date: input.date,
        status: input.status,
      },
      db,
    );
  } catch (error) {
    logger.error("Attendance billing trigger error on mark:", error instanceof Error ? error : { error });
  }

  return { success: true, record: saved };
}

function getSchoolCurrentTime() {
  const timeZone = process.env.APP_TIMEZONE || "Europe/Chisinau";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const hour = parseInt(getPart("hour"), 10) || 0;
  const minute = parseInt(getPart("minute"), 10) || 0;
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const weekdayStr = getPart("weekday").toLowerCase();
  const dayKey = weekdayStr.slice(0, 3);
  const currentMinutes = hour * 60 + minute;
  const todayStr = `${year}-${month}-${day}`;

  return { currentMinutes, currentDayKey: dayKey, todayStr };
}

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
