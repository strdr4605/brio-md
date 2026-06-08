import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { enrollments } from "@/db/schema";

export const enrollmentRouter = router({
  listByStudent: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, input.studentId),
            eq(enrollments.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  listByGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.groupId, input.groupId),
            eq(enrollments.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  create: adminProcedure
    .input(
      z.object({
        studentId: z.number(),
        groupId: z.number(),
        type: z.enum(["course", "camp"]),
        price: z.number().int().nonnegative(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(enrollments)
        .values({
          ...input,
          schoolId: ctx.user!.schoolId!,
          status: "active",
        })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "cancelled", "completed"]).optional(),
        endDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        notes: z.string().optional(),
        price: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(enrollments)
        .set(updates)
        .where(and(eq(enrollments.id, id), eq(enrollments.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db
      .delete(enrollments)
      .where(and(eq(enrollments.id, input.id), eq(enrollments.schoolId, ctx.user!.schoolId!)));
    return { ok: true };
  }),
});
