import { db } from "@/lib/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";

type AuthUserContext = {
  id: string;
  role?: string | null;
  permissions?: string[] | null;
  schoolId?: number | null;
};

function getAuthRoles(user?: AuthUserContext | null) {
  const permissions = user?.permissions || [];
  const role = user?.role;
  return {
    isSuper: permissions.includes("super") || role === "superadmin",
    isAdmin: permissions.includes("admin") || role === "admin",
    isTeacher: permissions.includes("teach") || role === "teacher",
  };
}

export function generateStudentPassword(): string {
  // 6 digits prefixed with Brio -> e.g. Brio592814
  const numPart = Math.floor(100000 + Math.random() * 900000);
  return `Brio${numPart}`;
}

export async function getStudentLmsAccess(
  user: AuthUserContext | undefined | null,
  studentId: number,
) {
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const { isSuper, isAdmin, isTeacher } = getAuthRoles(user);

  if (!isSuper && !isAdmin && !isTeacher) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu ai permisiuni pentru a vizualiza datele de acces LMS.",
    });
  }

  const [student] = await db
    .select({ id: students.id, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit." });
  }

  if (!isSuper && user.schoolId && student.schoolId !== user.schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu ai permisiuni pentru elevii din altă școală.",
    });
  }

  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
      lastChangedAt: users.lastChangedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.studentId, studentId))
    .limit(1);

  if (!existingUser) {
    return {
      hasAccess: false,
      user: null,
    };
  }

  return {
    hasAccess: true,
    user: existingUser,
  };
}

export async function provisionStudentLmsAccess(
  user: AuthUserContext | undefined | null,
  input: { studentId: number; password?: string },
) {
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const { isSuper, isAdmin } = getAuthRoles(user);

  if (!isSuper && !isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Doar administratorii pot genera sau reseta credențialele LMS.",
    });
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1);

  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit." });
  }

  if (!isSuper && student.schoolId !== user.schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu ai permisiuni pentru elevii din altă școală.",
    });
  }

  const plainPassword = input.password?.trim() || generateStudentPassword();
  if (plainPassword.length < 6) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Parola trebuie să aibă cel puțin 6 caractere.",
    });
  }

  const passwordHash = await hash(plainPassword, 12);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.studentId, student.id))
    .limit(1);

  if (existingUser) {
    // Reset credentials for existing user
    const [updated] = await db
      .update(users)
      .set({
        passwordHash,
        name: student.name,
        active: true,
        lastChangedAt: new Date(),
        phone: student.phone || student.parentPhone || existingUser.phone,
      })
      .where(eq(users.id, existingUser.id))
      .returning();

    return {
      success: true,
      isReset: true,
      username: updated.email ?? "",
      password: plainPassword,
      studentName: student.name,
      studentId: student.id,
    };
  }

  // Generate unique username / email: elev{studentId}@brio.md
  let candidateUsername = `elev${student.id}@brio.md`;
  let suffix = 0;
  while (true) {
    const [emailCollision] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, candidateUsername))
      .limit(1);

    if (!emailCollision) break;
    suffix++;
    candidateUsername = `elev${student.id}.${suffix}@brio.md`;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: candidateUsername,
      passwordHash,
      name: student.name,
      role: "student",
      permissions: [],
      courseIds: [],
      studentId: student.id,
      schoolId: student.schoolId,
      phone: student.phone || student.parentPhone || null,
      active: true,
      lastChangedAt: new Date(),
    })
    .returning();

  return {
    success: true,
    isReset: false,
    username: newUser.email ?? candidateUsername,
    password: plainPassword,
    studentName: student.name,
    studentId: student.id,
  };
}
