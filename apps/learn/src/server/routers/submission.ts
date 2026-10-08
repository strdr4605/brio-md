import { router, teacherProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import { studentResourceSubmissions } from "@brio-md/db";
import { and, eq } from "drizzle-orm";
import {
  broadcastResourceToGroupService,
  assignIndividualResourceService,
  recordStudentSubmissionService,
  bulkFinalizeLessonSubmissionsService,
  getLessonSubmissionsService,
} from "../submissionService";

export const submissionRouter = router({
  broadcastResourceToGroup: teacherProcedure
    .input(
      z.object({
        groupId: z.number(),
        courseId: z.number(),
        resourceId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return broadcastResourceToGroupService({
        groupId: input.groupId,
        courseId: input.courseId,
        resourceId: input.resourceId,
        user: ctx.user,
      });
    }),

  assignIndividualResource: teacherProcedure
    .input(
      z.object({
        studentId: z.number(),
        courseId: z.number(),
        resourceId: z.number(),
        groupId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return assignIndividualResourceService({
        studentId: input.studentId,
        courseId: input.courseId,
        resourceId: input.resourceId,
        groupId: input.groupId,
        user: ctx.user,
      });
    }),

  recordStudentSubmission: protectedProcedure
    .input(
      z.object({
        studentId: z.number().optional(),
        resourceId: z.number(),
        courseId: z.number(),
        groupId: z.number().optional(),
        score: z.number().nullable().optional(),
        maxScore: z.number().nullable().optional(),
        teacherFeedback: z.string().nullable().optional(),
        status: z
          .enum(["assigned", "in_progress", "completed", "reviewed"])
          .default("completed"),
        date: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return recordStudentSubmissionService({
        studentId: input.studentId,
        resourceId: input.resourceId,
        courseId: input.courseId,
        groupId: input.groupId,
        score: input.score,
        maxScore: input.maxScore,
        teacherFeedback: input.teacherFeedback,
        status: input.status,
        date: input.date,
        user: ctx.user,
      });
    }),

  bulkFinalizeLessonSubmissions: teacherProcedure
    .input(
      z.object({
        courseId: z.number(),
        groupId: z.number(),
        submissions: z.array(
          z.object({
            studentId: z.number(),
            resourceId: z.number(),
            score: z.number().nullable().optional(),
            maxScore: z.number().nullable().optional(),
            teacherFeedback: z.string().nullable().optional(),
            status: z
              .enum(["assigned", "in_progress", "completed", "reviewed"])
              .default("completed"),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return bulkFinalizeLessonSubmissionsService({
        courseId: input.courseId,
        groupId: input.groupId,
        submissions: input.submissions,
        user: ctx.user,
      });
    }),

  getLessonSubmissions: teacherProcedure
    .input(
      z.object({
        courseId: z.number(),
        groupId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      return getLessonSubmissionsService({
        courseId: input.courseId,
        groupId: input.groupId,
      });
    }),

  getMyCourseSubmissions: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const studentId = ctx.user.studentId;
      if (!studentId) return [];
      return db
        .select()
        .from(studentResourceSubmissions)
        .where(
          and(
            eq(studentResourceSubmissions.studentId, studentId),
            eq(studentResourceSubmissions.courseId, input.courseId),
          ),
        );
    }),
});
