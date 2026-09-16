import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and, asc, sql } from "drizzle-orm";
import { groups, courses, users, studentGroupEnrollments } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { checkGroupConflicts } from "../conflictChecker";

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
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiuni suficiente pentru a accesa grupele." });
  }
  if (!isSuper && isAdmin && schoolId && user.schoolId && schoolId !== user.schoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai acces la grupele din altă școală." });
  }
  return { isSuper, isAdmin, isTeacher };
}

const studentCountSql = sql<number>`COALESCE((
  SELECT cast(count(*) as int) FROM ${studentGroupEnrollments}
  WHERE ${studentGroupEnrollments.groupId} = ${groups.id} AND ${studentGroupEnrollments.status} = 'active'
), 0)`.as("student_count");

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

export const updateGroupSchema = z.object({
  id: z.number().int().positive("ID invalid"),
  name: z.string().trim().min(1, "Numele grupei este obligatoriu"),
  scheduleDays: z.array(z.string()).default([]),
  scheduleTime: z.string().trim().optional().nullable(),
  room: z.string().trim().optional().nullable(),
  teacherId: z.number().int().positive().optional().nullable(),
  active: z.boolean().optional(),
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
          studentCount: studentCountSql,
        })
        .from(groups)
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(courses.name), asc(groups.name));

      return rows;
    }),

  // Get single group by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [row] = await db
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
          studentCount: studentCountSql,
        })
        .from(groups)
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(eq(groups.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupa specificată nu a fost găsită.",
        });
      }

      assertGroupAccess(user, row.schoolId);

      return row;
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

      const targetSchoolId = isSuper ? input.schoolId || course.schoolId : user.schoolId;

      await checkGroupConflicts(db, {
        schoolId: targetSchoolId,
        courseId: input.courseId,
        name: input.name,
        room: input.room,
        teacherId: input.teacherId,
        scheduleDays: input.scheduleDays,
        scheduleTime: input.scheduleTime,
      });

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

  // Update an existing group
  update: protectedProcedure
    .input(updateGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [existing] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupa specificată nu există.",
        });
      }

      const permissions = user.permissions || [];
      const role = user.role;
      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";
      const isAssignedTeacher =
        isTeacher &&
        (existing.teacherId === parseInt(user.id) ||
          Boolean(user.courseIds?.includes(existing.courseId)));

      if (!isSuper && !isAdmin && !isAssignedTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Doar administratorii sau profesorul alocat pot modifica această grupă.",
        });
      }

      if (!isSuper && user.schoolId && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiunea de a modifica o grupă din altă școală.",
        });
      }

      await checkGroupConflicts(db, {
        schoolId: existing.schoolId,
        excludeGroupId: input.id,
        courseId: existing.courseId,
        name: input.name,
        room: input.room,
        teacherId: input.teacherId,
        scheduleDays: input.scheduleDays,
        scheduleTime: input.scheduleTime,
      });

      const [updated] = await db
        .update(groups)
        .set({
          name: input.name,
          scheduleDays: input.scheduleDays,
          scheduleTime: input.scheduleTime || null,
          room: input.room || null,
          teacherId: input.teacherId || null,
          active: input.active !== undefined ? input.active : existing.active,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, input.id))
        .returning();

      return updated;
    }),

  // Toggle active / archive group action
  toggleActive: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        active: z.boolean(),
      }),
    )
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
          message: "Doar administratorii pot activa sau arhiva grupe.",
        });
      }

      const [existing] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupa specificată nu există.",
        });
      }

      if (!isSuper && user.schoolId && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiuni pentru această școală.",
        });
      }

      const [updated] = await db
        .update(groups)
        .set({
          active: input.active,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, input.id))
        .returning();

      return updated;
    }),
});
