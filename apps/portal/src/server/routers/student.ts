import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, ilike, and, asc, inArray } from "drizzle-orm";
import { students, courses, studentCourseProgress } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { phoneSchema } from "@/lib/phone";

export const studentRouter = router({
  // List students (filtered by permissions)
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
      if (!ctx.user) return [];
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      const conditions = [];

      if (!isSuper && !isTeacher) {
        if (isAdmin) {
          // Admins see students in their school
          if (user.schoolId) {
            conditions.push(eq(students.schoolId, user.schoolId));
          } else {
            return [];
          }
        } else {
          return [];
        }
      }

      if (input?.search) {
        conditions.push(ilike(students.name, `%${input.search}%`));
      }
      if (input?.schoolId) {
        conditions.push(eq(students.schoolId, input.schoolId));
      }
      if (input?.active !== undefined) {
        conditions.push(eq(students.active, input.active));
      }

      const result = await db
        .select()
        .from(students)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(students.name))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      if (result.length === 0) return [];

      const studentIds = result.map((s) => s.id);
      const enrollments = await db
        .select({
          studentId: studentCourseProgress.studentId,
          courseId: courses.id,
          courseName: courses.name,
        })
        .from(studentCourseProgress)
        .innerJoin(courses, eq(studentCourseProgress.courseId, courses.id))
        .where(inArray(studentCourseProgress.studentId, studentIds));

      const coursesMap = new Map<number, Array<{ id: number; name: string }>>();
      for (const e of enrollments) {
        const list = coursesMap.get(e.studentId) || [];
        list.push({ id: e.courseId, name: e.courseName });
        coursesMap.set(e.studentId, list);
      }

      return result.map((s) => ({
        ...s,
        courses: coursesMap.get(s.id) || [],
      }));
    }),

  // Create student
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Numele este obligatoriu"),
        phone: phoneSchema,
        age: z
          .number()
          .int()
          .min(1, "Vârsta minimă este 1 an")
          .max(120, "Vârsta maximă este 120 ani")
          .nullable()
          .optional(),
        schoolId: z.number().nullable().optional(),
        parentName: z.string().optional().nullable(),
        parentPhone: phoneSchema,
        info: z.string().optional().nullable(),
        courseIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiunea de a adăuga studenți",
        });
      }

      const assignedSchoolId =
        isSuper || isTeacher ? (input.schoolId ?? user.schoolId ?? null) : user.schoolId;

      const [result] = await db
        .insert(students)
        .values({
          name: input.name,
          phone: input.phone || null,
          age: input.age ?? null,
          schoolId: assignedSchoolId,
          parentName: input.parentName || null,
          parentPhone: input.parentPhone || null,
          info: input.info || null,
          active: true,
        })
        .returning();

      if (input.courseIds && input.courseIds.length > 0) {
        await db.insert(studentCourseProgress).values(
          input.courseIds.map((courseId) => ({
            studentId: result.id,
            courseId,
            status: "in_progress" as const,
          })),
        );
      }

      return result;
    }),

  // Update student
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        phone: phoneSchema,
        age: z
          .number()
          .int()
          .min(1, "Vârsta minimă este 1 an")
          .max(120, "Vârsta maximă este 120 ani")
          .nullable()
          .optional(),
        schoolId: z.number().nullable().optional(),
        parentName: z.string().optional().nullable(),
        parentPhone: phoneSchema,
        info: z.string().optional().nullable(),
        active: z.boolean().optional(),
        courseIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
      }

      if (!isSuper && !isTeacher && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți modifica un student din altă școală",
        });
      }

      const { id, courseIds, ...data } = input;
      const updateData: Record<string, any> = { ...data, lastChangedAt: new Date() };
      if (!isSuper) {
        delete updateData.schoolId;
      }

      const [result] = await db
        .update(students)
        .set(updateData)
        .where(eq(students.id, id))
        .returning();

      if (courseIds !== undefined) {
        const existingEnrollments = await db
          .select()
          .from(studentCourseProgress)
          .where(eq(studentCourseProgress.studentId, id));

        const existingIds = new Set(existingEnrollments.map((e) => e.courseId));
        const targetIds = new Set(courseIds);

        const toDelete = existingEnrollments
          .filter((e) => !targetIds.has(e.courseId))
          .map((e) => e.courseId);
        if (toDelete.length > 0) {
          await db
            .delete(studentCourseProgress)
            .where(
              and(
                eq(studentCourseProgress.studentId, id),
                inArray(studentCourseProgress.courseId, toDelete),
              ),
            );
        }

        const toInsert = courseIds.filter((cid) => !existingIds.has(cid));
        if (toInsert.length > 0) {
          await db.insert(studentCourseProgress).values(
            toInsert.map((courseId) => ({
              studentId: id,
              courseId,
              status: "in_progress" as const,
            })),
          );
        }
      }

      return result;
    }),

  // Update student courses (tag-based roles toggle)
  updateCourses: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        courseIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
      }

      if (!isSuper && !isTeacher && isAdmin && student.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți modifica un student din altă școală",
        });
      }

      const existingEnrollments = await db
        .select()
        .from(studentCourseProgress)
        .where(eq(studentCourseProgress.studentId, input.studentId));

      const existingIds = new Set(existingEnrollments.map((e) => e.courseId));
      const targetIds = new Set(input.courseIds);

      const toDelete = existingEnrollments
        .filter((e) => !targetIds.has(e.courseId))
        .map((e) => e.courseId);
      if (toDelete.length > 0) {
        await db
          .delete(studentCourseProgress)
          .where(
            and(
              eq(studentCourseProgress.studentId, input.studentId),
              inArray(studentCourseProgress.courseId, toDelete),
            ),
          );
      }

      const toInsert = input.courseIds.filter((cid) => !existingIds.has(cid));
      if (toInsert.length > 0) {
        await db.insert(studentCourseProgress).values(
          toInsert.map((courseId) => ({
            studentId: input.studentId,
            courseId,
            status: "in_progress" as const,
          })),
        );
      }

      return { success: true };
    }),
  // Delete student
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiunea de a șterge studenți",
        });
      }

      const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit",
        });
      }

      if (!isSuper && !isTeacher && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți șterge un student din altă școală",
        });
      }

      await db.delete(students).where(eq(students.id, input.id));

      return { success: true };
    }),
});
