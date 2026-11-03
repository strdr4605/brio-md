import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeMoldovanPhone,
  bulkImportStudentsService,
  type BulkImportCandidate,
} from "./studentBulkImportService";

describe("studentBulkImportService", () => {
  describe("normalizeMoldovanPhone", () => {
    it("converts 9-digit local phone with leading 0 to international format", () => {
      expect(normalizeMoldovanPhone("069123456")).toBe("+37369123456");
      expect(normalizeMoldovanPhone("079987654")).toBe("+37379987654");
    });

    it("converts 8-digit phone without leading 0 to international format", () => {
      expect(normalizeMoldovanPhone("69123456")).toBe("+37369123456");
      expect(normalizeMoldovanPhone("78000111")).toBe("+37378000111");
    });

    it("handles phone already prefixed with 373", () => {
      expect(normalizeMoldovanPhone("37369123456")).toBe("+37369123456");
      expect(normalizeMoldovanPhone("+37369123456")).toBe("+37369123456");
    });

    it("strips whitespace, dashes, and parentheses", () => {
      expect(normalizeMoldovanPhone("(069) 12-34-56")).toBe("+37369123456");
      expect(normalizeMoldovanPhone("+373 79 112 233")).toBe("+37379112233");
    });

    it("returns null for empty or invalid input", () => {
      expect(normalizeMoldovanPhone("")).toBeNull();
      expect(normalizeMoldovanPhone(null)).toBeNull();
      expect(normalizeMoldovanPhone(undefined)).toBeNull();
      expect(normalizeMoldovanPhone("abc")).toBeNull();
    });
  });

  describe("bulkImportStudentsService", () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        lastValues: [] as any[],
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockImplementation(function (this: any, val: any) {
          mockDb.lastValues = val;
          return mockDb;
        }),
        returning: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(mockDb.lastValues.map((_: any, i: number) => ({ id: i + 1 })));
        }),
      };
    });

    it("imports valid student candidates and normalizes phone numbers", async () => {
      const candidates: BulkImportCandidate[] = [
        {
          name: "Ion Creangă",
          phone: "069111222",
          parentName: "Maria Creangă",
          parentPhone: "079333444",
          age: 14,
        },
        {
          name: "Mihai Eminescu",
          phone: "+37368555666",
          parentName: "Gheorghe Eminescu",
          parentPhone: null,
          age: 16,
        },
      ];

      const res = await bulkImportStudentsService({
        schoolId: 1,
        candidates,
        db: mockDb,
      });

      expect(res.total).toBe(2);
      expect(res.imported).toBe(2);
      expect(res.skipped).toBe(0);
      expect(res.errors).toHaveLength(0);
    });

    it("skips records without any valid contact phone", async () => {
      const candidates: BulkImportCandidate[] = [
        {
          name: "Student Without Phone",
          phone: "",
          parentPhone: null,
        },
      ];

      const res = await bulkImportStudentsService({
        schoolId: 1,
        candidates,
        db: mockDb,
      });

      expect(res.total).toBe(1);
      expect(res.imported).toBe(0);
      expect(res.skipped).toBe(1);
      expect(res.errors[0]).toContain("Este necesar cel puțin un număr de telefon valid");
    });

    it("filters out duplicates within the import batch", async () => {
      const candidates: BulkImportCandidate[] = [
        { name: "Ana Blandiana", phone: "069000111" },
        { name: "Ana Blandiana", phone: "069000111" }, // Duplicate
      ];

      const res = await bulkImportStudentsService({
        schoolId: 1,
        candidates,
        db: mockDb,
      });

      expect(res.total).toBe(2);
      expect(res.imported).toBe(1);
      expect(res.skipped).toBe(1);
      expect(res.duplicates).toContain("Ana Blandiana");
    });
  });
});
