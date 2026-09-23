import { eq, and, asc } from "drizzle-orm";
import { groups, courses, students, attendanceRecords, studentGroupEnrollments, users } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import {
  assertTeacherGroupAccess,
  generateJournalDates,
} from "./attendanceUtils";
import { processAttendanceBilling } from "./lessonBillingService";
import { logger } from "@/lib/logger";

export { findTeacherActiveSession } from "./activeSessionService";

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
      } catch (err) {
        logger.error(
          "[attendanceService] processAttendanceBilling removal error:",
          err instanceof Error ? err : { error: String(err) },
        );
      }
    }

    // Delete record if cleared after billing item has been processed
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.groupId, input.groupId),
          eq(attendanceRecords.studentId, input.studentId),
          eq(attendanceRecords.date, input.date),
        ),
      );

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
  } catch (err) {
    logger.error(
      "[attendanceService] processAttendanceBilling error:",
      err instanceof Error ? err : { error: String(err) },
    );
  }

  return { success: true, record: saved };
}
