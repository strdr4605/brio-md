import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and, inArray, asc } from "drizzle-orm";
import {
  studentGroupEnrollments,
  studentCourseProgress,
  groups,
  courses,
  students,
  users,
} from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { checkStudentGroupConflicts } from "../conflictChecker";

export function assertAdminAccess(
  user: { id: string; role: string; permissions: string[]; schoolId: number | null },
  targetSchoolId?: number | null,
) {
  const permissions = user.permissions || [];
  const role = user.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";
  const isTeacher = permissions.includes("teach") || role === "teacher";

  if (!isSuper && !isAdmin && !isTeacher) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiuni suficiente pentru gestiunea înscrierilor." });
  }
  if (!isSuper && isAdmin && targetSchoolId && user.schoolId && targetSchoolId !== user.schoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiunea de a modifica date din altă școală." });
  }
  return { isSuper, isAdmin, isTeacher };
}

export const enrollmentRouter = router({
  // Enroll a student into one or multiple groups across courses
  enrollStudent: protectedProcedure
    .input(
      z.object({
        studentId: z.number().int().positive("ID student invalid"),
        groupIds: z.array(z.number().int().positive()).min(1, "Selectați cel puțin o grupă"),
        billingType: z.enum(["subscription_monthly", "subscription_course", "per_lesson", "custom"]).optional(),
        customPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
        discountPercent: z.number().int().min(0).max(100).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // 1. Verify student exists and check school authorization
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit.",
        });
      }

      assertAdminAccess(user, student.schoolId);

      // 2. Verify target groups exist
      const targetGroups = await db
        .select({
          id: groups.id,
          courseId: groups.courseId,
          schoolId: groups.schoolId,
        })
        .from(groups)
        .where(inArray(groups.id, input.groupIds));

      if (targetGroups.length !== input.groupIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Una sau mai multe grupe selectate nu există.",
        });
      }

      // Verify each group belongs to same school if admin
      for (const grp of targetGroups) {
        assertAdminAccess(user, grp.schoolId);
      }

      // Ensure student is enrolled in the course for each group
      for (const grp of targetGroups) {
        const [existingProgress] = await db
          .select()
          .from(studentCourseProgress)
          .where(
            and(
              eq(studentCourseProgress.studentId, input.studentId),
              eq(studentCourseProgress.courseId, grp.courseId),
            ),
          )
          .limit(1);

        if (!existingProgress) {
          await db.insert(studentCourseProgress).values({
            studentId: input.studentId,
            courseId: grp.courseId,
            status: "in_progress",
          });
        }
      }

      await checkStudentGroupConflicts(db, {
        studentId: input.studentId,
        groupIds: input.groupIds,
      });

      // 3. Upsert enrollments with status "active"
      const results = [];
      for (const grp of targetGroups) {
        const [saved] = await db
          .insert(studentGroupEnrollments)
          .values({
            studentId: input.studentId,
            groupId: grp.id,
            courseId: grp.courseId,
            status: "active",
            billingType: input.billingType || "subscription_monthly",
            customPrice: input.customPrice !== undefined ? input.customPrice : null,
            discountPercent: input.discountPercent !== undefined ? input.discountPercent : 0,
            joinedAt: new Date(),
            leftAt: null,
          })
          .onConflictDoUpdate({
            target: [studentGroupEnrollments.studentId, studentGroupEnrollments.groupId],
            set: {
              status: "active",
              leftAt: null,
              courseId: grp.courseId,
              ...(input.billingType ? { billingType: input.billingType } : {}),
              ...(input.customPrice !== undefined ? { customPrice: input.customPrice } : {}),
              ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
            },
          })
          .returning();
        results.push(saved);
      }

      return {
        success: true,
        count: results.length,
        enrollments: results,
      };
    }),

  // Update enrollment status (e.g. Active -> Inactive / Archived)
  updateStatus: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive().optional(),
        studentId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        status: z.enum(["active", "inactive", "archived", "completed"]),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      let enrollment = null;

      if (input.enrollmentId) {
        const [found] = await db
          .select()
          .from(studentGroupEnrollments)
          .where(eq(studentGroupEnrollments.id, input.enrollmentId))
          .limit(1);
        enrollment = found;
      } else if (input.studentId && input.groupId) {
        const [found] = await db
          .select()
          .from(studentGroupEnrollments)
          .where(
            and(
              eq(studentGroupEnrollments.studentId, input.studentId),
              eq(studentGroupEnrollments.groupId, input.groupId),
            ),
          )
          .limit(1);
        enrollment = found;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Trebuie specificat enrollmentId sau perechea (studentId, groupId).",
        });
      }

      if (!enrollment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Înscrierea nu a fost găsită.",
        });
      }

      // Verify student's school
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, enrollment.studentId))
        .limit(1);

      if (student) {
        assertAdminAccess(user, student.schoolId);
      }

      if (input.status === "active") {
        await checkStudentGroupConflicts(db, {
          studentId: enrollment.studentId,
          groupIds: [enrollment.groupId],
          excludeEnrollmentId: enrollment.id,
        });
      }

      const isDeactivating = input.status !== "active";
      const leftAt = isDeactivating ? new Date() : null;

      const updatePayload: Record<string, any> = {
        status: input.status,
        leftAt,
      };

      if (input.notes !== undefined) {
        updatePayload.notes = input.notes;
      }

      const [updated] = await db
        .update(studentGroupEnrollments)
        .set(updatePayload)
        .where(eq(studentGroupEnrollments.id, enrollment.id))
        .returning();

      return updated;
    }),

  // Get all group enrollments for a specific student
  getByStudent: protectedProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit.",
        });
      }

      assertAdminAccess(user, student.schoolId);

      const rows = await db
        .select({
          id: studentGroupEnrollments.id,
          studentId: studentGroupEnrollments.studentId,
          groupId: studentGroupEnrollments.groupId,
          groupName: groups.name,
          courseId: courses.id,
          courseName: courses.name,
          courseLevel: courses.level,
          scheduleDays: groups.scheduleDays,
          scheduleTime: groups.scheduleTime,
          room: groups.room,
          teacherId: groups.teacherId,
          teacherName: users.name,
          status: studentGroupEnrollments.status,
          joinedAt: studentGroupEnrollments.joinedAt,
          leftAt: studentGroupEnrollments.leftAt,
          notes: studentGroupEnrollments.notes,
        })
        .from(studentGroupEnrollments)
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(eq(studentGroupEnrollments.studentId, input.studentId))
        .orderBy(asc(courses.name), asc(groups.name));

      return rows;
    }),

  // Retrieve students by group and status (with Active vs Inactive/Archived separation)
  listByGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number().int().positive(),
        status: z
          .enum(["active", "inactive", "archived", "completed", "inactive_or_archived", "all"])
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [group] = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupa specificată nu a fost găsită.",
        });
      }

      assertAdminAccess(user, group.schoolId);

      const conditions = [eq(studentGroupEnrollments.groupId, input.groupId)];

      if (input.status === "inactive_or_archived") {
        conditions.push(inArray(studentGroupEnrollments.status, ["inactive", "archived"]));
      } else if (input.status !== "all") {
        conditions.push(eq(studentGroupEnrollments.status, input.status));
      }

      const rows = await db
        .select({
          enrollmentId: studentGroupEnrollments.id,
          studentId: students.id,
          studentName: students.name,
          studentPhone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          schoolId: students.schoolId,
          status: studentGroupEnrollments.status,
          joinedAt: studentGroupEnrollments.joinedAt,
          leftAt: studentGroupEnrollments.leftAt,
          notes: studentGroupEnrollments.notes,
        })
        .from(studentGroupEnrollments)
        .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
        .where(and(...conditions))
        .orderBy(asc(students.name));

      return rows;
    }),

  // Retrieve students across all groups of a course
  listByCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.number().int().positive(),
        status: z
          .enum(["active", "inactive", "archived", "completed", "inactive_or_archived", "all"])
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cursul specificat nu a fost găsit.",
        });
      }

      assertAdminAccess(user, course.schoolId);

      const conditions = [eq(studentGroupEnrollments.courseId, input.courseId)];

      if (input.status === "inactive_or_archived") {
        conditions.push(inArray(studentGroupEnrollments.status, ["inactive", "archived"]));
      } else if (input.status !== "all") {
        conditions.push(eq(studentGroupEnrollments.status, input.status));
      }

      const rows = await db
        .select({
          enrollmentId: studentGroupEnrollments.id,
          studentId: students.id,
          studentName: students.name,
          studentPhone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          groupId: groups.id,
          groupName: groups.name,
          status: studentGroupEnrollments.status,
          joinedAt: studentGroupEnrollments.joinedAt,
          leftAt: studentGroupEnrollments.leftAt,
          notes: studentGroupEnrollments.notes,
        })
        .from(studentGroupEnrollments)
        .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .where(and(...conditions))
        .orderBy(asc(groups.name), asc(students.name));

      return rows;
    }),

  // Unenroll a student from a group
  remove: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive().optional(),
        studentId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      let condition;
      if (input.enrollmentId) {
        condition = eq(studentGroupEnrollments.id, input.enrollmentId);
      } else if (input.studentId && input.groupId) {
        condition = and(
          eq(studentGroupEnrollments.studentId, input.studentId),
          eq(studentGroupEnrollments.groupId, input.groupId),
        );
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Trebuie specificat enrollmentId sau perechea (studentId, groupId).",
        });
      }

      await db.delete(studentGroupEnrollments).where(condition);
      return { success: true };
    }),
});
