import { describe, it, expect } from "vitest";
import { ABSENCE_PRESET_CHIPS } from "@/components/dashboard/AbsenceCommentWidget";
import { formatPhone, normalizePhone, isValidPhone } from "@/lib/phone";

describe("Absence and Parent Call Widget Logic", () => {
  describe("ABSENCE_PRESET_CHIPS", () => {
    it("provides essential preset chips for quick 1-click teacher selection", () => {
      const labels = ABSENCE_PRESET_CHIPS.map((c) => c.label);
      expect(labels).toContain("Bolnav");
      expect(labels).toContain("Avertizat");
      expect(labels).toContain("Nemotivat");
      expect(labels).toContain("Familie");
      expect(labels).toContain("Vacanță");
    });

    it("has valid text templates for each chip", () => {
      for (const chip of ABSENCE_PRESET_CHIPS) {
        expect(chip.text.length).toBeGreaterThan(0);
        expect(chip.emoji.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Parent phone formatting for tel: links", () => {
    it("normalizes and formats Moldovan mobile numbers for dialing", () => {
      const raw = "068123456";
      expect(isValidPhone(raw)).toBe(true);

      const normalized = normalizePhone(raw);
      expect(normalized).toBe("+37368123456");

      const cleanForTel = normalized.replace(/[^\d+]/g, "");
      expect(`tel:${cleanForTel}`).toBe("tel:+37368123456");

      const formatted = formatPhone(raw);
      expect(formatted).toBe("+373 681 23 456");
    });

    it("handles international numbers correctly", () => {
      const international = "+40712345678";
      expect(isValidPhone(international)).toBe(true);

      const cleanForTel = international.replace(/[^\d+]/g, "");
      expect(`tel:${cleanForTel}`).toBe("tel:+40712345678");

      const formatted = formatPhone(international);
      expect(formatted).toBe("+40 712 345 678");
    });
  });

  describe("Attendance comment eligibility", () => {
    function canAddComment(status: "present" | "absent" | "late" | "excused", comment?: string | null) {
      return status === "absent" || status === "late" || status === "excused" || Boolean(comment);
    }

    it("allows adding comments for late, excused, and absent statuses", () => {
      expect(canAddComment("absent")).toBe(true);
      expect(canAddComment("late")).toBe(true);
      expect(canAddComment("excused")).toBe(true);
      expect(canAddComment("present")).toBe(false);
      expect(canAddComment("present", "Prezent cu mențiune")).toBe(true);
    });
  });

  describe("Teacher group isolation logic", () => {
    function filterGroupsForUser(
      groups: { id: number; teacherId: number | null }[],
      user: { id: string; role?: string; permissions?: string[] },
    ) {
      const isSuperOrAdmin =
        user.permissions?.includes("super") ||
        user.permissions?.includes("admin") ||
        user.role === "superadmin" ||
        user.role === "admin";

      if (isSuperOrAdmin) return groups;
      const currentUserId = Number(user.id);
      return groups.filter((g) => g.teacherId === currentUserId);
    }

    it("filters groups to only those assigned to the teacher", () => {
      const allGroups = [
        { id: 1, teacherId: 10 },
        { id: 2, teacherId: 20 },
        { id: 3, teacherId: 10 },
      ];

      const teacherUser = { id: "10", role: "teacher", permissions: ["teach"] };
      const teacherGroups = filterGroupsForUser(allGroups, teacherUser);

      expect(teacherGroups.map((g) => g.id)).toEqual([1, 3]);
    });

    it("allows superadmins and admins to view all groups", () => {
      const allGroups = [
        { id: 1, teacherId: 10 },
        { id: 2, teacherId: 20 },
      ];

      const adminUser = { id: "99", role: "admin", permissions: ["admin"] };
      expect(filterGroupsForUser(allGroups, adminUser)).toHaveLength(2);
    });
  });
});
