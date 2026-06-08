import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { students, enrollments, attendances, groupSessions } from "@/db/schema";

export const studentRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(students).where(eq(students.schoolId, ctx.user!.schoolId!));
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, input.id), eq(students.schoolId, ctx.user!.schoolId!)));
    return row ?? null;
  }),

  getWithHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [student] = await db
        .select()
        .from(students)
        .where(and(eq(students.id, input.id), eq(students.schoolId, ctx.user!.schoolId!)));
      if (!student) return null;

      const enr = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.studentId, input.id), eq(enrollments.schoolId, ctx.user!.schoolId!)))
        .orderBy(desc(enrollments.startDate));

      const att = await db
        .select({
          id: attendances.id,
          status: attendances.status,
          notes: attendances.notes,
          sessionDate: groupSessions.date,
          groupId: groupSessions.groupId,
        })
        .from(attendances)
        .innerJoin(groupSessions, eq(attendances.groupSessionId, groupSessions.id))
        .where(and(eq(attendances.studentId, input.id), eq(groupSessions.schoolId, ctx.user!.schoolId!)))
        .orderBy(desc(groupSessions.date))
        .limit(90);

      return { student, enrollments: enr, attendances: att };
    }),
});
