import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { groupSessions, attendances, groups } from "@/db/schema";

export const groupSessionRouter = router({
  listByGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(groupSessions)
        .where(
          and(
            eq(groupSessions.groupId, input.groupId),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  listByMonth: protectedProcedure
    .input(z.object({ groupId: z.number(), year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ ctx, input }) => {
      const start = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endMonth = input.month === 12 ? 1 : input.month + 1;
      const endYear = input.month === 12 ? input.year + 1 : input.year;
      const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      return db
        .select()
        .from(groupSessions)
        .where(
          and(
            eq(groupSessions.groupId, input.groupId),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
            gte(groupSessions.date, start),
            lte(groupSessions.date, end),
          ),
        );
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(groupSessions)
      .where(and(eq(groupSessions.id, input.id), eq(groupSessions.schoolId, ctx.user!.schoolId!)));
    return row ?? null;
  }),

  create: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        teacherId: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Teacher ownership check: must be group's teacher OR have course in courseIds
      const u = ctx.user!;
      const isAdmin = u.permissions?.includes("admin") || u.permissions?.includes("super");
      if (!isAdmin) {
        const [g] = await db
          .select({ teacherId: groups.teacherId, courseId: groups.courseId })
          .from(groups)
          .where(and(eq(groups.id, input.groupId), eq(groups.schoolId, u.schoolId!)))
          .limit(1);
        if (!g) throw new TRPCError({ code: "NOT_FOUND" });
        const ownsGroup =
          g.teacherId === parseInt(u.id) || (u.courseIds ?? []).includes(g.courseId);
        if (!ownsGroup) throw new TRPCError({ code: "FORBIDDEN" });
      }
      try {
        const [row] = await db
          .insert(groupSessions)
          .values({
            groupId: input.groupId,
            schoolId: u.schoolId!,
            date: input.date,
            teacherId: input.teacherId,
            notes: input.notes,
          })
          .returning();
        return row;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "23505") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Există deja o lecție în această dată",
          });
        }
        throw e;
      }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        teacherId: z.number().nullable().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(groupSessions)
        .set(updates)
        .where(and(eq(groupSessions.id, id), eq(groupSessions.schoolId, ctx.user!.schoolId!)))
        .returning();
      return row;
    }),

  remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const existing = await db
      .select({ id: attendances.id })
      .from(attendances)
      .where(eq(attendances.groupSessionId, input.id))
      .limit(1);
    if (existing.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Șterge mai întâi prezențele",
      });
    }
    await db
      .delete(groupSessions)
      .where(and(eq(groupSessions.id, input.id), eq(groupSessions.schoolId, ctx.user!.schoolId!)));
    return { ok: true };
  }),
});
