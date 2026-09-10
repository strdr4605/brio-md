import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { users, schools, courses, sessions } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";

const phoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine((val) => !val || isValidPhone(val), {
    message: "Format telefon invalid.",
  })
  .transform((val) => (val && val.trim() ? normalizePhone(val) : null));

export const userRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const userId = parseInt(ctx.user.id);
    return { ...ctx.user, id: userId };
  }),

  // List users (filtered by permissions)
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          schoolId: z.number().optional(),
          role: z.string().optional(),
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

      // Build conditions based on role
      const conditions = [];

      if (!permissions.includes("super")) {
        if (permissions.includes("admin")) {
          // Admins see users in their school
          if (user.schoolId) {
            conditions.push(eq(users.schoolId, user.schoolId));
          } else {
            return [];
          }
        } else {
          // Others see only themselves
          return [
            {
              id: parseInt(user.id),
              email: user.email,
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              courseIds: user.courseIds,
              schoolId: user.schoolId,
              active: true,
            },
          ];
        }
      }

      // Apply filters
      if (input?.search) {
        conditions.push(ilike(users.name, `%${input.search}%`));
      }
      if (input?.schoolId) {
        conditions.push(eq(users.schoolId, input.schoolId));
      }
      if (input?.role) {
        conditions.push(eq(users.role, input.role));
      }
      if (input?.active !== undefined) {
        conditions.push(eq(users.active, input.active));
      }

      const result = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          permissions: users.permissions,
          courseIds: users.courseIds,
          schoolId: users.schoolId,
          phone: users.phone,
          info: users.info,
          active: users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return result;
    }),

  // Get user by ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const user = ctx.user;
    const permissions = user.permissions || [];

    // Check permissions
    if (!permissions.includes("super")) {
      if (permissions.includes("admin")) {
        // Admin can only view users in their school (mock)
        if (input.id !== parseInt(user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot view this user" });
        }
      } else {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot view users" });
      }
    }

    return null; // Mock
  }),

  // Create user (Admin or SuperAdmin)
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        role: z.enum(["superadmin", "admin", "teacher"]),
        permissions: z.array(z.string()),
        courseIds: z.array(z.number()).optional(),
        schoolId: z.number().nullable().optional(),
        phone: phoneSchema,
        info: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await hash(input.password, 12);
      const schoolId = input.schoolId ?? ctx.user!.schoolId;
      const [result] = await db
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          permissions: input.permissions,
          courseIds: input.courseIds || [],
          schoolId,
          phone: input.phone || null,
          info: input.info,
          active: true,
        })
        .returning();

      return result;
    }),

  // Update user (Admin or SuperAdmin)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
        role: z.enum(["superadmin", "admin", "teacher"]).optional(),
        permissions: z.array(z.string()).optional(),
        courseIds: z.array(z.number()).optional(),
        schoolId: z.number().nullable().optional(),
        phone: phoneSchema,
        active: z.boolean().optional(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, password, ...updates } = input;
      const updateData: typeof updates & { passwordHash?: string; lastChangedAt?: Date } = { ...updates };
      if (password) {
        updateData.passwordHash = await hash(password, 12);
      }
      if (password || "permissions" in updates) {
        updateData.lastChangedAt = new Date();
        await db.delete(sessions).where(eq(sessions.userId, id));
      }
      const [result] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

      return result;
    }),

  // List schools
  listSchools: protectedProcedure.query(async () => {
    const result = await db.select().from(schools);
    return result;
  }),

  // List courses
  listCourses: protectedProcedure
    .input(
      z
        .object({
          schoolId: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (input?.schoolId) {
        return db.select().from(courses).where(eq(courses.schoolId, input.schoolId));
      }
      return db.select().from(courses);
    }),
});
