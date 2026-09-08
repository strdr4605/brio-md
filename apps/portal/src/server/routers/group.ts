import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { groups, enrollments, groupSessions } from "@/db/schema";

export const groupRouter = router({
  list: protectedProcedure
    .input(z.object({ courseId: z.number().optional(), active: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conds = [eq(groups.schoolId, ctx.user!.schoolId!)];
      if (input?.courseId) conds.push(eq(groups.courseId, input.courseId));
      if (input?.active !== undefined) conds.push(eq(groups.active, input.active));
      return db
        .select()
        .from(groups)
        .where(and(...conds));
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const u = ctx.user!;
    const courseIds = u.courseIds ?? [];
    return db
      .select()
      .from(groups)
      .where(
        and(
          eq(groups.schoolId, u.schoolId!),
          eq(groups.active, true),
          or(
            eq(groups.teacherId, parseInt(u.id)),
            courseIds.length ? inArray(groups.courseId, courseIds) : eq(groups.teacherId, -1),
          ),
        ),
      );
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, input.id), eq(groups.schoolId, ctx.user!.schoolId!)));
    return row ?? null;
  }),

  create: adminProcedure
    .input(
      z.object({
        courseId: z.number(),
        name: z.string().min(1),
        teacherId: z.number(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(groups)
        .values({ ...input, schoolId: ctx.user!.schoolId! })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        teacherId: z.number().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(groups)
        .set(updates)
        .where(and(eq(groups.id, id), eq(groups.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const [enrCount] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.groupId, input.id))
      .limit(1);
    if (enrCount) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Grupa are elevi înscriși" });
    }
    const [sessCount] = await db
      .select({ id: groupSessions.id })
      .from(groupSessions)
      .where(eq(groupSessions.groupId, input.id))
      .limit(1);
    if (sessCount) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Grupa are lecții" });
    }
    await db
      .delete(groups)
      .where(and(eq(groups.id, input.id), eq(groups.schoolId, ctx.user!.schoolId!)));
    return { ok: true };
  }),
});
