import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and, asc, desc, gte, lte } from "drizzle-orm";
import { groups, courses, students, attendanceRecords, studentGroupEnrollments } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import {
  assertTeacherGroupAccess,
  attendanceRecordItemSchema,
  submitAttendanceSchema,
  quickMarkSchema,
  getJournalSchema,
} from "../attendanceUtils";
import {
  fetchJournalData,
  executeQuickMark,
  findTeacherActiveSession,
} from "../attendanceService";
import { processAttendanceBilling } from "../lessonBillingService";
import { logger } from "@/lib/logger";

export {
  assertTeacherGroupAccess,
  attendanceRecordItemSchema,
  submitAttendanceSchema,
  quickMarkSchema,
  getJournalSchema,
};

export function assertAdminAccess(
  user: { id: string; role: string; permissions: string[]; schoolId?: number | null },
  groupSchoolId?: number | null,
) {
  const permissions = user.permissions || [];
  const role = user.role;
  const isSuper = permissions.includes("super") || role === "superadmin";
  const isAdmin = permissions.includes("admin") || role === "admin";

  if (!isSuper && !isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accesul la matricea istorică este rezervat administratorilor.",
    });
  }

  if (!isSuper && isAdmin && groupSchoolId && user.schoolId && groupSchoolId !== user.schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu poți accesa date din altă școală.",
    });
  }

  return { isSuper, isAdmin };
}

export const getMatrixSchema = z.object({
  groupId: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formatul lunii trebuie să fie YYYY-MM").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD").optional(),
});

export const updateCellSchema = z.object({
  groupId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD"),
  status: z.enum(["present", "absent", "late", "excused"]),
  comment: z.string().optional().nullable(),
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

        try {
          await processAttendanceBilling(
            {
              attendanceRecordId: saved.id,
              studentId: rec.studentId,
              groupId: input.groupId,
              date: input.date,
              status: rec.status,
            },
            db,
          );
        } catch (err) {
          logger.error(
            "[submitAttendance] processAttendanceBilling error:",
            err instanceof Error ? err : { error: String(err) },
          );
        }
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

  // Get multi-date school journal for a group and month
  getJournal: protectedProcedure
    .input(getJournalSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const now = new Date();
      const monthStr =
        input.month ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return fetchJournalData(input.groupId, monthStr, user);
    }),

  // Quick 1-click / 2-click / clear mark for a single student on a date
  quickMark: protectedProcedure
    .input(quickMarkSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return executeQuickMark(input, user);
    }),

  // Detect if logged-in teacher has an active or uncompleted session today
  getTeacherActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return findTeacherActiveSession(user);
  }),

  // Get attendance matrix view across historical sessions for admin overview
  getMatrix: protectedProcedure
    .input(getMatrixSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // 1. Fetch group & course details
      const [group] = await db
        .select({
          id: groups.id,
          name: groups.name,
          courseId: groups.courseId,
          courseName: courses.name,
          schoolId: groups.schoolId,
          scheduleDays: groups.scheduleDays,
          scheduleTime: groups.scheduleTime,
          room: groups.room,
        })
        .from(groups)
        .leftJoin(courses, eq(groups.courseId, courses.id))
        .where(eq(groups.id, input.groupId))
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupul specificat nu a fost găsit.",
        });
      }

      // 2. Strict admin access control
      assertAdminAccess(user, group.schoolId);

      // 3. Fetch active enrolled students
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

      // 4. Build date range filter conditions
      const conditions = [eq(attendanceRecords.groupId, input.groupId)];
      if (input.month) {
        conditions.push(gte(attendanceRecords.date, `${input.month}-01`));
        conditions.push(lte(attendanceRecords.date, `${input.month}-31`));
      } else {
        if (input.startDate) conditions.push(gte(attendanceRecords.date, input.startDate));
        if (input.endDate) conditions.push(lte(attendanceRecords.date, input.endDate));
      }

      // 5. Query attendance records
      const records = await db
        .select({
          id: attendanceRecords.id,
          studentId: attendanceRecords.studentId,
          date: attendanceRecords.date,
          status: attendanceRecords.status,
          comment: attendanceRecords.comment,
          markedByUserId: attendanceRecords.markedByUserId,
          updatedAt: attendanceRecords.updatedAt,
        })
        .from(attendanceRecords)
        .where(and(...conditions))
        .orderBy(asc(attendanceRecords.date));

      // 6. Collect unique sorted session dates
      const uniqueDatesSet = new Set<string>();
      for (const r of records) {
        uniqueDatesSet.add(r.date);
      }
      const dates = Array.from(uniqueDatesSet).sort();

      // 7. Group records by student
      const recordsByStudent = new Map<
        number,
        Map<
          string,
          {
            id: number;
            status: "present" | "absent" | "late" | "excused";
            comment: string | null;
            markedByUserId: number | null;
            updatedAt: Date | null;
          }
        >
      >();

      for (const r of records) {
        let sMap = recordsByStudent.get(r.studentId);
        if (!sMap) {
          sMap = new Map();
          recordsByStudent.set(r.studentId, sMap);
        }
        sMap.set(r.date, {
          id: r.id,
          status: r.status as "present" | "absent" | "late" | "excused",
          comment: r.comment,
          markedByUserId: r.markedByUserId,
          updatedAt: r.updatedAt,
        });
      }

      // 8. Compute per-student stats and consecutive absence warnings
      let groupAttendedTotal = 0;
      let groupRecordedTotal = 0;
      let atRiskCount = 0;

      const studentsWithMatrix = enrolledStudents.map((s) => {
        const sRecords = recordsByStudent.get(s.studentId) || new Map();
        const cells: Record<string, { id?: number; status: "present" | "absent" | "late" | "excused"; comment?: string | null }> = {};

        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        let excusedCount = 0;
        let consecutiveAbsences = 0;
        let maxConsecutiveAbsences = 0;

        for (const d of dates) {
          const rec = sRecords.get(d);
          if (rec) {
            cells[d] = {
              id: rec.id,
              status: rec.status,
              comment: rec.comment,
            };
            if (rec.status === "present") {
              presentCount++;
              consecutiveAbsences = 0;
            } else if (rec.status === "late") {
              lateCount++;
              consecutiveAbsences = 0;
            } else if (rec.status === "absent") {
              absentCount++;
              consecutiveAbsences++;
              if (consecutiveAbsences > maxConsecutiveAbsences) {
                maxConsecutiveAbsences = consecutiveAbsences;
              }
            } else if (rec.status === "excused") {
              excusedCount++;
              consecutiveAbsences = 0;
            }
          }
        }

        const totalSessions = presentCount + lateCount + absentCount + excusedCount;
        const attendedCount = presentCount + lateCount;
        const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;
        const hasConsecutiveAbsences = maxConsecutiveAbsences >= 3;

        if (hasConsecutiveAbsences) {
          atRiskCount++;
        }

        groupAttendedTotal += attendedCount;
        groupRecordedTotal += totalSessions;

        return {
          studentId: s.studentId,
          studentName: s.studentName,
          studentPhone: s.studentPhone,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          age: s.age,
          cells,
          stats: {
            presentCount,
            lateCount,
            absentCount,
            excusedCount,
            totalSessions,
            attendedCount,
            attendanceRate,
            maxConsecutiveAbsences,
            hasConsecutiveAbsences,
          },
        };
      });

      const groupAttendanceRate =
        groupRecordedTotal > 0 ? Math.round((groupAttendedTotal / groupRecordedTotal) * 100) : 100;

      return {
        group,
        dates,
        students: studentsWithMatrix,
        summary: {
          totalStudents: enrolledStudents.length,
          totalDates: dates.length,
          groupAttendanceRate,
          atRiskCount,
        },
      };
    }),

  // Retroactively update or insert a single attendance cell record
  updateCell: protectedProcedure
    .input(updateCellSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [group] = await db
        .select({ id: groups.id, schoolId: groups.schoolId, courseId: groups.courseId })
        .from(groups)
        .where(eq(groups.id, input.groupId))
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupul specificat nu a fost găsit.",
        });
      }

      assertAdminAccess(user, group.schoolId);

      const userIdNumber = Number(user.id) || null;

      const [record] = await db
        .insert(attendanceRecords)
        .values({
          groupId: input.groupId,
          courseId: group.courseId,
          studentId: input.studentId,
          date: input.date,
          status: input.status,
          comment: input.comment || null,
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
            status: input.status,
            comment: input.comment || null,
            markedByUserId: userIdNumber,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        success: true,
        record,
      };
    }),
});
