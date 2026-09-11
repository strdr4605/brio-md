import { parsePhoneNumber, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

/**
 * Validates whether a phone number is valid according to international standards (Google libphonenumber).
 * Supports Republic of Moldova as default country ('MD') when country code is omitted,
 * and any international country code when prefixed with '+' or entered in international format.
 */
export function isValidPhone(phone?: string | null, defaultCountry: CountryCode = "MD"): boolean {
  if (!phone || !phone.trim()) return true;

  try {
    const parsed = parsePhoneNumber(phone.trim(), defaultCountry);
    return parsed ? parsed.isValid() : false;
  } catch {
    return false;
  }
}

/**
 * Normalizes a phone number to standard E.164 international format (+373XXXXXXXX, +40XXXXXXXXX, etc.).
 */
export function normalizePhone(phone?: string | null, defaultCountry: CountryCode = "MD"): string {
  if (!phone || !phone.trim()) return "";

  try {
    const parsed = parsePhoneNumber(phone.trim(), defaultCountry);
    return parsed ? parsed.number : phone.trim();
  } catch {
    return phone.trim();
  }
}

/**
 * Formats a phone number for clean UI display using official international standards.
 * Example: +37360000000 -> +373 600 00 000, +40712345678 -> +40 712 345 678
 */
export function formatPhone(phone?: string | null, defaultCountry: CountryCode = "MD"): string {
  if (!phone || !phone.trim()) return "-";

  try {
    const parsed = parsePhoneNumber(phone.trim(), defaultCountry);
    return parsed ? parsed.formatInternational() : phone.trim();
  } catch {
    return phone.trim();
  }
}

/**
 * Reusable Zod schema for phone fields.
 * Preserves `undefined` when omitted (so updates don't overwrite existing phones with null).
 * Converts null or blank strings to null.
 * Normalizes valid phones to E.164.
 */
export const phoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine((val) => !val || isValidPhone(val), {
    message: "Format telefon invalid. Exemplu: +373 69 000 000, +40 712 345 678 sau 069000000",
  })
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null || !val.trim()) return null;
    return normalizePhone(val);
  });
