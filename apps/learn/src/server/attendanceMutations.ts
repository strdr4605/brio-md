import { db } from "@/lib/db";
import { groups, attendanceRecords, studentCourseProgress } from "@brio-md/db";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  SessionUserInfo,
  assertCourseTeacherAccess,
  resolveGroupForCourse,
  getLocalDateString,
} from "./attendanceUtils";

async function resolveGroupOrThrow(
  courseId: number,
  groupId: number | undefined,
  userIdNumber: number | null,
  schoolId: number | null | undefined,
) {
  if (groupId) {
    const [foundGroup] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, groupId), eq(groups.courseId, courseId)))
      .limit(1);

    if (!foundGroup) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Specified group does not belong to this course.",
      });
    }
    return foundGroup;
  }

  return resolveGroupForCourse(courseId, userIdNumber, schoolId);
}

export async function markLessonAttendanceService(params: {
  courseId: number;
  groupId?: number;
  studentId: number;
  date: string;
  status: "present" | "late" | "absent" | "excused" | null;
  comment?: string | null;
  user: SessionUserInfo;
}) {
  const { courseId, studentId, date, status, comment, user } = params;
  const course = await assertCourseTeacherAccess(courseId, user);
  const userId = parseInt(user.id, 10);
  const userIdNumber = isNaN(userId) ? null : userId;

  const group = await resolveGroupOrThrow(courseId, params.groupId, userIdNumber, course.schoolId);

  if (status === null) {
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.groupId, group.id),
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.date, date),
        ),
      );
    return { success: true, cleared: true, isEligibleForAssignment: false };
  }

  const [saved] = await db
    .insert(attendanceRecords)
    .values({
      groupId: group.id,
      courseId,
      studentId,
      date,
      status,
      comment: comment || null,
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
        status,
        comment: comment || null,
        markedByUserId: userIdNumber,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    success: true,
    record: saved,
    isEligibleForAssignment: status === "present" || status === "late",
  };
}

export async function submitWorksheetService(params: {
  courseId: number;
  groupId?: number;
  studentId: number;
  date?: string;
  user: SessionUserInfo;
}) {
  const { courseId, studentId, user } = params;
  const course = await assertCourseTeacherAccess(courseId, user);
  const date = params.date || getLocalDateString();
  const userId = parseInt(user.id, 10);
  const userIdNumber = isNaN(userId) ? null : userId;

  const group = await resolveGroupOrThrow(courseId, params.groupId, userIdNumber, course.schoolId);

  const [saved] = await db
    .insert(attendanceRecords)
    .values({
      groupId: group.id,
      courseId,
      studentId,
      date,
      status: "present",
      comment: "Prezență automată la predarea fișei",
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
        status: "present",
        comment: "Prezență automată la predarea fișei",
        markedByUserId: userIdNumber,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Persist worksheet progress so it does not revert upon cache refetch
  try {
    const [existingProgress] = await db
      .select()
      .from(studentCourseProgress)
      .where(
        and(
          eq(studentCourseProgress.courseId, courseId),
          eq(studentCourseProgress.studentId, studentId),
        ),
      )
      .limit(1);

    if (existingProgress) {
      const cur = existingProgress.currentSession ?? 1;
      const comp = Math.max(existingProgress.completedSessions ?? 0, cur);
      const totalSessions = course.totalSessions || 1;
      await db
        .update(studentCourseProgress)
        .set({
          completedSessions: comp,
          status: comp >= totalSessions ? "completed" : "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(studentCourseProgress.id, existingProgress.id));
    }
  } catch {
    // Non-blocking progress update
  }

  return {
    success: true,
    record: saved,
    worksheetCompleted: true,
    status: "present" as const,
    isEligibleForAssignment: true,
  };
}

export async function finalizeLessonAttendanceService(params: {
  courseId: number;
  groupId?: number;
  date: string;
  records: Array<{
    studentId: number;
    status: "present" | "late" | "absent" | "excused";
    comment?: string | null;
  }>;
  user: SessionUserInfo;
}) {
  const { courseId, date, records, user } = params;
  const course = await assertCourseTeacherAccess(courseId, user);
  const userId = parseInt(user.id, 10);
  const userIdNumber = isNaN(userId) ? null : userId;

  const group = await resolveGroupOrThrow(courseId, params.groupId, userIdNumber, course.schoolId);

  const results = await Promise.all(
    records.map(async (rec) => {
      const [saved] = await db
        .insert(attendanceRecords)
        .values({
          groupId: group.id,
          courseId,
          studentId: rec.studentId,
          date,
          status: rec.status,
          comment: rec.comment || null,
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
            status: rec.status,
            comment: rec.comment || null,
            markedByUserId: userIdNumber,
            updatedAt: new Date(),
          },
        })
        .returning();
      return saved;
    }),
  );

  return { success: true, count: results.length, records: results };
}
