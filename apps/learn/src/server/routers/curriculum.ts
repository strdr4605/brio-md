import { router, teacherProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { courseLearningResources } from "@brio-md/db";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  assignResourceToSessionInputSchema,
  updateCourseResourceSettingsInputSchema,
  detachResourceFromSessionInputSchema,
  reorderSessionResourcesInputSchema,
} from "./resourceSchemas";

export const curriculumRouter = router({
  getNextCourseSession: teacherProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({ sessionNumber: courseLearningResources.sessionNumber })
        .from(courseLearningResources)
        .where(eq(courseLearningResources.courseId, input.courseId));

      const numbers = rows
        .map((r) => r.sessionNumber)
        .filter((n): n is number => n !== null && n !== undefined);

      const maxSession = numbers.length > 0 ? Math.max(...numbers) : 0;
      const uniqueExisting = Array.from(new Set(numbers)).sort((a, b) => a - b);

      return {
        nextSessionNumber: maxSession + 1,
        existingSessions: uniqueExisting,
      };
    }),

  assignResourceToSession: teacherProcedure
    .input(assignResourceToSessionInputSchema)
    .mutation(async ({ input }) => {
      const sessionCondition =
        input.sessionNumber !== undefined
          ? input.sessionNumber === null
            ? isNull(courseLearningResources.sessionNumber)
            : eq(courseLearningResources.sessionNumber, input.sessionNumber)
          : undefined;

      const whereConditions = [
        eq(courseLearningResources.courseId, input.courseId),
        eq(courseLearningResources.resourceId, input.resourceId),
      ];
      if (sessionCondition) {
        whereConditions.push(sessionCondition);
      }

      const [existing] = await db
        .select()
        .from(courseLearningResources)
        .where(and(...whereConditions))
        .limit(1);

      if (existing) {
        const updateData: Record<string, unknown> = {
          sessionNumber: input.sessionNumber ?? null,
          orderIndex: input.orderIndex ?? existing.orderIndex,
        };
        if (input.settings !== undefined) {
          updateData.settings = input.settings;
        }
        const [updated] = await db
          .update(courseLearningResources)
          .set(updateData)
          .where(eq(courseLearningResources.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(courseLearningResources)
        .values({
          courseId: input.courseId,
          resourceId: input.resourceId,
          sessionNumber: input.sessionNumber ?? null,
          orderIndex: input.orderIndex ?? 0,
          settings: input.settings ?? null,
        })
        .returning();

      return created;
    }),

  updateCourseResourceSettings: teacherProcedure
    .input(updateCourseResourceSettingsInputSchema)
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(courseLearningResources)
        .where(eq(courseLearningResources.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asignarea resursei nu a fost găsită.",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.sessionNumber !== undefined) {
        updateData.sessionNumber = input.sessionNumber;
      }
      if (input.orderIndex !== undefined) {
        updateData.orderIndex = input.orderIndex;
      }
      if (input.settings !== undefined) {
        const currentSettings = (existing.settings || {}) as Record<string, unknown>;
        updateData.settings = input.settings
          ? { ...currentSettings, ...input.settings }
          : null;
      }

      const [updated] = await db
        .update(courseLearningResources)
        .set(updateData)
        .where(eq(courseLearningResources.id, input.id))
        .returning();

      return updated;
    }),

  detachResourceFromSession: teacherProcedure
    .input(detachResourceFromSessionInputSchema)
    .mutation(async ({ input }) => {
      if (input.id !== undefined) {
        const [deleted] = await db
          .delete(courseLearningResources)
          .where(eq(courseLearningResources.id, input.id))
          .returning();
        return deleted ?? { id: input.id };
      }

      if (input.courseId !== undefined && input.resourceId !== undefined) {
        const conditions = [
          eq(courseLearningResources.courseId, input.courseId),
          eq(courseLearningResources.resourceId, input.resourceId),
        ];
        if (input.sessionNumber !== undefined) {
          conditions.push(
            input.sessionNumber === null
              ? isNull(courseLearningResources.sessionNumber)
              : eq(courseLearningResources.sessionNumber, input.sessionNumber),
          );
        }
        const [deleted] = await db
          .delete(courseLearningResources)
          .where(and(...conditions))
          .returning();
        return deleted ?? { courseId: input.courseId, resourceId: input.resourceId };
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Specificați ID-ul asignării sau courseId și resourceId.",
      });
    }),

  reorderSessionResources: teacherProcedure
    .input(reorderSessionResourcesInputSchema)
    .mutation(async ({ input }) => {
      for (const item of input.items) {
        await db
          .update(courseLearningResources)
          .set({ orderIndex: item.orderIndex })
          .where(
            and(
              eq(courseLearningResources.id, item.id),
              eq(courseLearningResources.courseId, input.courseId),
            ),
          );
      }
      return { success: true };
    }),
});
