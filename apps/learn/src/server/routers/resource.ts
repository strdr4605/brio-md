import { router, teacherProcedure, protectedProcedure, mergeRouters } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  learningResources,
  courseLearningResources,
  courses,
} from "@brio-md/db";
import { and, eq, ilike, or, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { curriculumRouter } from "./curriculum";

import {
  createResourceInputSchema,
  updateResourceInputSchema,
  getLibraryResourcesInputSchema,
} from "./resourceSchemas";

const resourceCoreRouter = router({
  createLearningResource: teacherProcedure
    .input(createResourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const effectiveSchoolId =
        input.schoolId !== undefined ? input.schoolId : ctx.user.schoolId;

      const [resource] = await db
        .insert(learningResources)
        .values({
          schoolId: effectiveSchoolId,
          title: input.title,
          description: input.description ?? null,
          type: input.type,
          url: input.url,
          metadata: input.metadata ?? null,
        })
        .returning();

      if (input.courseId) {
        await db.insert(courseLearningResources).values({
          courseId: input.courseId,
          resourceId: resource.id,
          sessionNumber: input.sessionNumber ?? null,
          orderIndex: input.orderIndex ?? 10,
        });
      }

      return resource;
    }),

  updateLearningResource: teacherProcedure
    .input(updateResourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(learningResources)
        .where(eq(learningResources.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resursa nu a fost găsită.",
        });
      }

      if (existing.schoolId && ctx.user.schoolId && existing.schoolId !== ctx.user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu aveți permisiunea de a modifica această resursă.",
        });
      }

      const currentMeta = (existing.metadata || {}) as Record<string, unknown>;
      const mergedMeta =
        input.metadata !== undefined
          ? input.metadata
            ? { ...currentMeta, ...input.metadata }
            : null
          : existing.metadata;

      const [updated] = await db
        .update(learningResources)
        .set({
          title: input.title,
          description: input.description !== undefined ? input.description : existing.description,
          type: input.type,
          url: input.url,
          metadata: mergedMeta,
          updatedAt: new Date(),
        })
        .where(eq(learningResources.id, input.id))
        .returning();

      if (input.courseId !== undefined && input.courseId !== null) {
        const [existingAssignment] = await db
          .select()
          .from(courseLearningResources)
          .where(
            and(
              eq(courseLearningResources.courseId, input.courseId),
              eq(courseLearningResources.resourceId, input.id),
            ),
          )
          .limit(1);

        if (existingAssignment) {
          await db
            .update(courseLearningResources)
            .set({
              sessionNumber: input.sessionNumber !== undefined ? input.sessionNumber : existingAssignment.sessionNumber,
              orderIndex: input.orderIndex ?? existingAssignment.orderIndex,
            })
            .where(eq(courseLearningResources.id, existingAssignment.id));
        } else {
          await db.insert(courseLearningResources).values({
            courseId: input.courseId,
            resourceId: input.id,
            sessionNumber: input.sessionNumber ?? null,
            orderIndex: input.orderIndex ?? 10,
          });
        }
      }

      return updated;
    }),

  getLibraryResources: teacherProcedure
    .input(getLibraryResourcesInputSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const filterSchoolId = input?.schoolId ?? ctx.user.schoolId;
      if (filterSchoolId) {
        conditions.push(
          or(
            eq(learningResources.schoolId, filterSchoolId),
            isNull(learningResources.schoolId),
          ),
        );
      }

      if (input?.type && input.type !== "all") {
        conditions.push(eq(learningResources.type, input.type));
      }

      if (input?.search && input.search.trim()) {
        const query = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(learningResources.title, query),
            ilike(learningResources.description, query),
          ),
        );
      }

      const results = await db
        .select()
        .from(learningResources)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(learningResources.createdAt));

      return results;
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

      const rows = await db
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

      return rows;
    }),

  getResourceAssignments: teacherProcedure.query(async ({ ctx }) => {
    const isSuper = ctx.user.role === "superadmin" || ctx.user.permissions?.includes("super");

    const query = db
      .select({
        resourceId: courseLearningResources.resourceId,
        courseId: courseLearningResources.courseId,
        courseName: courses.name,
        sessionNumber: courseLearningResources.sessionNumber,
        orderIndex: courseLearningResources.orderIndex,
      })
      .from(courseLearningResources)
      .innerJoin(courses, eq(courseLearningResources.courseId, courses.id));

    if (!isSuper && ctx.user.schoolId) {
      return query.where(eq(courses.schoolId, ctx.user.schoolId));
    }

    return query;
  }),
});

export const resourceRouter = mergeRouters(resourceCoreRouter, curriculumRouter);
