import { eq, and, or, inArray } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { students } from "@/db/schema";

export type BulkImportCandidate = {
  name: string;
  phone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  age?: number | null;
  info?: string | null;
};

export type BulkImportResult = {
  total: number;
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: string[];
};

export function normalizeMoldovanPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // e.g. 069123456 (9 digits starting with 0)
  if (digits.length === 9 && digits.startsWith("0")) {
    return `+373${digits.slice(1)}`;
  }
  // e.g. 69123456 (8 digits starting with 6, 7, 2, etc.)
  if (digits.length === 8) {
    return `+373${digits}`;
  }
  // e.g. 37369123456 (11 digits starting with 373)
  if (digits.length === 11 && digits.startsWith("373")) {
    return `+${digits}`;
  }
  // Already formatted or other valid international
  return `+${digits}`;
}

export async function bulkImportStudentsService(params: {
  schoolId: number;
  candidates: BulkImportCandidate[];
  db?: typeof defaultDb;
}): Promise<BulkImportResult> {
  const activeDb = params.db || defaultDb;
  const { schoolId, candidates } = params;

  const result: BulkImportResult = {
    total: candidates.length,
    imported: 0,
    skipped: 0,
    duplicates: [],
    errors: [],
  };

  if (!schoolId) {
    result.errors.push("Niciun campus școlar asociat pentru import.");
    return result;
  }

  if (!candidates || candidates.length === 0) {
    return result;
  }

  // 1. Sanitize & Normalize records
  const validBatch: Array<{
    name: string;
    phone: string | null;
    parentName: string | null;
    parentPhone: string | null;
    age: number | null;
    info: string | null;
    schoolId: number;
    active: boolean;
  }> = [];

  const seenInBatch = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    const raw = candidates[i];
    const trimmedName = (raw.name || "").trim();

    if (!trimmedName) {
      result.skipped++;
      result.errors.push(`Rândul #${i + 1}: Numele studentului lipsește.`);
      continue;
    }

    const normPhone = normalizeMoldovanPhone(raw.phone);
    const normParentPhone = normalizeMoldovanPhone(raw.parentPhone);

    if (!normPhone && !normParentPhone) {
      result.skipped++;
      result.errors.push(`Rândul #${i + 1} (${trimmedName}): Este necesar cel puțin un număr de telefon valid.`);
      continue;
    }

    const batchKey = `${trimmedName.toLowerCase()}::${normPhone || ""}::${normParentPhone || ""}`;
    if (seenInBatch.has(batchKey)) {
      result.skipped++;
      result.duplicates.push(trimmedName);
      continue;
    }
    seenInBatch.add(batchKey);

    validBatch.push({
      name: trimmedName,
      phone: normPhone,
      parentName: raw.parentName?.trim() || null,
      parentPhone: normParentPhone,
      age: raw.age && raw.age > 0 && raw.age <= 120 ? Math.round(raw.age) : null,
      info: raw.info?.trim() || null,
      schoolId,
      active: true,
    });
  }

  if (validBatch.length === 0) {
    return result;
  }

  // 2. Check for existing students in this school to prevent duplicates
  const candidatePhones = validBatch
    .flatMap((s) => [s.phone, s.parentPhone])
    .filter((p): p is string => Boolean(p));

  const existingInDb = candidatePhones.length > 0
    ? await activeDb
        .select({
          id: students.id,
          name: students.name,
          phone: students.phone,
          parentPhone: students.parentPhone,
        })
        .from(students)
        .where(
          and(
            eq(students.schoolId, schoolId),
            or(
              inArray(students.phone, candidatePhones),
              inArray(students.parentPhone, candidatePhones),
            ),
          ),
        )
    : [];

  const existingDbKeys = new Set(
    existingInDb.map((s) => `${s.name.trim().toLowerCase()}::${s.phone || ""}::${s.parentPhone || ""}`),
  );
  const existingPhoneSet = new Set(existingInDb.flatMap((s) => [s.phone, s.parentPhone]).filter(Boolean));

  const toInsert: typeof validBatch = [];

  for (const item of validBatch) {
    const key = `${item.name.toLowerCase()}::${item.phone || ""}::${item.parentPhone || ""}`;
    if (existingDbKeys.has(key)) {
      result.skipped++;
      result.duplicates.push(item.name);
      continue;
    }

    // Also check if exact name and either phone already exists
    const hasSamePhone = (item.phone && existingPhoneSet.has(item.phone)) ||
                         (item.parentPhone && existingPhoneSet.has(item.parentPhone));
    const sameNameInDb = existingInDb.some((e) => e.name.trim().toLowerCase() === item.name.toLowerCase());

    if (hasSamePhone && sameNameInDb) {
      result.skipped++;
      result.duplicates.push(item.name);
      continue;
    }

    toInsert.push(item);
  }

  // 3. Batch insert
  if (toInsert.length > 0) {
    const insertedRows = await activeDb.insert(students).values(toInsert).returning({ id: students.id });
    result.imported = insertedRows.length;
  }

  return result;
}

