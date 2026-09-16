import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  parseTimeRange,
  areTimesOverlapping,
  getOverlappingDays,
  detectGroupConflicts,
  detectCourseScheduleConflicts,
  detectStudentGroupScheduleConflicts,
} from "@/lib/scheduleConflicts";
import {
  checkGroupConflicts,
  checkCourseNameConflict,
  checkStudentCourseConflicts,
  checkStudentGroupConflicts,
} from "./conflictChecker";

describe("scheduleConflicts pure functions", () => {
  describe("parseTimeRange", () => {
    it("correctly parses valid time strings", () => {
      expect(parseTimeRange("17:30 - 18:30")).toEqual([1050, 1110]);
      expect(parseTimeRange("09:00 - 10:30")).toEqual([540, 630]);
      expect(parseTimeRange("9:00 - 10:30")).toEqual([540, 630]);
      expect(parseTimeRange("14:00-15:30")).toEqual([840, 930]);
    });

    it("returns null for invalid time strings", () => {
      expect(parseTimeRange(null)).toBeNull();
      expect(parseTimeRange("")).toBeNull();
      expect(parseTimeRange("invalid time")).toBeNull();
      expect(parseTimeRange("25:00 - 10:00")).toBeNull();
      expect(parseTimeRange("10:70 - 11:00")).toBeNull();
    });
  });

  describe("areTimesOverlapping", () => {
    it("detects overlapping intervals", () => {
      const t1: [number, number] = [1050, 1110]; // 17:30 - 18:30
      const t2: [number, number] = [1080, 1140]; // 18:00 - 19:00
      expect(areTimesOverlapping(t1, t2)).toBe(true);
    });

    it("does not flag contiguous back-to-back times as overlapping", () => {
      const t1: [number, number] = [1050, 1110]; // 17:30 - 18:30
      const t2: [number, number] = [1110, 1170]; // 18:30 - 19:30
      expect(areTimesOverlapping(t1, t2)).toBe(false);
      expect(areTimesOverlapping(t2, t1)).toBe(false);
    });

    it("does not flag non-overlapping separate intervals", () => {
      const t1: [number, number] = [540, 630]; // 09:00 - 10:30
      const t2: [number, number] = [840, 930]; // 14:00 - 15:30
      expect(areTimesOverlapping(t1, t2)).toBe(false);
    });

    it("detects fully enclosed intervals", () => {
      const outer: [number, number] = [600, 720]; // 10:00 - 12:00
      const inner: [number, number] = [630, 690]; // 10:30 - 11:30
      expect(areTimesOverlapping(outer, inner)).toBe(true);
      expect(areTimesOverlapping(inner, outer)).toBe(true);
    });
  });

  describe("getOverlappingDays", () => {
    it("identifies matching days", () => {
      expect(getOverlappingDays(["mon", "wed"], ["mon", "fri"])).toEqual(["mon"]);
      expect(getOverlappingDays(["tue", "thu"], ["mon", "wed"])).toEqual([]);
    });

    it("normalizes romanian day names to matching codes", () => {
      expect(getOverlappingDays(["Luni", "Miercuri"], ["mon", "fri"])).toEqual(["mon"]);
    });
  });

  describe("detectGroupConflicts", () => {
    const existingGroups = [
      {
        id: 1,
        name: "Grupa Robotică A",
        courseId: 10,
        courseName: "Robotică",
        room: "Sala 204",
        teacherId: 5,
        scheduleDays: ["mon", "wed"],
        scheduleTime: "17:30 - 18:30",
        active: true,
      },
      {
        id: 2,
        name: "Grupa Programare B",
        courseId: 20,
        courseName: "Programare",
        room: "Lab 1",
        teacherId: 6,
        scheduleDays: ["tue", "thu"],
        scheduleTime: "16:00 - 17:30",
        active: true,
      },
      {
        id: 3,
        name: "Grupa Arhivată",
        courseId: 10,
        courseName: "Robotică",
        room: "Sala 204",
        teacherId: 5,
        scheduleDays: ["mon", "wed"],
        scheduleTime: "17:30 - 18:30",
        active: false,
      },
    ];

    it("flags duplicate group name in the same course", () => {
      const warnings = detectGroupConflicts({
        name: "grupa robotică a", // case-insensitive duplicate
        courseId: 10,
        existingGroups,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("name");
    });

    it("allows same group name in a different course", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Robotică A",
        courseId: 99,
        existingGroups,
      });
      expect(warnings).toHaveLength(0);
    });

    it("flags room double-booking on overlapping day and time", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Noua",
        courseId: 20,
        room: "sala 204",
        scheduleDays: ["mon"],
        scheduleTime: "18:00 - 19:00", // overlaps with 17:30 - 18:30
        existingGroups,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("room");
    });

    it("allows same room on a different day", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Noua",
        courseId: 20,
        room: "Sala 204",
        scheduleDays: ["fri"], // Friday does not clash with Mon/Wed
        scheduleTime: "17:30 - 18:30",
        existingGroups,
      });
      expect(warnings).toHaveLength(0);
    });

    it("allows same room for contiguous non-overlapping time", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Noua",
        courseId: 20,
        room: "Sala 204",
        scheduleDays: ["mon"],
        scheduleTime: "18:30 - 19:30", // starts exactly when previous ends
        existingGroups,
      });
      expect(warnings).toHaveLength(0);
    });

    it("flags teacher double-booking on overlapping day and time", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Noua",
        courseId: 20,
        teacherId: 5,
        scheduleDays: ["wed"],
        scheduleTime: "17:00 - 18:00",
        existingGroups,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("teacher");
    });

    it("flags inverted time ranges", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Test",
        courseId: 10,
        scheduleTime: "19:00 - 17:00",
        existingGroups,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("time");
    });

    it("ignores archived/inactive groups when checking conflicts", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Arhivată",
        courseId: 10,
        existingGroups,
      });
      // Group 3 is inactive, so no name collision
      expect(warnings).toHaveLength(0);
    });

    it("ignores self when excludeGroupId is provided", () => {
      const warnings = detectGroupConflicts({
        name: "Grupa Robotică A",
        courseId: 10,
        excludeGroupId: 1, // editing itself
        room: "Sala 204",
        teacherId: 5,
        scheduleDays: ["mon"],
        scheduleTime: "17:30 - 18:30",
        existingGroups,
      });
      expect(warnings).toHaveLength(0);
    });
  });
});

describe("checkCourseNameConflict", () => {
  it("throws BAD_REQUEST if a course with same name exists", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, name: "Robotics 101" }]),
          }),
        }),
      }),
    };

    await expect(
      checkCourseNameConflict(mockDb as any, {
        schoolId: 1,
        name: "Robotics 101",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("passes when no matching course is found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    await expect(
      checkCourseNameConflict(mockDb as any, {
        schoolId: 1,
        name: "Unique New Course",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("checkGroupConflicts server function", () => {
  it("throws BAD_REQUEST when time interval is inverted", async () => {
    const mockDb = {} as any;
    await expect(
      checkGroupConflicts(mockDb, {
        courseId: 1,
        name: "Valid Name",
        scheduleTime: "18:00 - 16:00",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when room is double-booked", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                id: 10,
                name: "Grupa Existenta",
                courseId: 1,
                courseName: "Curs 1",
                room: "Sala 101",
                teacherId: 2,
                scheduleDays: ["mon"],
                scheduleTime: "10:00 - 11:30",
                active: true,
              },
            ]),
          }),
        }),
      }),
    };

    await expect(
      checkGroupConflicts(mockDb as any, {
        courseId: 1,
        name: "Grupa Noua",
        room: "Sala 101",
        scheduleDays: ["mon"],
        scheduleTime: "10:30 - 12:00",
      }),
    ).rejects.toThrow("Conflict de sală");
  });
});

describe("detectCourseScheduleConflicts", () => {
  it("flags conflict when two selected courses share days and have overlapping times", () => {
    const courses = [
      {
        id: 1,
        name: "Robotică",
        scheduleDays: ["mon", "wed"],
        scheduleTime: "17:30 - 18:30",
      },
      {
        id: 2,
        name: "Programare Python",
        scheduleDays: ["mon", "fri"],
        scheduleTime: "18:00 - 19:30",
      },
    ];

    const warnings = detectCourseScheduleConflicts(courses);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("Conflict de orar");
    expect(warnings[0].message).toContain("Robotică");
    expect(warnings[0].message).toContain("Programare Python");
  });

  it("passes when courses are on different days", () => {
    const courses = [
      {
        id: 1,
        name: "Robotică",
        scheduleDays: ["mon"],
        scheduleTime: "17:30 - 18:30",
      },
      {
        id: 2,
        name: "Programare Python",
        scheduleDays: ["tue"],
        scheduleTime: "17:30 - 18:30",
      },
    ];

    const warnings = detectCourseScheduleConflicts(courses);
    expect(warnings).toHaveLength(0);
  });

  it("passes when courses are back-to-back at contiguous times", () => {
    const courses = [
      {
        id: 1,
        name: "Robotică",
        scheduleDays: ["mon"],
        scheduleTime: "17:30 - 18:30",
      },
      {
        id: 2,
        name: "Programare Python",
        scheduleDays: ["mon"],
        scheduleTime: "18:30 - 19:30",
      },
    ];

    const warnings = detectCourseScheduleConflicts(courses);
    expect(warnings).toHaveLength(0);
  });
});

describe("detectStudentGroupScheduleConflicts", () => {
  it("flags conflict when target groups overlap between themselves", () => {
    const targetGroups = [
      {
        id: 10,
        name: "Grupa A",
        courseName: "Robotică",
        scheduleDays: ["tue"],
        scheduleTime: "15:00 - 16:30",
      },
      {
        id: 20,
        name: "Grupa B",
        courseName: "Engleză",
        scheduleDays: ["tue"],
        scheduleTime: "16:00 - 17:30",
      },
    ];

    const warnings = detectStudentGroupScheduleConflicts({ targetGroups });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("Grupa A");
    expect(warnings[0].message).toContain("Grupa B");
  });

  it("flags conflict when a target group overlaps with an already enrolled active group", () => {
    const targetGroups = [
      {
        id: 10,
        name: "Grupa Nouă",
        courseName: "Matematică",
        scheduleDays: ["fri"],
        scheduleTime: "14:00 - 15:30",
      },
    ];
    const existingGroups = [
      {
        id: 5,
        name: "Grupa Veche",
        courseName: "Fizică",
        scheduleDays: ["fri"],
        scheduleTime: "14:30 - 16:00",
        active: true,
      },
    ];

    const warnings = detectStudentGroupScheduleConflicts({ targetGroups, existingGroups });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("Grupa Veche");
    expect(warnings[0].message).toContain("Grupa Nouă");
  });
});

describe("checkStudentCourseConflicts server function", () => {
  it("throws BAD_REQUEST when student courses conflict", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, name: "Curs 1", scheduleDays: ["mon"], scheduleTime: "17:00 - 18:00" },
            { id: 2, name: "Curs 2", scheduleDays: ["mon"], scheduleTime: "17:30 - 18:30" },
          ]),
        }),
      }),
    };

    await expect(checkStudentCourseConflicts(mockDb as any, [1, 2])).rejects.toThrow(TRPCError);
  });
});

describe("checkStudentGroupConflicts server function", () => {
  it("throws BAD_REQUEST when student group enrollments conflict", async () => {
    const mockDb = {
      select: vi.fn()
        // First call: target groups
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                { id: 10, name: "G1", courseName: "C1", scheduleDays: ["wed"], scheduleTime: "10:00 - 11:30" },
              ]),
            }),
          }),
        })
        // Second call: existing enrollments
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                  { id: 20, name: "G2", courseName: "C2", scheduleDays: ["wed"], scheduleTime: "11:00 - 12:30" },
                ]),
              }),
            }),
          }),
        }),
    };

    await expect(
      checkStudentGroupConflicts(mockDb as any, { studentId: 1, groupIds: [10] }),
    ).rejects.toThrow(TRPCError);
  });
});
