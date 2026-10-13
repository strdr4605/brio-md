import { z } from "zod";
import { router, teacherProcedure } from "../trpc";
import {
  studentGroupEnrollments,
  attendanceRecords,
  students,
  invoices,
  groups,
} from "@brio-md/db";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import {
  assertCourseTeacherAccess,
  isSuperAdmin,
  isPrivilegedUser,
  getUserCourseIds,
} from "../attendanceUtils";
import {
  getLessonAttendanceService,
  markLessonAttendanceService,
  submitWorksheetService,
  finalizeLessonAttendanceService,
} from "../attendanceService";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD")
  .refine((d) => !isNaN(Date.parse(d)), "Dată calendaristică invalidă");

const commentSchema = z
  .string()
  .trim()
  .max(500, "Comentariul nu poate depăși 500 de caractere")
  .nullable()
  .optional();

export const getCourseGroupsSchema = z.object({
  courseId: z.number().int().positive(),
});

export const getLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive().optional(),
  groupId: z.number().int().positive(),
  date: z.string().optional(),
});

export const markLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  date: dateSchema,
  status: z.enum(["present", "late", "absent", "excused"]).nullable(),
  comment: commentSchema,
});

export const submitWorksheetSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  date: dateSchema.optional(),
});

export const finalizeLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive(),
  date: dateSchema,
  records: z.array(
    z.object({
      studentId: z.number().int().positive(),
      status: z.enum(["present", "late", "absent", "excused"]),
      comment: commentSchema,
    }),
  ).max(200, "Numărul maxim de înregistrări este 200"),
});

export const updateLessonAttendanceSchema = z.object({
  groupId: z.number(),
  studentId: z.number(),
  courseId: z.number().optional(),
  date: z.string(),
  status: z.enum(["present", "absent", "late", "excused"]),
  comment: z.string().nullable().optional(),
});

export const attendanceRouter = router({
  getCourseGroups: teacherProcedure
    .input(getCourseGroupsSchema)
    .query(async ({ ctx, input }) => {
      await assertCourseTeacherAccess(input.courseId, ctx.user);
      return db
        .select()
        .from(groups)
        .where(
          and(
            eq(groups.courseId, input.courseId),
            ne(groups.active, false),
          ),
        )
        .orderBy(asc(groups.name));
    }),

  getLessonAttendance: teacherProcedure
    .input(getLessonAttendanceSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<
        Awaited<ReturnType<typeof getLessonAttendanceService>> & Array<any>
      > => {
        if (input.courseId) {
          return (await getLessonAttendanceService({
            courseId: input.courseId,
            groupId: input.groupId,
            date: input.date,
            user: ctx.user,
          })) as any;
        }

        if (!input.groupId || !input.date) {
          return [] as any;
        }

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
        return [] as any;
      }

      // Authorization guard for legacy group attendance query
      const courseIdForGroup = enrollments[0].courseId;
      const isSuper = isSuperAdmin(ctx.user);
      const isPrivileged = isPrivilegedUser(ctx.user);
      if (!isSuper && !isPrivileged) {
        const userCourseIds = getUserCourseIds(ctx.user);
        const hasAccess =
          courseIdForGroup !== null &&
          (userCourseIds.includes(courseIdForGroup) ||
            Boolean(ctx.user.courseIds && ctx.user.courseIds.includes(courseIdForGroup)));
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to view attendance for this group.",
          });
        }
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
      }) as any;
    }),

  markLessonAttendance: teacherProcedure
    .input(markLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return markLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        comment: input.comment,
        user: ctx.user,
      });
    }),

  quickMark: teacherProcedure
    .input(markLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return markLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        comment: input.comment,
        user: ctx.user,
      });
    }),

  submitWorksheet: teacherProcedure
    .input(submitWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      return submitWorksheetService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        user: ctx.user,
      });
    }),

  finalizeLessonAttendance: teacherProcedure
    .input(finalizeLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return finalizeLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        date: input.date,
        records: input.records,
        user: ctx.user,
      });
    }),

  updateLessonAttendance: teacherProcedure
    .input(updateLessonAttendanceSchema)
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

      if (courseId) {
        await assertCourseTeacherAccess(courseId, ctx.user);
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
