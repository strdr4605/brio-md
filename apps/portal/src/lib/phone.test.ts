import { describe, it, expect } from "vitest";
import { isValidPhone, normalizePhone, formatPhone, phoneSchema } from "./phone";

describe("phone utilities with libphonenumber-js", () => {
  describe("isValidPhone", () => {
    it("allows null, undefined, or empty strings", () => {
      expect(isValidPhone(null)).toBe(true);
      expect(isValidPhone(undefined)).toBe(true);
      expect(isValidPhone("")).toBe(true);
      expect(isValidPhone("   ")).toBe(true);
    });

    it("accepts valid Moldovan mobile numbers (with +373, 0 prefix, or national digits)", () => {
      expect(isValidPhone("+37360000000")).toBe(true);
      expect(isValidPhone("+373 69 123 456")).toBe(true);
      expect(isValidPhone("060000000")).toBe(true);
      expect(isValidPhone("069123456")).toBe(true);
      expect(isValidPhone("69123456")).toBe(true);
    });

    it("accepts international numbers across multiple countries", () => {
      expect(isValidPhone("+40712345678")).toBe(true); // Romania
      expect(isValidPhone("+380991234567")).toBe(true); // Ukraine
      expect(isValidPhone("+393451234567")).toBe(true); // Italy
      expect(isValidPhone("+14155552671")).toBe(true); // USA
      expect(isValidPhone("+447911123456")).toBe(true); // UK
      expect(isValidPhone("+4915112345678")).toBe(true); // Germany
      expect(isValidPhone("+33612345678")).toBe(true); // France
    });

    it("rejects invalid or malformed numbers", () => {
      expect(isValidPhone("373738449")).toBe(false); // Incomplete
      expect(isValidPhone("123")).toBe(false);
      expect(isValidPhone("invalid-text")).toBe(false);
      expect(isValidPhone("+37312345678")).toBe(false); // 1 is invalid in MD
    });
  });

  describe("normalizePhone", () => {
    it("normalizes local Moldova numbers to E.164 (+373...)", () => {
      expect(normalizePhone("060000000")).toBe("+37360000000");
      expect(normalizePhone("069123456")).toBe("+37369123456");
      expect(normalizePhone("+373 69 123 456")).toBe("+37369123456");
    });

    it("normalizes international numbers to E.164", () => {
      expect(normalizePhone("+40 712 345 678")).toBe("+40712345678");
      expect(normalizePhone("+1 (415) 555-2671")).toBe("+14155552671");
    });

    it("returns empty string for empty input", () => {
      expect(normalizePhone("")).toBe("");
      expect(normalizePhone(null)).toBe("");
    });
  });

  describe("formatPhone", () => {
    it("formats Moldova numbers internationally", () => {
      expect(formatPhone("+37360000000")).toBe("+373 600 00 000");
      expect(formatPhone("060000000")).toBe("+373 600 00 000");
    });

    it("formats international numbers with standard grouping", () => {
      expect(formatPhone("+40712345678")).toBe("+40 712 345 678");
      expect(formatPhone("+393451234567")).toBe("+39 345 123 4567");
      expect(formatPhone("+14155552671")).toBe("+1 415 555 2671");
      expect(formatPhone("+447911123456")).toBe("+44 7911 123456");
      expect(formatPhone("+380991234567")).toBe("+380 99 123 4567");
    });

    it("returns dash for null or empty", () => {
      expect(formatPhone(null)).toBe("-");
      expect(formatPhone("")).toBe("-");
      expect(formatPhone(undefined)).toBe("-");
    });
  });

  describe("phoneSchema", () => {
    it("preserves undefined for omitted fields", () => {
      expect(phoneSchema.parse(undefined)).toBeUndefined();
    });

    it("converts null or blank string to null", () => {
      expect(phoneSchema.parse(null)).toBeNull();
      expect(phoneSchema.parse("")).toBeNull();
      expect(phoneSchema.parse("   ")).toBeNull();
    });

    it("validates and normalizes valid numbers", () => {
      expect(phoneSchema.parse("069123456")).toBe("+37369123456");
      expect(phoneSchema.parse("+40 712 345 678")).toBe("+40712345678");
    });

    it("throws validation error for invalid numbers", () => {
      const res = phoneSchema.safeParse("123");
      expect(res.success).toBe(false);
    });
  });
});
