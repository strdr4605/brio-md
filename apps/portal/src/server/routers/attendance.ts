import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and, asc, desc } from "drizzle-orm";
import { groups, courses, students, attendanceRecords, studentGroupEnrollments } from "@/db/schema";
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

  // Get full attendance sheet for a group and date (active enrolled students + attendance status & comment)
  getSheet: protectedProcedure
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

      // Enforce teacher-group access control
      assertTeacherGroupAccess(group, user);

      // 1. Fetch active students enrolled in this group
      const enrolledStudents = await db
        .select({
          studentId: students.id,
          studentName: students.name,
          studentPhone: students.phone,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          age: students.age,
        })
        .from(studentGroupEnrollments)
        .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
        .where(
          and(
            eq(studentGroupEnrollments.groupId, input.groupId),
            eq(studentGroupEnrollments.status, "active"),
          ),
        )
        .orderBy(asc(students.name));

      // 2. Fetch attendance records for this date
      const existingRecords = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, input.groupId),
            eq(attendanceRecords.date, input.date),
          ),
        );

      const recordsMap = new Map(existingRecords.map((r) => [r.studentId, r]));

      return enrolledStudents.map((s) => {
        const rec = recordsMap.get(s.studentId);
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          studentPhone: s.studentPhone,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          age: s.age,
          status: rec?.status ?? null,
          comment: rec?.comment ?? null,
          markedByUserId: rec?.markedByUserId ?? null,
          updatedAt: rec?.updatedAt ?? null,
        };
      });
    }),

  // Get attendance records and summary metrics for a student
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

      const permissions = user.permissions || [];
      const role = user.role;
      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu ai permisiuni pentru a vizualiza prezența studentului.",
        });
      }

      if (!isSuper && !isTeacher && isAdmin && student.schoolId && user.schoolId && student.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți vizualiza date din altă școală.",
        });
      }

      const records = await db
        .select({
          id: attendanceRecords.id,
          groupId: attendanceRecords.groupId,
          groupName: groups.name,
          courseId: attendanceRecords.courseId,
          courseName: courses.name,
          courseLevel: courses.level,
          scheduleDays: groups.scheduleDays,
          scheduleTime: groups.scheduleTime,
          room: groups.room,
          date: attendanceRecords.date,
          status: attendanceRecords.status,
          comment: attendanceRecords.comment,
          createdAt: attendanceRecords.createdAt,
        })
        .from(attendanceRecords)
        .innerJoin(groups, eq(attendanceRecords.groupId, groups.id))
        .innerJoin(courses, eq(attendanceRecords.courseId, courses.id))
        .where(eq(attendanceRecords.studentId, input.studentId))
        .orderBy(desc(attendanceRecords.date));

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      for (const rec of records) {
        if (rec.status === "present") presentCount++;
        else if (rec.status === "late") lateCount++;
        else if (rec.status === "absent") absentCount++;
        else if (rec.status === "excused") excusedCount++;
      }

      const totalSessions = records.length;
      const attendedCount = presentCount + lateCount;
      const attendanceRate =
        totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : null;

      return {
        summary: {
          totalSessions,
          attendedCount,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendanceRate,
        },
        records,
      };
    }),
});
