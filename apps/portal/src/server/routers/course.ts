import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { courses, courseMaterials, users } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

function assertSuperOrAdmin(ctxUser: { role: string; permissions: string[]; schoolId: number | null } | null) {
  if (!ctxUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const permissions = ctxUser.permissions || [];
  const role = ctxUser.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";

  if (!isSuper && !isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiuni suficiente." });
  }
  return { isSuper, isAdmin, user: ctxUser };
}

const materialInputSchema = z.object({
  title: z.string().min(1, "Titlul materialului este obligatoriu"),
  type: z.enum(["manual", "textbook", "link", "file"]),
  url: z.string().url("URL-ul trebuie să fie valid"),
  orderIndex: z.number().int().optional(),
});

export const courseRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          schoolId: z.number().optional(),
          active: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);

      const conditions = [];

      if (!isSuper) {
        if (!user.schoolId) {
          return [];
        }
        conditions.push(eq(courses.schoolId, user.schoolId));
      } else if (input?.schoolId) {
        conditions.push(eq(courses.schoolId, input.schoolId));
      }

      if (input?.search) {
        conditions.push(ilike(courses.name, `%${input.search}%`));
      }
      if (input?.active !== undefined) {
        conditions.push(eq(courses.active, input.active));
      }

      const result = await db
        .select({
          id: courses.id,
          name: courses.name,
          description: courses.description,
          level: courses.level,
          totalSessions: courses.totalSessions,
          sessionDurationMinutes: courses.sessionDurationMinutes,
          scheduleDays: courses.scheduleDays,
          scheduleTime: courses.scheduleTime,
          teacherId: courses.teacherId,
          teacherName: users.name,
          schoolId: courses.schoolId,
          active: courses.active,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .leftJoin(users, eq(courses.teacherId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return result;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);

      const [course] = await db
        .select({
          id: courses.id,
          name: courses.name,
          description: courses.description,
          level: courses.level,
          totalSessions: courses.totalSessions,
          sessionDurationMinutes: courses.sessionDurationMinutes,
          scheduleDays: courses.scheduleDays,
          scheduleTime: courses.scheduleTime,
          teacherId: courses.teacherId,
          teacherName: users.name,
          schoolId: courses.schoolId,
          active: courses.active,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .leftJoin(users, eq(courses.teacherId, users.id))
        .where(eq(courses.id, input.id))
        .limit(1);

      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cursul nu a fost găsit." });
      }

      if (!isSuper && course.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți vizualiza acest curs." });
      }

      const materials = await db
        .select()
        .from(courseMaterials)
        .where(eq(courseMaterials.courseId, input.id))
        .orderBy(courseMaterials.orderIndex);

      return {
        ...course,
        materials,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Numele cursului este obligatoriu"),
        description: z.string().optional().nullable(),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        totalSessions: z.number().int().min(1, "Numărul de sesiuni trebuie să fie mai mare ca 0"),
        sessionDurationMinutes: z.number().int().min(1, "Durata sesiunii trebuie să fie mai mare ca 0"),
        scheduleDays: z.array(z.string()).default([]),
        scheduleTime: z.string().optional().nullable(),
        teacherId: z.number().nullable().optional(),
        schoolId: z.number().nullable().optional(),
        active: z.boolean().default(true),
        materials: z.array(materialInputSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);
      const schoolId = isSuper ? (input.schoolId ?? user.schoolId) : user.schoolId;

      const [course] = await db
        .insert(courses)
        .values({
          name: input.name,
          description: input.description,
          level: input.level,
          totalSessions: input.totalSessions,
          sessionDurationMinutes: input.sessionDurationMinutes,
          scheduleDays: input.scheduleDays,
          scheduleTime: input.scheduleTime,
          teacherId: input.teacherId,
          schoolId,
          active: input.active,
        })
        .returning();

      if (input.materials && input.materials.length > 0) {
        await db.insert(courseMaterials).values(
          input.materials.map((m, idx) => ({
            courseId: course.id,
            title: m.title,
            type: m.type,
            url: m.url,
            orderIndex: m.orderIndex ?? idx,
          })),
        );
      }

      return course;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Numele cursului este obligatoriu").optional(),
        description: z.string().optional().nullable(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        totalSessions: z.number().int().min(1).optional(),
        sessionDurationMinutes: z.number().int().min(1).optional(),
        scheduleDays: z.array(z.string()).optional(),
        scheduleTime: z.string().optional().nullable(),
        teacherId: z.number().nullable().optional(),
        schoolId: z.number().nullable().optional(),
        active: z.boolean().optional(),
        materials: z.array(materialInputSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);

      const [existing] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cursul nu a fost găsit." });
      }

      if (!isSuper && existing.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți modifica acest curs." });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.level !== undefined) updateData.level = input.level;
      if (input.totalSessions !== undefined) updateData.totalSessions = input.totalSessions;
      if (input.sessionDurationMinutes !== undefined) updateData.sessionDurationMinutes = input.sessionDurationMinutes;
      if (input.scheduleDays !== undefined) updateData.scheduleDays = input.scheduleDays;
      if (input.scheduleTime !== undefined) updateData.scheduleTime = input.scheduleTime;
      if (input.teacherId !== undefined) updateData.teacherId = input.teacherId;
      if (input.active !== undefined) updateData.active = input.active;
      if (isSuper && input.schoolId !== undefined) updateData.schoolId = input.schoolId;

      const [updated] = await db
        .update(courses)
        .set(updateData)
        .where(eq(courses.id, input.id))
        .returning();

      if (input.materials !== undefined) {
        await db.delete(courseMaterials).where(eq(courseMaterials.courseId, input.id));
        if (input.materials.length > 0) {
          await db.insert(courseMaterials).values(
            input.materials.map((m, idx) => ({
              courseId: input.id,
              title: m.title,
              type: m.type,
              url: m.url,
              orderIndex: m.orderIndex ?? idx,
            })),
          );
        }
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);

      const [existing] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cursul nu a fost găsit." });
      }

      if (!isSuper && existing.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți șterge acest curs." });
      }

      await db.delete(courses).where(eq(courses.id, input.id));
      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.number(), active: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { isSuper, user } = assertSuperOrAdmin(ctx.user);

      const [existing] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cursul nu a fost găsit." });
      }

      if (!isSuper && existing.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți modifica acest curs." });
      }

      const nextActive = input.active !== undefined ? input.active : !existing.active;
      const [updated] = await db
        .update(courses)
        .set({ active: nextActive })
        .where(eq(courses.id, input.id))
        .returning();

      return updated;
    }),
});

