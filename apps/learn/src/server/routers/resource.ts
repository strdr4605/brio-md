import { router, teacherProcedure, protectedProcedure } from "../trpc";
import {
  learningResources,
  courseLearningResources,
} from "@brio-md/db";
import { and, eq, ilike, or, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";

export const resourceRouter = router({
  createLearningResource: teacherProcedure
    .input(
      z.object({
        title: z.string().min(1, "Titlul resursei este obligatoriu"),
        description: z.string().nullable().optional(),
        type: z.enum([
          "pdf",
          "manual",
          "textbook",
          "worksheet",
          "minigame",
          "link",
          "video",
          "vdr",
        ]),
        url: z.string().min(1, "URL-ul este obligatoriu"),
        schoolId: z.number().nullable().optional(),
        metadata: z
          .object({
            maxScore: z.number().optional(),
            level: z.string().optional(),
            guidelines: z.string().optional(),
            instructions: z.string().optional(),
          })
          .catchall(z.unknown())
          .nullable()
          .optional(),
        courseId: z.number().optional(),
        sessionNumber: z.number().optional(),
      }),
    )
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
          orderIndex: 0,
        });
      }

      return resource;
    }),

  getLibraryResources: teacherProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: z
            .enum([
              "all",
              "pdf",
              "manual",
              "textbook",
              "worksheet",
              "minigame",
              "link",
              "video",
              "vdr",
            ])
            .optional(),
          schoolId: z.number().optional(),
        })
        .optional(),
    )
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

  assignResourceToSession: teacherProcedure
    .input(
      z.object({
        courseId: z.number(),
        resourceId: z.number(),
        sessionNumber: z.number().nullable().optional(),
        orderIndex: z.number().default(0),
      }),
    )
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
        const [updated] = await db
          .update(courseLearningResources)
          .set({
            sessionNumber: input.sessionNumber ?? null,
            orderIndex: input.orderIndex,
          })
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
          orderIndex: input.orderIndex,
        })
        .returning();

      return created;
    }),
});
