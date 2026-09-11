import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { users, schools, courses, sessions } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { phoneSchema } from "@/lib/phone";

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
      const isSuper = permissions.includes("super") || user.role === "superadmin";
      const isAdmin = permissions.includes("admin") || user.role === "admin";

      // Build conditions based on role
      const conditions = [];

      if (!isSuper) {
        if (isAdmin) {
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
        const escapedSearch = input.search.replace(/[%_\\]/g, "\\$&");
        conditions.push(ilike(users.name, `%${escapedSearch}%`));
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
    const caller = ctx.user;
    const permissions = caller.permissions || [];
    const isSuper = permissions.includes("super") || caller.role === "superadmin";
    const isAdmin = permissions.includes("admin") || caller.role === "admin";

    if (!isSuper && !isAdmin) {
      if (input.id !== parseInt(caller.id, 10)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți vizualiza acest utilizator" });
      }
    }

    const [foundUser] = await db
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
      .where(eq(users.id, input.id))
      .limit(1);

    if (!foundUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Utilizatorul nu a fost găsit" });
    }

    if (!isSuper && isAdmin && foundUser.schoolId !== caller.schoolId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți vizualiza un utilizator din altă școală",
      });
    }

    return foundUser;
  }),

  // Create user (Admin or SuperAdmin)
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8).max(72),
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
      const caller = ctx.user!;
      const callerPermissions = caller.permissions || [];
      const isSuper = callerPermissions.includes("super") || caller.role === "superadmin";

      if (!isSuper) {
        if (input.role === "superadmin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Doar superadmin poate crea utilizatori cu rolul superadmin",
          });
        }
        if (input.permissions.includes("super")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Doar superadmin poate acorda permisiunea super",
          });
        }
        if (input.schoolId && input.schoolId !== caller.schoolId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nu poți crea un utilizator pentru altă școală",
          });
        }
      }

      const passwordHash = await hash(input.password, 12);
      const schoolId = isSuper ? (input.schoolId ?? caller.schoolId) : caller.schoolId;
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

      const { passwordHash: _, ...safeUser } = result;
      return safeUser;
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
        password: z.string().min(8).max(72).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.user!;
      const callerPermissions = caller.permissions || [];
      const isSuper = callerPermissions.includes("super") || caller.role === "superadmin";

      const [targetUser] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilizatorul nu a fost găsit" });
      }

      if (!isSuper) {
        if (targetUser.schoolId !== caller.schoolId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nu poți modifica un utilizator din altă școală",
          });
        }
        if (targetUser.role === "superadmin" || targetUser.permissions?.includes("super")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nu poți modifica un superadmin",
          });
        }
        if (input.role === "superadmin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nu poți atribui rolul superadmin",
          });
        }
        if (input.permissions && input.permissions.includes("super")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nu poți acorda permisiunea super",
          });
        }
      }

      const { id, password, ...updates } = input;
      const updateData: typeof updates & { passwordHash?: string; lastChangedAt?: Date } = {
        ...updates,
      };

      if (!isSuper) {
        delete updateData.schoolId;
      }

      if (password) {
        updateData.passwordHash = await hash(password, 12);
      }
      if (
        password ||
        "permissions" in updates ||
        "role" in updates ||
        "active" in updates ||
        "schoolId" in updates
      ) {
        updateData.lastChangedAt = new Date();
        await db.delete(sessions).where(eq(sessions.userId, id));
      }
      const [result] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

      const { passwordHash: _, ...safeUser } = result;
      return safeUser;
    }),

  // List schools (superadmin sees all, others see only their school)
  listSchools: protectedProcedure.query(async ({ ctx }) => {
    const permissions = ctx.user?.permissions || [];
    const isSuper = permissions.includes("super") || ctx.user?.role === "superadmin";
    if (isSuper) {
      return db.select().from(schools);
    }
    if (!ctx.user?.schoolId) return [];
    return db.select().from(schools).where(eq(schools.id, ctx.user.schoolId));
  }),

  // List courses (scoped to schoolId)
  listCourses: protectedProcedure
    .input(
      z
        .object({
          schoolId: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const permissions = ctx.user?.permissions || [];
      const isSuper = permissions.includes("super") || ctx.user?.role === "superadmin";
      const targetSchoolId = isSuper ? input?.schoolId : (ctx.user?.schoolId ?? undefined);

      if (targetSchoolId) {
        return db.select().from(courses).where(eq(courses.schoolId, targetSchoolId));
      }
      return isSuper ? db.select().from(courses) : [];
    }),
});
