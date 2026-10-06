import { db } from "@/lib/db";
import { courses, groups } from "@brio-md/db";
import { eq } from "drizzle-orm";
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

  // Multi-tenancy enforcement: School admins cannot manage courses of another school
  if (isSchoolAdmin && user.schoolId && course.schoolId && course.schoolId !== user.schoolId) {
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
  teacherUserId?: number | null,
  schoolId?: number | null,
) {
  const existingGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.courseId, courseId));

  if (existingGroups.length > 0) {
    if (teacherUserId) {
      const teacherGroup = existingGroups.find((g) => g.teacherId === teacherUserId);
      if (teacherGroup) return teacherGroup;
    }
    return existingGroups[0];
  }

  // Create default group for this course if none exists
  const [createdGroup] = await db
    .insert(groups)
    .values({
      name: `Grupă Curs #${courseId}`,
      courseId,
      schoolId: schoolId || null,
      teacherId: teacherUserId || null,
    })
    .returning();

  return createdGroup;
}
