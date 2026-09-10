import { router, teacherProcedure } from "../trpc";
import { courses, studentCourseProgress, students } from "@brio-md/db";
import { and, eq, inArray, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";

function isPrivilegedUser(user: { role: string; permissions: string[] }) {
  return (
    user.role === "superadmin" ||
    user.role === "admin" ||
    user.permissions?.includes("super") ||
    user.permissions?.includes("admin")
  );
}

function getUserCourseIds(user: { courseIds: number[] }): number[] {
  return (user.courseIds || [])
    .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
    .filter((id) => !isNaN(id));
}

export const teacherRouter = router({
  getMyCourses: teacherProcedure.query(async ({ ctx }) => {
    const userId = parseInt(ctx.user.id, 10);
    const userCourseIds = getUserCourseIds(ctx.user);
    const isPrivileged = isPrivilegedUser(ctx.user);

    let teacherCourses = [];

    if (isPrivileged) {
      if (ctx.user.role === "superadmin" || ctx.user.permissions?.includes("super")) {
        teacherCourses = await db.select().from(courses);
      } else if (ctx.user.schoolId) {
        teacherCourses = await db
          .select()
          .from(courses)
          .where(eq(courses.schoolId, ctx.user.schoolId));
      } else {
        teacherCourses = await db.select().from(courses);
      }
    } else {
      if (isNaN(userId) && userCourseIds.length === 0) {
        return [];
      }

      if (!isNaN(userId) && userCourseIds.length > 0) {
        teacherCourses = await db
          .select()
          .from(courses)
          .where(
            or(
              eq(courses.teacherId, userId),
              inArray(courses.id, userCourseIds),
            ),
          );
      } else if (!isNaN(userId)) {
        teacherCourses = await db
          .select()
          .from(courses)
          .where(eq(courses.teacherId, userId));
      } else {
        teacherCourses = await db
          .select()
          .from(courses)
          .where(inArray(courses.id, userCourseIds));
      }
    }

    if (teacherCourses.length === 0) {
      return [];
    }

    const courseIds = teacherCourses.map((c) => c.id);
    const allProgress = await db
      .select()
      .from(studentCourseProgress)
      .where(inArray(studentCourseProgress.courseId, courseIds));

    const progressByCourse = new Map<number, typeof allProgress>();
    for (const p of allProgress) {
      const existing = progressByCourse.get(p.courseId) || [];
      existing.push(p);
      progressByCourse.set(p.courseId, existing);
    }

    return teacherCourses.map((course) => {
      const progressList = progressByCourse.get(course.id) || [];
      const totalStudents = progressList.length;
      const activeStudents = progressList.filter((p) => p.status === "in_progress").length;
      const completedStudents = progressList.filter((p) => p.status === "completed").length;
      const pausedStudents = progressList.filter((p) => p.status === "on_pause").length;

      let averageCompletionRate = 0;
      if (totalStudents > 0) {
        const totalPercentage = progressList.reduce((sum, p) => {
          const completed = p.completedSessions ?? 0;
          const total = course.totalSessions || 1;
          return sum + Math.min(100, Math.round((completed / total) * 100));
        }, 0);
        averageCompletionRate = Math.round(totalPercentage / totalStudents);
      }

      return {
        ...course,
        totalStudents,
        activeStudents,
        completedStudents,
        pausedStudents,
        averageCompletionRate,
      };
    });
  }),

  getCourseStudentsProgress: teacherProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = parseInt(ctx.user.id, 10);
      const userCourseIds = getUserCourseIds(ctx.user);
      const isPrivileged = isPrivilegedUser(ctx.user);

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      const isAssignedTeacher =
        (!isNaN(userId) && course.teacherId === userId) ||
        userCourseIds.includes(course.id);

      if (!isPrivileged && !isAssignedTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view students for this course.",
        });
      }

      const progressWithStudents = await db
        .select({
          progressId: studentCourseProgress.id,
          studentId: studentCourseProgress.studentId,
          courseId: studentCourseProgress.courseId,
          currentSession: studentCourseProgress.currentSession,
          completedSessions: studentCourseProgress.completedSessions,
          status: studentCourseProgress.status,
          notes: studentCourseProgress.notes,
          updatedAt: studentCourseProgress.updatedAt,
          studentName: students.name,
          studentPhone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
        })
        .from(studentCourseProgress)
        .innerJoin(students, eq(studentCourseProgress.studentId, students.id))
        .where(eq(studentCourseProgress.courseId, input.courseId));

      const total = course.totalSessions || 1;

      return {
        course: {
          id: course.id,
          name: course.name,
          description: course.description,
          level: course.level,
          totalSessions: course.totalSessions,
          sessionDurationMinutes: course.sessionDurationMinutes,
          scheduleDays: course.scheduleDays,
          scheduleTime: course.scheduleTime,
        },
        students: progressWithStudents.map((p) => {
          const completed = p.completedSessions ?? 0;
          return {
            id: p.studentId,
            progressId: p.progressId,
            name: p.studentName,
            phone: p.studentPhone,
            parentName: p.parentName,
            parentPhone: p.parentPhone,
            currentSession: p.currentSession ?? 1,
            completedSessions: completed,
            status: p.status ?? "not_started",
            notes: p.notes,
            updatedAt: p.updatedAt,
            progressPercentage: Math.min(100, Math.round((completed / total) * 100)),
          };
        }),
      };
    }),

  updateStudentProgress: teacherProcedure
    .input(
      z.object({
        courseId: z.number(),
        studentId: z.number(),
        currentSession: z.number().min(1).optional(),
        completedSessions: z.number().min(0).optional(),
        status: z
          .enum(["not_started", "in_progress", "completed", "on_pause"])
          .optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = parseInt(ctx.user.id, 10);
      const userCourseIds = getUserCourseIds(ctx.user);
      const isPrivileged = isPrivilegedUser(ctx.user);

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      const isAssignedTeacher =
        (!isNaN(userId) && course.teacherId === userId) ||
        userCourseIds.includes(course.id);

      if (!isPrivileged && !isAssignedTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update progress for this course.",
        });
      }

      const [existing] = await db
        .select()
        .from(studentCourseProgress)
        .where(
          and(
            eq(studentCourseProgress.courseId, input.courseId),
            eq(studentCourseProgress.studentId, input.studentId),
          ),
        )
        .limit(1);

      let status = input.status ?? existing?.status ?? "not_started";
      let currentSession = input.currentSession ?? existing?.currentSession ?? 1;
      let completedSessions = input.completedSessions ?? existing?.completedSessions ?? 0;

      if (input.currentSession !== undefined && input.completedSessions === undefined) {
        completedSessions = Math.min(
          course.totalSessions,
          Math.max(existing?.completedSessions ?? 0, input.currentSession - 1),
        );
      }

      if (completedSessions >= course.totalSessions || status === "completed") {
        status = "completed";
        completedSessions = course.totalSessions;
        currentSession = course.totalSessions;
      } else if (
        status === "not_started" &&
        (currentSession > 1 || completedSessions > 0)
      ) {
        status = "in_progress";
      }

      const now = new Date();

      if (existing) {
        const [updated] = await db
          .update(studentCourseProgress)
          .set({
            currentSession,
            completedSessions,
            status,
            notes: input.notes !== undefined ? input.notes : existing.notes,
            updatedAt: now,
          })
          .where(eq(studentCourseProgress.id, existing.id))
          .returning();

        return updated;
      }

      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found.",
        });
      }

      const [inserted] = await db
        .insert(studentCourseProgress)
        .values({
          courseId: input.courseId,
          studentId: input.studentId,
          currentSession,
          completedSessions,
          status,
          notes: input.notes ?? null,
          updatedAt: now,
        })
        .returning();

      return inserted;
    }),
});
