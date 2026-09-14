import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and } from "drizzle-orm";
import { groups, attendanceRecords } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

export function assertTeacherGroupAccess(
  group: { id: number; teacherId: number | null },
  user: { id: string; role: string; permissions: string[] },
) {
  const permissions = user.permissions || [];
  const role = user.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";

  // Admins have global permission across all groups and dates
  if (isSuper || isAdmin) {
    return { isAdmin: true };
  }

  // Teachers are only allowed for their own assigned groups
  const isTeacher = permissions.includes("teach") || role === "teacher";
  const userIdNumber = Number(user.id);

  if (isTeacher && group.teacherId === userIdNumber) {
    return { isTeacher: true, isAdmin: false };
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Profesorii au permisiunea de a gestiona prezența doar pentru grupele atribuite.",
  });
}

export const attendanceRecordItemSchema = z.object({
  studentId: z.number().int().positive(),
  status: z.enum(["present", "absent", "late", "excused"]),
  comment: z.string().optional().nullable(),
});

export const submitAttendanceSchema = z.object({
  groupId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD"),
  records: z.array(attendanceRecordItemSchema),
});

export const attendanceRouter = router({
  // Submit / update attendance for a group session date
  submit: protectedProcedure
    .input(submitAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // 1. Fetch group
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, input.groupId))
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupul specificat nu a fost găsit.",
        });
      }

      // 2. Server-side guard: verify teacher-group assignment or admin permission
      assertTeacherGroupAccess(group, user);

      // 3. Upsert attendance records
      const userIdNumber = Number(user.id) || null;
      const results = [];

      for (const rec of input.records) {
        const [saved] = await db
          .insert(attendanceRecords)
          .values({
            groupId: input.groupId,
            courseId: group.courseId,
            studentId: rec.studentId,
            date: input.date,
            status: rec.status,
            comment: rec.comment || null,
            markedByUserId: userIdNumber,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
              attendanceRecords.groupId,
              attendanceRecords.studentId,
              attendanceRecords.date,
            ],
            set: {
              status: rec.status,
              comment: rec.comment || null,
              markedByUserId: userIdNumber,
              updatedAt: new Date(),
            },
          })
          .returning();

        results.push(saved);
      }

      return {
        success: true,
        count: results.length,
        records: results,
      };
    }),

  // Get attendance records for a group on a specific date
  getByGroupAndDate: protectedProcedure
    .input(
      z.object({
        groupId: z.number().int().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, input.groupId))
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupul specificat nu a fost găsit.",
        });
      }

      // Server-side guard
      assertTeacherGroupAccess(group, user);

      return db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, input.groupId),
            eq(attendanceRecords.date, input.date),
          ),
        );
    }),
});
