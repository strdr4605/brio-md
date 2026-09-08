import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { courses } from "@/db/schema";

export const courseRouter = router({
  list: protectedProcedure
    .input(z.object({ active: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conds = [eq(courses.schoolId, ctx.user!.schoolId!)];
      if (input?.active !== undefined) conds.push(eq(courses.active, input.active));
      return db
        .select()
        .from(courses)
        .where(and(...conds));
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, input.id), eq(courses.schoolId, ctx.user!.schoolId!)));
    return row ?? null;
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(courses)
        .values({ ...input, schoolId: ctx.user!.schoolId! })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(courses)
        .set(updates)
        .where(and(eq(courses.id, id), eq(courses.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
