import { TRPCError } from "@trpc/server";

type ScopedUser = { role: string; permissions?: string[] | null; schoolId?: number | null };

export function isSuperUser(user: ScopedUser) {
  return user.role === "superadmin" || (user.permissions ?? []).includes("super");
}

/**
 * Fail-closed school ownership check: non-superadmins must belong to a school
 * and the target record must belong to that same school.
 */
export function assertSchoolScope(
  user: ScopedUser,
  targetSchoolId: number | null | undefined,
  message = "Acces interzis: resursa aparține altei școli.",
) {
  if (isSuperUser(user)) return;
  if (!user.schoolId || !targetSchoolId || user.schoolId !== targetSchoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}
