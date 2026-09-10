import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { students } from "@/db/schema";
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

      const conditions = [];

      if (!isSuper) {
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
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return result;
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";

      if (!isSuper && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiunea de a adăuga studenți",
        });
      }

      const assignedSchoolId = isSuper ? (input.schoolId ?? null) : user.schoolId;

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";

      if (!isSuper && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
      }

      if (!isSuper && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți modifica un student din altă școală",
        });
      }

      const { id, ...data } = input;
      const updateData: Record<string, any> = { ...data, lastChangedAt: new Date() };
      if (!isSuper) {
        delete updateData.schoolId;
      }

      const [result] = await db
        .update(students)
        .set(updateData)
        .where(eq(students.id, id))
        .returning();

      return result;
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

      if (!isSuper && !isAdmin) {
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

      if (!isSuper && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți șterge un student din altă școală",
        });
      }

      await db.delete(students).where(eq(students.id, input.id));

      return { success: true };
    }),
});
