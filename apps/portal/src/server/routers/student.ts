import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { students } from "@/db/schema";
import { db } from "@/lib/db";

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
});
