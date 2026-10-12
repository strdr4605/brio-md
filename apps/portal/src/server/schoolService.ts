import { db } from "@/lib/db";
import { schools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type UpdateSchoolDetailsInput = {
  schoolId?: number;
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  bankName?: string | null;
  iban?: string | null;
  fiscalCode?: string | null;
};

export async function getSchoolDetailsService(schoolId: number) {
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Campusul școlar nu a fost găsit",
    });
  }

  return school;
}

export async function updateSchoolDetailsService(
  targetSchoolId: number,
  data: Omit<UpdateSchoolDetailsInput, "schoolId">,
) {
  await getSchoolDetailsService(targetSchoolId);

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.address !== undefined) updates.address = data.address?.trim() || null;
  if (data.phone !== undefined) updates.phone = data.phone?.trim() || null;
  if (data.email !== undefined) updates.email = data.email?.trim() || null;
  if (data.bankName !== undefined) updates.bankName = data.bankName?.trim() || null;
  if (data.iban !== undefined) updates.iban = data.iban?.trim() || null;
  if (data.fiscalCode !== undefined) updates.fiscalCode = data.fiscalCode?.trim() || null;

  const [updated] = await db
    .update(schools)
    .set(updates)
    .where(eq(schools.id, targetSchoolId))
    .returning();

  return updated;
}
