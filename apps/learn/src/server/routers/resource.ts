import { router, teacherProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  learningResources,
  courseLearningResources,
  courses,
} from "@brio-md/db";
import { and, eq, ilike, or, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";

const resourceTypeSchema = z.enum(["pdf", "manual", "textbook", "worksheet", "minigame", "link", "video", "vdr"]);

const resourceMetadataSchema = z.object({
  maxScore: z.number().optional(),
  level: z.string().optional(),
  guidelines: z.string().optional(),
  instructions: z.string().optional(),
  embedUrl: z.string().optional(),
  provider: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  originalName: z.string().optional(),
}).catchall(z.unknown()).nullable().optional();

export const resourceRouter = router({
  createLearningResource: teacherProcedure
    .input(
      z.object({
        title: z.string().min(1, "Titlul resursei este obligatoriu"),
        description: z.string().nullable().optional(),
        type: resourceTypeSchema,
        url: z.string().min(1, "URL-ul este obligatoriu"),
        schoolId: z.number().nullable().optional(),
        metadata: resourceMetadataSchema,
        courseId: z.number().optional(),
        sessionNumber: z.number().optional(),
        orderIndex: z.number().optional().default(10),
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
          orderIndex: input.orderIndex ?? 10,
        });
      }

      return resource;
    }),

  updateLearningResource: teacherProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1, "Titlul resursei este obligatoriu"),
        description: z.string().nullable().optional(),
        type: resourceTypeSchema,
        url: z.string().min(1, "URL-ul este obligatoriu"),
        metadata: resourceMetadataSchema,
        courseId: z.number().nullable().optional(),
        sessionNumber: z.number().nullable().optional(),
        orderIndex: z.number().optional().default(10),
      }),
    )
    .mutation(async ({ input }) => {
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

  getResourceAssignments: teacherProcedure.query(async () => {
    const rows = await db
      .select({
        resourceId: courseLearningResources.resourceId,
        courseId: courseLearningResources.courseId,
        courseName: courses.name,
        sessionNumber: courseLearningResources.sessionNumber,
        orderIndex: courseLearningResources.orderIndex,
      })
      .from(courseLearningResources)
      .innerJoin(courses, eq(courseLearningResources.courseId, courses.id));

    return rows;
  }),
});
