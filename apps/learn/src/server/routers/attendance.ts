import { router, teacherProcedure } from "../trpc";
import {
  studentGroupEnrollments,
  attendanceRecords,
  students,
  invoices,
  groups,
} from "@brio-md/db";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";

export const attendanceRouter = router({
  getLessonAttendance: teacherProcedure
    .input(
      z.object({
        groupId: z.number(),
        date: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const enrollments = await db
        .select({
          studentId: studentGroupEnrollments.studentId,
          enrollmentStatus: studentGroupEnrollments.status,
          groupId: studentGroupEnrollments.groupId,
          courseId: studentGroupEnrollments.courseId,
          studentName: students.name,
          studentPhone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
        })
        .from(studentGroupEnrollments)
        .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
        .where(
          and(
            eq(studentGroupEnrollments.groupId, input.groupId),
            inArray(studentGroupEnrollments.status, ["active", "restricted"]),
          ),
        );

      if (enrollments.length === 0) {
        return [];
      }

      const studentIds = enrollments.map((e) => e.studentId);

      const attendanceList = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, input.groupId),
            eq(attendanceRecords.date, input.date),
          ),
        );
      const attendanceByStudentId = new Map(
        attendanceList.map((a) => [a.studentId, a]),
      );

      const overdueInvoices = await db
        .select({
          studentId: invoices.studentId,
        })
        .from(invoices)
        .where(
          and(
            inArray(invoices.studentId, studentIds),
            eq(invoices.status, "overdue"),
          ),
        );
      const overdueStudentIds = new Set(
        overdueInvoices.map((inv) => inv.studentId),
      );

      return enrollments.map((e) => {
        const isEnrollmentRestricted = e.enrollmentStatus === "restricted";
        const hasOverdueDebt = overdueStudentIds.has(e.studentId);
        const isRestricted = isEnrollmentRestricted || hasOverdueDebt;

        let restrictionReason: string | undefined = undefined;
        if (hasOverdueDebt) {
          restrictionReason = "Restanță plată";
        } else if (isEnrollmentRestricted) {
          restrictionReason = "Cont restricționat";
        }

        const attendance = attendanceByStudentId.get(e.studentId);

        return {
          studentId: e.studentId,
          studentName: e.studentName,
          studentPhone: e.studentPhone,
          parentName: e.parentName,
          parentPhone: e.parentPhone,
          enrollmentStatus: e.enrollmentStatus,
          attendanceId: attendance?.id ?? null,
          status: attendance?.status ?? null,
          comment: attendance?.comment ?? null,
          isRestricted,
          restrictionReason,
        };
      });
    }),

  updateLessonAttendance: teacherProcedure
    .input(
      z.object({
        groupId: z.number(),
        studentId: z.number(),
        courseId: z.number().optional(),
        date: z.string(),
        status: z.enum(["present", "absent", "late", "excused"]),
        comment: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacherId = parseInt(ctx.user.id, 10);
      const now = new Date();

      const [existing] = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, input.groupId),
            eq(attendanceRecords.studentId, input.studentId),
            eq(attendanceRecords.date, input.date),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(attendanceRecords)
          .set({
            status: input.status,
            comment:
              input.comment !== undefined ? input.comment : existing.comment,
            markedByUserId: isNaN(teacherId) ? null : teacherId,
            updatedAt: now,
          })
          .where(eq(attendanceRecords.id, existing.id))
          .returning();
        return updated;
      }

      let courseId = input.courseId;
      if (!courseId) {
        const [group] = await db
          .select({ courseId: groups.courseId })
          .from(groups)
          .where(eq(groups.id, input.groupId))
          .limit(1);
        courseId = group?.courseId;
      }

      const [created] = await db
        .insert(attendanceRecords)
        .values({
          groupId: input.groupId,
          studentId: input.studentId,
          courseId: courseId ?? null,
          date: input.date,
          status: input.status,
          comment: input.comment ?? null,
          markedByUserId: isNaN(teacherId) ? null : teacherId,
        })
        .returning();

      return created;
    }),
});
