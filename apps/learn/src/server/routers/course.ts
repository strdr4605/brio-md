import { router, protectedProcedure } from "../trpc";
import {
  courses,
  courseMaterials,
  studentCourseProgress,
  studentGroupEnrollments,
  groups,
  users,
  courseLearningResources,
  learningResources,
} from "@brio-md/db";
import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function getStudentActiveCourseIds(studentId: number): Promise<number[]> {
  // 1. Fetch group enrollments joined with groups
  const groupEnrollments = await db
    .select({
      status: studentGroupEnrollments.status,
      enrollmentCourseId: studentGroupEnrollments.courseId,
      groupCourseId: groups.courseId,
      groupActive: groups.active,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .where(eq(studentGroupEnrollments.studentId, studentId));

  const activeGroupCourseIds = new Set<number>();
  const withdrawnGroupCourseIds = new Set<number>();

  for (const enr of groupEnrollments) {
    const courseId = enr.groupCourseId ?? enr.enrollmentCourseId;
    if (!courseId) continue;

    if (enr.status === "active" && enr.groupActive !== false) {
      activeGroupCourseIds.add(courseId);
    } else {
      withdrawnGroupCourseIds.add(courseId);
    }
  }

  // 2. Fetch direct course progress
  const progressList = await db
    .select({
      courseId: studentCourseProgress.courseId,
      status: studentCourseProgress.status,
    })
    .from(studentCourseProgress)
    .where(eq(studentCourseProgress.studentId, studentId));

  const activeCourseIds = new Set<number>(activeGroupCourseIds);

  for (const prog of progressList) {
    if (prog.status === "completed") continue;
    // Withdrawing a student from a group removes that course even if progress row exists
    if (withdrawnGroupCourseIds.has(prog.courseId) && !activeGroupCourseIds.has(prog.courseId)) {
      continue;
    }
    activeCourseIds.add(prog.courseId);
  }

  return Array.from(activeCourseIds);
}

export const courseRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const currentStudentId = ctx.user.studentId;
    let courseIds: number[] = [];

    if (currentStudentId) {
      courseIds = await getStudentActiveCourseIds(currentStudentId);
    } else {
      courseIds = (ctx.user.courseIds || [])
        .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
        .filter((id) => !isNaN(id));
    }

    if (courseIds.length === 0) {
      return [];
    }

    const coursesList = await db
      .select()
      .from(courses)
      .where(and(inArray(courses.id, courseIds), eq(courses.active, true)));

    const progressList = currentStudentId
      ? await db
          .select()
          .from(studentCourseProgress)
          .where(
            and(
              inArray(studentCourseProgress.courseId, courseIds),
              eq(studentCourseProgress.studentId, currentStudentId),
            ),
          )
      : [];

    const progressByCourseId = new Map(progressList.map((p) => [p.courseId, p]));

    return coursesList.map((course) => {
      const studentProgress = progressByCourseId.get(course.id);
      return {
        ...course,
        progress: studentProgress
          ? {
              completedSessions: studentProgress.completedSessions ?? 0,
              currentSession: studentProgress.currentSession ?? 1,
              status: studentProgress.status ?? "not_started",
              notes: studentProgress.notes,
            }
          : {
              completedSessions: 0,
              currentSession: 1,
              status: "not_started",
              notes: null,
            },
      };
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const currentStudentId = ctx.user.studentId;
      let courseIds: number[] = [];

      if (currentStudentId) {
        courseIds = await getStudentActiveCourseIds(currentStudentId);
      } else {
        courseIds = (ctx.user.courseIds || [])
          .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
          .filter((id) => !isNaN(id));
      }

      const isPrivileged =
        ctx.user.role === "superadmin" ||
        ctx.user.role === "admin" ||
        ctx.user.permissions?.includes("super") ||
        ctx.user.permissions?.includes("admin");

      if (!isPrivileged && (courseIds.length === 0 || !courseIds.includes(input.id))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this course.",
        });
      }

      const [course] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);

      if (!course || (!course.active && !isPrivileged)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      let instructorName: string | null = null;
      if (course.teacherId) {
        const [teacher] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, course.teacherId))
          .limit(1);
        if (teacher) {
          instructorName = teacher.name;
        }
      }

      const materials = await db
        .select()
        .from(courseMaterials)
        .where(eq(courseMaterials.courseId, input.id))
        .orderBy(courseMaterials.orderIndex);

      let progress = null;

      if (currentStudentId) {
        const [exactProgress] = await db
          .select()
          .from(studentCourseProgress)
          .where(
            and(
              eq(studentCourseProgress.courseId, input.id),
              eq(studentCourseProgress.studentId, currentStudentId),
            ),
          )
          .limit(1);
        progress = exactProgress;
      }

      return {
        ...course,
        instructorName,
        materials,
        progress: progress
          ? {
              completedSessions: progress.completedSessions ?? 0,
              currentSession: progress.currentSession ?? 1,
              status: progress.status ?? "not_started",
              notes: progress.notes,
            }
          : {
              completedSessions: 0,
              currentSession: 1,
              status: "not_started",
              notes: null,
            },
      };
    }),

  getCourseResources: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        sessionNumber: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(courseLearningResources.courseId, input.courseId)];
      if (input.sessionNumber !== undefined) {
        conditions.push(
          eq(courseLearningResources.sessionNumber, input.sessionNumber),
        );
      }

      return db
        .select({
          id: courseLearningResources.id,
          courseId: courseLearningResources.courseId,
          resourceId: courseLearningResources.resourceId,
          sessionNumber: courseLearningResources.sessionNumber,
          orderIndex: courseLearningResources.orderIndex,
          settings: courseLearningResources.settings,
          createdAt: courseLearningResources.createdAt,
          resource: {
            id: learningResources.id,
            title: learningResources.title,
            description: learningResources.description,
            type: learningResources.type,
            url: learningResources.url,
            metadata: learningResources.metadata,
            schoolId: learningResources.schoolId,
          },
        })
        .from(courseLearningResources)
        .innerJoin(
          learningResources,
          eq(courseLearningResources.resourceId, learningResources.id),
        )
        .where(and(...conditions))
        .orderBy(courseLearningResources.orderIndex, courseLearningResources.id);
    }),
});
