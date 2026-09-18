import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, ilike, and, or, asc, inArray, isNull, ne } from "drizzle-orm";
import {
  students,
  courses,
  studentCourseProgress,
  schools,
  studentGroupEnrollments,
  groups,
} from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { phoneSchema } from "@/lib/phone";
import { checkStudentCourseConflicts } from "../conflictChecker";

function getStudentRoles(user?: { permissions?: string[]; role?: string; schoolId?: number | null }) {
  const permissions = user?.permissions || [];
  const role = user?.role;
  return {
    isSuper: permissions.includes("super") || role === "superadmin",
    isAdmin: permissions.includes("admin") || role === "admin",
    isTeacher: permissions.includes("teach") || role === "teacher",
  };
}

async function checkDuplicateStudent({
  schoolId,
  name,
  phone,
  parentPhone,
  parentName,
  excludeStudentId,
}: {
  schoolId: number | null;
  name: string;
  phone?: string | null;
  parentPhone?: string | null;
  parentName?: string | null;
  excludeStudentId?: number;
}) {
  const normalizedName = name.trim();
  const conditions = [
    schoolId ? eq(students.schoolId, schoolId) : isNull(students.schoolId),
    ilike(students.name, normalizedName),
  ];

  if (excludeStudentId) {
    conditions.push(ne(students.id, excludeStudentId));
  }

  const query = db
    .select?.()
    ?.from?.(students)
    ?.where?.(and(...conditions));

  const rawCandidates = query ? await query : [];
  const existingCandidates = Array.isArray(rawCandidates) ? rawCandidates : [];

  const hasDuplicate = existingCandidates.some((existing) => {
    const inputPhone = phone?.trim();
    const existingPhone = existing?.phone?.trim();
    const inputParentPhone = parentPhone?.trim();
    const existingParentPhone = existing?.parentPhone?.trim();

    // If personal phone matches
    if (inputPhone && existingPhone && inputPhone === existingPhone) return true;
    // If parent phone matches
    if (inputParentPhone && existingParentPhone && inputParentPhone === existingParentPhone)
      return true;

    // If neither record has contact phone numbers, compare parent names
    if (!inputPhone && !existingPhone && !inputParentPhone && !existingParentPhone) {
      const inputParent = parentName?.trim().toLowerCase();
      const existingParent = existing?.parentName?.trim().toLowerCase();
      if (inputParent && existingParent && inputParent === existingParent) return true;
      if (!inputParent && !existingParent) return true;
    }

    return false;
  });

  if (hasDuplicate) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Un student cu acest nume și aceleași date de contact există deja în această școală.",
    });
  }
}

export const studentRouter = router({
  // Get student by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
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
          message: "Nu ai permisiunea de a vizualiza profilul studentului",
        });
      }

      const [row] = await db
        .select({
          id: students.id,
          name: students.name,
          schoolId: students.schoolId,
          schoolName: schools.name,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          phone: students.phone,
          age: students.age,
          info: students.info,
          active: students.active,
          createdAt: students.createdAt,
          lastChangedAt: students.lastChangedAt,
        })
        .from(students)
        .leftJoin(schools, eq(students.schoolId, schools.id))
        .where(eq(students.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Studentul nu a fost găsit",
        });
      }

      if (!isSuper && !isTeacher && isAdmin && row.schoolId !== user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu poți vizualiza un student din altă școală",
        });
      }

      const progressCourses = await db
        .select({
          id: courses.id,
          name: courses.name,
        })
        .from(studentCourseProgress)
        .innerJoin(courses, eq(studentCourseProgress.courseId, courses.id))
        .where(
          and(
            eq(studentCourseProgress.studentId, input.id),
            eq(courses.active, true),
          ),
        );

      const groupCourses = await db
        .select({
          id: courses.id,
          name: courses.name,
        })
        .from(studentGroupEnrollments)
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .where(
          and(
            eq(studentGroupEnrollments.studentId, input.id),
            eq(studentGroupEnrollments.status, "active"),
            eq(courses.active, true),
            eq(groups.active, true),
          ),
        );

      const courseMap = new Map<string, { id: number; name: string }>();
      for (const c of progressCourses) {
        const key = c.name.trim().toLowerCase();
        if (!courseMap.has(key)) {
          courseMap.set(key, c);
        }
      }
      for (const c of groupCourses) {
        const key = c.name.trim().toLowerCase();
        if (!courseMap.has(key)) {
          courseMap.set(key, c);
        }
      }

      return {
        ...row,
        courses: Array.from(courseMap.values()),
      };
    }),

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
      const { isSuper, isAdmin, isTeacher } = getStudentRoles(user);

      const conditions = [];

      if (!isSuper && !isTeacher) {
        if (!isAdmin || !user.schoolId) return [];
        conditions.push(eq(students.schoolId, user.schoolId));
      }

      if (input?.search) {
        const q = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(students.name, q),
            ilike(students.phone, q),
            ilike(students.parentName, q),
            ilike(students.parentPhone, q),
          ),
        );
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
        .where(
          and(
            inArray(studentCourseProgress.studentId, studentIds),
            eq(courses.active, true),
          ),
        );

      const groupEnrollments = await db
        .select({
          studentId: studentGroupEnrollments.studentId,
          courseId: courses.id,
          courseName: courses.name,
        })
        .from(studentGroupEnrollments)
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .where(
          and(
            inArray(studentGroupEnrollments.studentId, studentIds),
            eq(studentGroupEnrollments.status, "active"),
            eq(courses.active, true),
            eq(groups.active, true),
          ),
        );

      const coursesMap = new Map<number, Map<string, { id: number; name: string }>>();
      for (const e of enrollments) {
        const studentMap =
          coursesMap.get(e.studentId) || new Map<string, { id: number; name: string }>();
        const key = e.courseName.trim().toLowerCase();
        if (!studentMap.has(key)) {
          studentMap.set(key, { id: e.courseId, name: e.courseName });
        }
        coursesMap.set(e.studentId, studentMap);
      }
      for (const ge of groupEnrollments) {
        const studentMap =
          coursesMap.get(ge.studentId) || new Map<string, { id: number; name: string }>();
        const key = ge.courseName.trim().toLowerCase();
        if (!studentMap.has(key)) {
          studentMap.set(key, { id: ge.courseId, name: ge.courseName });
        }
        coursesMap.set(ge.studentId, studentMap);
      }

      return result.map((s) => ({
        ...s,
        courses: Array.from(coursesMap.get(s.id)?.values() || []),
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
        groupIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const { isSuper, isAdmin, isTeacher } = getStudentRoles(user);

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiunea de a adăuga studenți" });
      }

      await checkStudentCourseConflicts(db, input.courseIds, input.groupIds);

      const assignedSchoolId =
        isSuper || isTeacher ? (input.schoolId ?? user.schoolId ?? null) : user.schoolId;

      // Require at least one contact phone number (student or parent)
      if (!input.phone?.trim() && !input.parentPhone?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este necesar cel puțin un număr de telefon (al studentului sau al părintelui).",
        });
      }

      await checkDuplicateStudent({
        schoolId: assignedSchoolId,
        name: input.name,
        phone: input.phone,
        parentPhone: input.parentPhone,
        parentName: input.parentName,
      });

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

      if (input.groupIds && input.groupIds.length > 0) {
        const targetGroups = await db
          .select({ id: groups.id, courseId: groups.courseId })
          .from(groups)
          .where(inArray(groups.id, input.groupIds));

        const studentCourseSet = new Set(input.courseIds || []);
        for (const grp of targetGroups) {
          if (!studentCourseSet.has(grp.courseId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Studentul trebuie să fie mai întâi înscris în cursul respectiv înainte de a fi adăugat într-o grupă.",
            });
          }
        }

        for (const grp of targetGroups) {
          await db
            .insert(studentGroupEnrollments)
            .values({
              studentId: result.id,
              groupId: grp.id,
              courseId: grp.courseId,
              status: "active",
              joinedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [studentGroupEnrollments.studentId, studentGroupEnrollments.groupId],
              set: { status: "active", leftAt: null, courseId: grp.courseId },
            });
        }
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
        groupIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = ctx.user;
      const { isSuper, isAdmin, isTeacher } = getStudentRoles(user);

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
      }

      if (!isSuper && !isTeacher && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți modifica un student din altă școală" });
      }

      if (input.courseIds && input.courseIds.length > 1) {
        await checkStudentCourseConflicts(db, input.courseIds, input.groupIds);
      }

      const { id, courseIds, groupIds, ...data } = input;
      const targetSchoolId =
        isSuper && data.schoolId !== undefined ? data.schoolId : existing.schoolId;
      const targetName = data.name ?? existing.name;

      if (data.phone !== undefined || data.parentPhone !== undefined) {
        const finalPhone = data.phone !== undefined ? data.phone : existing.phone;
        const finalParentPhone =
          data.parentPhone !== undefined ? data.parentPhone : existing.parentPhone;
        if (!finalPhone?.trim() && !finalParentPhone?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Este necesar cel puțin un număr de telefon (al studentului sau al părintelui).",
          });
        }
      }

      if (
        data.name !== undefined ||
        data.phone !== undefined ||
        data.parentPhone !== undefined ||
        data.parentName !== undefined ||
        (isSuper && data.schoolId !== undefined)
      ) {
        await checkDuplicateStudent({
          schoolId: targetSchoolId,
          name: targetName,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          parentPhone: data.parentPhone !== undefined ? data.parentPhone : existing.parentPhone,
          parentName: data.parentName !== undefined ? data.parentName : existing.parentName,
          excludeStudentId: id,
        });
      }

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

          // If groupIds was not explicitly passed, cascade deactivation to active group enrollments for deleted courses
          if (groupIds === undefined) {
            await db
              .update(studentGroupEnrollments)
              .set({ status: "inactive", leftAt: new Date() })
              .where(
                and(
                  eq(studentGroupEnrollments.studentId, id),
                  inArray(studentGroupEnrollments.courseId, toDelete),
                  eq(studentGroupEnrollments.status, "active"),
                ),
              );
          }
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

      if (groupIds !== undefined) {
        const targetGroupIds = new Set(groupIds);

        // Fetch current active group enrollments
        const currentGroupEnrollments = await db
          .select()
          .from(studentGroupEnrollments)
          .where(
            and(
              eq(studentGroupEnrollments.studentId, id),
              eq(studentGroupEnrollments.status, "active"),
            ),
          );

        // Deactivate groups not in groupIds
        for (const enr of currentGroupEnrollments) {
          if (!targetGroupIds.has(enr.groupId)) {
            await db
              .update(studentGroupEnrollments)
              .set({ status: "inactive", leftAt: new Date() })
              .where(eq(studentGroupEnrollments.id, enr.id));
          }
        }

        // Activate or insert new groups
        if (groupIds.length > 0) {
          const targetGroups = await db
            .select({ id: groups.id, courseId: groups.courseId })
            .from(groups)
            .where(inArray(groups.id, groupIds));

          const activeCourseSet = new Set(
            courseIds !== undefined
              ? courseIds
              : (
                  await db
                    .select({ courseId: studentCourseProgress.courseId })
                    .from(studentCourseProgress)
                    .where(eq(studentCourseProgress.studentId, id))
                ).map((c) => c.courseId),
          );

          for (const grp of targetGroups) {
            if (!activeCourseSet.has(grp.courseId)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Studentul trebuie să fie mai întâi înscris în cursul respectiv înainte de a fi adăugat într-o grupă.",
              });
            }
          }

          for (const grp of targetGroups) {
            await db
              .insert(studentGroupEnrollments)
              .values({
                studentId: id,
                groupId: grp.id,
                courseId: grp.courseId,
                status: "active",
                joinedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [studentGroupEnrollments.studentId, studentGroupEnrollments.groupId],
                set: { status: "active", leftAt: null, courseId: grp.courseId },
              });
          }
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
      const { isSuper, isAdmin, isTeacher } = getStudentRoles(user);

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.courseIds && input.courseIds.length > 1) {
        await checkStudentCourseConflicts(db, input.courseIds);
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
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți modifica un student din altă școală" });
      }

      const existingEnrollments = await db
        .select()
        .from(studentCourseProgress)
        .where(eq(studentCourseProgress.studentId, input.studentId));

      const activeGroupEnrollments = await db
        .select({ id: studentGroupEnrollments.id, courseId: studentGroupEnrollments.courseId })
        .from(studentGroupEnrollments)
        .where(
          and(
            eq(studentGroupEnrollments.studentId, input.studentId),
            eq(studentGroupEnrollments.status, "active"),
          ),
        );

      const existingProgressList = Array.isArray(existingEnrollments) ? existingEnrollments : [];
      const activeGroupList = Array.isArray(activeGroupEnrollments) ? activeGroupEnrollments : [];

      const uniqueCourseIds = Array.from(new Set(input.courseIds));
      const existingIds = new Set(existingProgressList.map((e) => e.courseId));
      const targetIds = new Set(uniqueCourseIds);

      const allExistingCourseIds = new Set([
        ...existingProgressList.map((e) => e.courseId),
        ...activeGroupList.map((g) => g.courseId).filter((cid): cid is number => cid !== null),
      ]);

      const toRemoveCourseIds = Array.from(allExistingCourseIds).filter((cid) => !targetIds.has(cid));
      if (toRemoveCourseIds.length > 0) {
        await db
          .delete(studentCourseProgress)
          .where(
            and(
              eq(studentCourseProgress.studentId, input.studentId),
              inArray(studentCourseProgress.courseId, toRemoveCourseIds),
            ),
          );

        // Deactivate active group enrollments for the removed courses
        await db
          .update(studentGroupEnrollments)
          .set({ status: "inactive", leftAt: new Date() })
          .where(
            and(
              eq(studentGroupEnrollments.studentId, input.studentId),
              inArray(studentGroupEnrollments.courseId, toRemoveCourseIds),
              eq(studentGroupEnrollments.status, "active"),
            ),
          );
      }

      const toInsert = uniqueCourseIds.filter((cid) => !existingIds.has(cid));
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
      const { isSuper, isAdmin, isTeacher } = getStudentRoles(user);

      if (!isSuper && !isAdmin && !isTeacher) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu ai permisiunea de a șterge studenți" });
      }

      const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
      }

      if (!isSuper && !isTeacher && isAdmin && existing.schoolId !== user.schoolId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți șterge un student din altă școală" });
      }

      await db.delete(students).where(eq(students.id, input.id));

      return { success: true };
    }),

  // Search students globally (by student name/phone, parent name/phone)
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const user = ctx.user;
      const permissions = user.permissions || [];
      const role = user.role;

      const isSuper = permissions.includes("super") || role === "superadmin";
      const isAdmin = permissions.includes("admin") || role === "admin";
      const isTeacher = permissions.includes("teach") || role === "teacher";

      // Only authenticated staff with a valid role can search
      if (!isSuper && !isAdmin && !isTeacher) {
        return [];
      }

      // Non-super users MUST have a schoolId to enforce tenant isolation
      if (!isSuper && !user.schoolId) {
        return [];
      }

      const rawQuery = input.query.trim();
      if (!rawQuery) return [];

      const searchConditions = [
        ilike(students.name, `%${rawQuery}%`),
        ilike(students.parentName, `%${rawQuery}%`),
        ilike(students.phone, `%${rawQuery}%`),
        ilike(students.parentPhone, `%${rawQuery}%`),
      ];

      // Strip non-digit characters to match partial phone numbers (e.g., last 4-6 digits)
      const digitsOnly = rawQuery.replace(/\D/g, "");
      if (digitsOnly.length >= 3 && digitsOnly !== rawQuery) {
        searchConditions.push(ilike(students.phone, `%${digitsOnly}%`));
        searchConditions.push(ilike(students.parentPhone, `%${digitsOnly}%`));
      }

      const whereConditions = [or(...searchConditions)];

      // Enforce school-scoped access for ALL non-super users (admin AND teacher)
      if (!isSuper && user.schoolId) {
        whereConditions.push(eq(students.schoolId, user.schoolId));
      }

      const matchingStudents = await db
        .select()
        .from(students)
        .where(and(...whereConditions))
        .orderBy(asc(students.name))
        .limit(input.limit);

      if (matchingStudents.length === 0) return [];

      const studentIds = matchingStudents.map((s) => s.id);

      // Fetch active group enrollments with group & course info
      const groupEnrollments = await db
        .select({
          studentId: studentGroupEnrollments.studentId,
          groupId: groups.id,
          groupName: groups.name,
          courseId: courses.id,
          courseName: courses.name,
        })
        .from(studentGroupEnrollments)
        .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .where(
          and(
            inArray(studentGroupEnrollments.studentId, studentIds),
            eq(studentGroupEnrollments.status, "active"),
          ),
        );

      // Fetch direct course enrollments
      const courseProgressRows = await db
        .select({
          studentId: studentCourseProgress.studentId,
          courseId: courses.id,
          courseName: courses.name,
        })
        .from(studentCourseProgress)
        .innerJoin(courses, eq(studentCourseProgress.courseId, courses.id))
        .where(inArray(studentCourseProgress.studentId, studentIds));

      const groupsMap = new Map<number, Array<{ id: number; name: string; courseName: string }>>();
      for (const ge of groupEnrollments) {
        const list = groupsMap.get(ge.studentId) || [];
        list.push({ id: ge.groupId, name: ge.groupName, courseName: ge.courseName });
        groupsMap.set(ge.studentId, list);
      }

      const coursesMap = new Map<number, Array<{ id: number; name: string }>>();
      for (const cp of courseProgressRows) {
        const list = coursesMap.get(cp.studentId) || [];
        if (!list.some((c) => c.id === cp.courseId)) {
          list.push({ id: cp.courseId, name: cp.courseName });
        }
        coursesMap.set(cp.studentId, list);
      }

      return matchingStudents.map((s) => ({
        ...s,
        groups: groupsMap.get(s.id) || [],
        courses: coursesMap.get(s.id) || [],
      }));
    }),
});
