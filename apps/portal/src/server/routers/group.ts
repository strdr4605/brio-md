import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and, asc } from "drizzle-orm";
import { groups, courses, users } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

export function assertGroupAccess(
  user: { id: string; role: string; permissions: string[]; schoolId: number | null },
  schoolId?: number | null,
) {
  const permissions = user.permissions || [];
  const role = user.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";
  const isTeacher = permissions.includes("teach") || role === "teacher";

  if (!isSuper && !isAdmin && !isTeacher) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu ai permisiuni suficiente pentru a accesa grupele.",
    });
  }

  if (!isSuper && isAdmin && schoolId && user.schoolId && schoolId !== user.schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu ai acces la grupele din altă școală.",
    });
  }

  return { isSuper, isAdmin, isTeacher };
}

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Numele grupei este obligatoriu"),
  courseId: z.number().int().positive("ID-ul cursului este invalid"),
  schoolId: z.number().int().positive().optional().nullable(),
  scheduleDays: z.array(z.string()).default([]),
  scheduleTime: z.string().trim().optional().nullable(),
  room: z.string().trim().optional().nullable(),
  teacherId: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
});

export const groupRouter = router({
  // List groups (filtered by course, school, or active status)
  list: protectedProcedure
    .input(
      z
        .object({
          courseId: z.number().int().positive().optional(),
          schoolId: z.number().int().positive().optional(),
          active: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { isSuper } = assertGroupAccess(user, input?.schoolId);

      const conditions = [];

      // Enforce school isolation for non-superadmins
      if (!isSuper) {
        if (!user.schoolId) return [];
        conditions.push(eq(groups.schoolId, user.schoolId));
      } else if (input?.schoolId) {
        conditions.push(eq(groups.schoolId, input.schoolId));
      }

      if (input?.courseId) {
        conditions.push(eq(groups.courseId, input.courseId));
      }

      if (input?.active !== undefined) {
        conditions.push(eq(groups.active, input.active));
      }

      const rows = await db
        .select({
          id: groups.id,
          courseId: groups.courseId,
          courseName: courses.name,
          schoolId: groups.schoolId,
          name: groups.name,
          scheduleDays: groups.scheduleDays,
          scheduleTime: groups.scheduleTime,
          room: groups.room,
          teacherId: groups.teacherId,
          teacherName: users.name,
          active: groups.active,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        })
        .from(groups)
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(courses.name), asc(groups.name));

      return rows;
    }),

  // Create a new group
  create: protectedProcedure
    .input(createGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const permissions = user.permissions || [];
      const role = user.role;
      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";

      if (!isSuper && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Doar administratorii pot crea grupe noi.",
        });
      }

      // Verify course exists
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cursul specificat nu există.",
        });
      }

      const targetSchoolId = isSuper
        ? input.schoolId || course.schoolId
        : user.schoolId;

      const [newGroup] = await db
        .insert(groups)
        .values({
          name: input.name,
          courseId: input.courseId,
          schoolId: targetSchoolId,
          scheduleDays: input.scheduleDays,
          scheduleTime: input.scheduleTime || null,
          room: input.room || null,
          teacherId: input.teacherId || null,
          active: input.active,
        })
        .returning();

      return newGroup;
    }),
});
