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
});
