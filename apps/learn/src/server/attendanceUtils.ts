import { db } from "@/lib/db";
import { courses, groups } from "@brio-md/db";
import { and, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type SessionUserInfo = {
  id: string;
  role: string;
  permissions?: string[];
  courseIds?: number[];
  schoolId?: number | null;
};

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSuperAdmin(user: SessionUserInfo): boolean {
  return (
    user.role === "superadmin" ||
    user.permissions?.includes("super") ||
    false
  );
}

export function isPrivilegedUser(user: SessionUserInfo): boolean {
  return (
    isSuperAdmin(user) ||
    user.role === "admin" ||
    user.permissions?.includes("admin") ||
    false
  );
}

export function getUserCourseIds(user: SessionUserInfo): number[] {
  return (user.courseIds || [])
    .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
    .filter((id) => !isNaN(id));
}

export async function assertCourseTeacherAccess(
  courseId: number,
  user: SessionUserInfo,
) {
  const userId = parseInt(user.id, 10);
  const userCourseIds = getUserCourseIds(user);
  const isSuper = isSuperAdmin(user);
  const isSchoolAdmin = (user.role === "admin" || user.permissions?.includes("admin")) && !isSuper;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Course not found.",
    });
  }

  // Multi-tenancy enforcement: non-super users cannot manage courses outside their school
  if (!isSuper && user.schoolId && course.schoolId && course.schoolId !== user.schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to manage courses outside your school.",
    });
  }

  const isAssignedTeacher =
    (!isNaN(userId) && course.teacherId === userId) ||
    userCourseIds.includes(course.id);

  if (!isSuper && !isSchoolAdmin && !isAssignedTeacher) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to manage attendance for this course.",
    });
  }

  return course;
}

export async function resolveGroupForCourse(
  courseId: number,
  groupId: number,
) {
  if (!groupId || typeof groupId !== "number" || isNaN(groupId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Group ID is required to access attendance.",
    });
  }

  const queryResult: any = await db
    .select()
    .from(groups)
    .where(
      and(
        eq(groups.id, groupId),
        eq(groups.courseId, courseId),
        ne(groups.active, false),
      ),
    );

  let group = null;
  if (Array.isArray(queryResult)) {
    group = queryResult[0];
  } else if (queryResult && typeof queryResult.limit === "function") {
    const limited = await queryResult.limit(1);
    group = limited?.[0];
  }

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Specified group not found or does not belong to this course.",
    });
  }

  return group;
}
