import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { attendances, enrollments, groupSessions } from "@/db/schema";

async function resolveEnrollment(
  studentId: number,
  groupId: number,
  sessionDate: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.groupId, groupId),
        eq(enrollments.status, "active"),
        lte(enrollments.startDate, sessionDate),
        or(isNull(enrollments.endDate), sql`${enrollments.endDate} >= ${sessionDate}`),
      ),
    )
    .orderBy(desc(enrollments.startDate))
    .limit(1);
  if (!row) return null;
  return row.id;
}

export const attendanceRouter = router({
  listBySession: protectedProcedure
    .input(z.object({ groupSessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [session] = await db
        .select({ schoolId: groupSessions.schoolId })
        .from(groupSessions)
        .where(eq(groupSessions.id, input.groupSessionId))
        .limit(1);
      if (!session) return [];
      if (session.schoolId !== ctx.user!.schoolId) return [];
      return db
        .select()
        .from(attendances)
        .where(eq(attendances.groupSessionId, input.groupSessionId));
    }),

  bulkSave: protectedProcedure
    .input(
      z.object({
        groupSessionId: z.number(),
        rows: z.array(
          z.object({
            studentId: z.number(),
            status: z.enum(["present", "absent"]),
            notes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [session] = await db
        .select()
        .from(groupSessions)
        .where(eq(groupSessions.id, input.groupSessionId))
        .limit(1);
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lecția nu există" });
      }
      if (session.schoolId !== ctx.user!.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const saved: number[] = [];
      const rejected: Array<{ studentId: number; reason: string }> = [];

      for (const row of input.rows) {
        const enrollmentId = await resolveEnrollment(row.studentId, session.groupId, session.date);
        if (!enrollmentId) {
          rejected.push({ studentId: row.studentId, reason: "no_active_enrollment" });
          continue;
        }
        const [result] = await db
          .insert(attendances)
          .values({
            groupSessionId: input.groupSessionId,
            studentId: row.studentId,
            enrollmentId,
            status: row.status,
            notes: row.notes,
          })
          .onConflictDoUpdate({
            target: [attendances.groupSessionId, attendances.studentId],
            set: { status: row.status, notes: row.notes },
          })
          .returning();
        saved.push(result.id);
      }
      return { saved: saved.length, rejected };
    }),
});
