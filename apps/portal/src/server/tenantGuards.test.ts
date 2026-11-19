import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertSchoolScope, getTeacherAssignedStudentIds } from "./tenantGuards";

describe("tenantGuards (Issue #271)", () => {
  describe("assertSchoolScope", () => {
    it("throws UNAUTHORIZED if user is null or undefined", () => {
      expect(() => assertSchoolScope(null, 1)).toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      );
      expect(() => assertSchoolScope(undefined, 1)).toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      );
    });

    it("allows superadmin access regardless of schoolId", () => {
      expect(() =>
        assertSchoolScope(
          { id: "1", role: "superadmin", permissions: ["super"], schoolId: null },
          42,
        ),
      ).not.toThrow();

      expect(() =>
        assertSchoolScope(
          { id: "2", role: "admin", permissions: ["super"], schoolId: 1 },
          99,
        ),
      ).not.toThrow();
    });

    it("allows non-superadmin access when schoolId matches targetSchoolId", () => {
      expect(() =>
        assertSchoolScope(
          { id: "10", role: "admin", permissions: ["admin"], schoolId: 5 },
          5,
        ),
      ).not.toThrow();

      expect(() =>
        assertSchoolScope(
          { id: "11", role: "teacher", permissions: ["teach"], schoolId: 3 },
          3,
        ),
      ).not.toThrow();
    });

    it("throws FORBIDDEN when user schoolId does not match targetSchoolId", () => {
      expect(() =>
        assertSchoolScope(
          { id: "10", role: "admin", permissions: ["admin"], schoolId: 5 },
          6,
        ),
      ).toThrow(TRPCError);
    });

    it("throws FORBIDDEN when user schoolId is null or missing", () => {
      expect(() =>
        assertSchoolScope(
          { id: "10", role: "admin", permissions: ["admin"], schoolId: null },
          5,
        ),
      ).toThrow(TRPCError);
    });

    it("throws FORBIDDEN when targetSchoolId is null or missing", () => {
      expect(() =>
        assertSchoolScope(
          { id: "10", role: "admin", permissions: ["admin"], schoolId: 5 },
          null,
        ),
      ).toThrow(TRPCError);
    });
  });

  describe("getTeacherAssignedStudentIds", () => {
    it("returns empty array for invalid or non-positive userId", async () => {
      expect(await getTeacherAssignedStudentIds(0)).toEqual([]);
      expect(await getTeacherAssignedStudentIds(-1)).toEqual([]);
      expect(await getTeacherAssignedStudentIds("invalid")).toEqual([]);
    });

    it("aggregates student IDs from groups and courses assigned to the teacher", async () => {
      const mockDatabase = {
        select: vi
          .fn()
          // First query: group-assigned students
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                  { studentId: 101 },
                  { studentId: 102 },
                ]),
              }),
            }),
          })
          // Second query: course-assigned students
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                  { studentId: 102 }, // Duplicate to test deduplication
                  { studentId: 103 },
                ]),
              }),
            }),
          }),
      };

      const result = await getTeacherAssignedStudentIds(7, [10], mockDatabase as any);
      expect(result).toEqual([101, 102, 103]);
    });
  });
});
