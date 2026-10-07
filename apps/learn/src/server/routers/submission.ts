import { router, teacherProcedure, protectedProcedure } from "../trpc";
import {
  studentGroupEnrollments,
  studentResourceSubmissions,
  attendanceRecords,
  invoices,
} from "@brio-md/db";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";

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
      const teacherId = parseInt(ctx.user.id, 10);

      const enrollments = await db
        .select({
          studentId: studentGroupEnrollments.studentId,
        })
        .from(studentGroupEnrollments)
        .where(
          and(
            eq(studentGroupEnrollments.groupId, input.groupId),
            eq(studentGroupEnrollments.status, "active"),
          ),
        );

      if (enrollments.length === 0) {
        return { assignedCount: 0, studentIds: [] };
      }

      const assignedStudentIds: number[] = [];

      for (const enrollment of enrollments) {
        await db.insert(studentResourceSubmissions).values({
          studentId: enrollment.studentId,
          resourceId: input.resourceId,
          courseId: input.courseId,
          groupId: input.groupId,
          teacherId: isNaN(teacherId) ? null : teacherId,
          status: "assigned",
        });
        assignedStudentIds.push(enrollment.studentId);
      }

      return {
        assignedCount: assignedStudentIds.length,
        studentIds: assignedStudentIds,
      };
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
      const teacherId = parseInt(ctx.user.id, 10);

      const [submission] = await db
        .insert(studentResourceSubmissions)
        .values({
          studentId: input.studentId,
          resourceId: input.resourceId,
          courseId: input.courseId,
          groupId: input.groupId ?? null,
          teacherId: isNaN(teacherId) ? null : teacherId,
          status: "assigned",
        })
        .returning();

      return submission;
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
      let targetStudentId = input.studentId;

      if (ctx.user.role === "student") {
        if (!ctx.user.studentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Student account not linked.",
          });
        }
        targetStudentId = ctx.user.studentId;
      } else if (!targetStudentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Student ID is required.",
        });
      }

      // Guard: check if student has restricted status or overdue debt
      const [restrictedEnrollment] = await db
        .select()
        .from(studentGroupEnrollments)
        .where(
          and(
            eq(studentGroupEnrollments.studentId, targetStudentId),
            input.groupId
              ? eq(studentGroupEnrollments.groupId, input.groupId)
              : undefined,
            eq(studentGroupEnrollments.status, "restricted"),
          ),
        )
        .limit(1);

      const [overdueInvoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, targetStudentId),
            eq(invoices.status, "overdue"),
          ),
        )
        .limit(1);

      if (restrictedEnrollment || overdueInvoice) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Acces restricționat: elevul are o restanță financiară sau contul este marcat ca restricționat.",
        });
      }

      const now = new Date();
      const completedAt =
        input.status === "completed" || input.status === "reviewed"
          ? now
          : null;

      const [existingSubmission] = await db
        .select()
        .from(studentResourceSubmissions)
        .where(
          and(
            eq(studentResourceSubmissions.studentId, targetStudentId),
            eq(studentResourceSubmissions.resourceId, input.resourceId),
            eq(studentResourceSubmissions.courseId, input.courseId),
          ),
        )
        .limit(1);

      let savedSubmission;
      if (existingSubmission) {
        const [updated] = await db
          .update(studentResourceSubmissions)
          .set({
            score: input.score ?? existingSubmission.score,
            maxScore: input.maxScore ?? existingSubmission.maxScore,
            status: input.status,
            teacherFeedback: input.teacherFeedback ?? existingSubmission.teacherFeedback,
            completedAt: completedAt ?? existingSubmission.completedAt,
          })
          .where(eq(studentResourceSubmissions.id, existingSubmission.id))
          .returning();
        savedSubmission = updated;
      } else {
        const teacherId = parseInt(ctx.user.id, 10);
        const [inserted] = await db
          .insert(studentResourceSubmissions)
          .values({
            studentId: targetStudentId,
            resourceId: input.resourceId,
            courseId: input.courseId,
            groupId: input.groupId ?? null,
            teacherId: isNaN(teacherId) ? null : teacherId,
            status: input.status,
            score: input.score ?? null,
            maxScore: input.maxScore ?? null,
            teacherFeedback: input.teacherFeedback ?? null,
            completedAt,
          })
          .returning();
        savedSubmission = inserted;
      }

      // Side-effect: Automated attendance marking upon submission completion
      if (input.status === "completed") {
        let attendanceGroupId = input.groupId;

        if (!attendanceGroupId) {
          const [enrollment] = await db
            .select({ groupId: studentGroupEnrollments.groupId })
            .from(studentGroupEnrollments)
            .where(
              and(
                eq(studentGroupEnrollments.studentId, targetStudentId),
                eq(studentGroupEnrollments.courseId, input.courseId),
                eq(studentGroupEnrollments.status, "active"),
              ),
            )
            .limit(1);
          attendanceGroupId = enrollment?.groupId;
        }

        if (attendanceGroupId) {
          const today = input.date || new Date().toISOString().split("T")[0];

          const [existingAttendance] = await db
            .select()
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.groupId, attendanceGroupId),
                eq(attendanceRecords.studentId, targetStudentId),
                eq(attendanceRecords.date, today),
              ),
            )
            .limit(1);

          if (existingAttendance) {
            if (existingAttendance.status !== "present") {
              await db
                .update(attendanceRecords)
                .set({
                  status: "present",
                  updatedAt: now,
                })
                .where(eq(attendanceRecords.id, existingAttendance.id));
            }
          } else {
            await db.insert(attendanceRecords).values({
              groupId: attendanceGroupId,
              studentId: targetStudentId,
              courseId: input.courseId,
              date: today,
              status: "present",
              comment: "Prezență marcată automat la predarea sarcinii",
            });
          }
        }
      }

      return savedSubmission;
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
      const teacherId = parseInt(ctx.user.id, 10);
      const now = new Date();

      for (const sub of input.submissions) {
        const [existing] = await db
          .select()
          .from(studentResourceSubmissions)
          .where(
            and(
              eq(studentResourceSubmissions.studentId, sub.studentId),
              eq(studentResourceSubmissions.resourceId, sub.resourceId),
              eq(studentResourceSubmissions.courseId, input.courseId),
            ),
          )
          .limit(1);

        if (existing) {
          await db
            .update(studentResourceSubmissions)
            .set({
              score: sub.score ?? existing.score,
              maxScore: sub.maxScore ?? existing.maxScore,
              status: sub.status,
              teacherFeedback: sub.teacherFeedback ?? existing.teacherFeedback,
              completedAt: now,
            })
            .where(eq(studentResourceSubmissions.id, existing.id));
        } else {
          await db.insert(studentResourceSubmissions).values({
            studentId: sub.studentId,
            resourceId: sub.resourceId,
            courseId: input.courseId,
            groupId: input.groupId,
            teacherId: isNaN(teacherId) ? null : teacherId,
            status: sub.status,
            score: sub.score ?? null,
            maxScore: sub.maxScore ?? null,
            teacherFeedback: sub.teacherFeedback ?? null,
            completedAt: now,
          });
        }
      }

      return { success: true, count: input.submissions.length };
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
