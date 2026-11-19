import { TRPCError } from "@trpc/server";
import { eq, and, or, inArray } from "drizzle-orm";
import {
  studentGroupEnrollments,
  groups,
  courses,
  studentCourseProgress,
} from "@/db/schema";
import { db as defaultDb } from "@/lib/db";

export type ScopedUser = {
  role?: string | null;
  permissions?: string[] | null;
  schoolId?: number | null;
  id?: string | number | null;
  courseIds?: number[] | null;
};

export type UserSession = ScopedUser;

export function isSuperUser(user?: ScopedUser | null) {
  if (!user) return false;
  return user.role === "superadmin" || (user.permissions ?? []).includes("super");
}

/**
 * Fail-closed school ownership check: non-superadmins must belong to a school
 * and the target record must belong to that same school.
 */
export function assertSchoolScope(
  user: ScopedUser | null | undefined,
  targetSchoolId: number | null | undefined,
  message = "Acces interzis: resursa aparține altei școli.",
) {
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (isSuperUser(user)) return;
  if (!user.schoolId || !targetSchoolId || user.schoolId !== targetSchoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}

/**
 * Returns the list of student IDs enrolled in groups or courses assigned to the teacher.
 */
export async function getTeacherAssignedStudentIds(
  userId: number | string,
  userCourseIds?: number[] | null,
  database = defaultDb,
): Promise<number[]> {
  const numericUserId = typeof userId === "string" ? parseInt(userId, 10) : Number(userId);
  if (isNaN(numericUserId) || numericUserId <= 0) return [];

  const courseIds = (userCourseIds || []).filter(
    (id): id is number => typeof id === "number" && !isNaN(id),
  );

  // 1. Group-assigned students: groups where groups.teacherId = user.id
  const groupStudents = await database
    .select({ studentId: studentGroupEnrollments.studentId })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .where(
      and(
        eq(groups.teacherId, numericUserId),
        eq(studentGroupEnrollments.status, "active"),
        eq(groups.active, true),
      ),
    );

  // 2. Course-assigned students: courses where courses.teacherId = user.id or courses.id IN (user.courseIds)
  const courseConditions = [eq(courses.teacherId, numericUserId)];
  if (courseIds.length > 0) {
    courseConditions.push(inArray(courses.id, courseIds));
  }

  const courseStudents = await database
    .select({ studentId: studentCourseProgress.studentId })
    .from(studentCourseProgress)
    .innerJoin(courses, eq(studentCourseProgress.courseId, courses.id))
    .where(and(or(...courseConditions), eq(courses.active, true)));

  const allIds = new Set<number>([
    ...groupStudents.map((s) => s.studentId),
    ...courseStudents.map((s) => s.studentId),
  ]);

  return Array.from(allIds);
}
