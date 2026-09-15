import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { attendanceRouter } from "./attendance";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("attendanceRouter & Server-side Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const superUser = {
    id: "1",
    email: "super@example.com",
    name: "Super Admin",
    role: "superadmin",
    permissions: ["super"],
    courseIds: [],
    schoolId: 1,
  };

  const adminUser = {
    id: "2",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  };

  const assignedTeacher = {
    id: "10",
    email: "teacher10@example.com",
    name: "Assigned Teacher",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1],
    schoolId: 1,
  };

  const otherTeacher = {
    id: "99",
    email: "teacher99@example.com",
    name: "Other Teacher",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [2],
    schoolId: 1,
  };

  const testGroup = {
    id: 5,
    courseId: 1,
    schoolId: 1,
    name: "Robotics Tuesday 17:30",
    teacherId: 10, // Assigned to teacher 10
    active: true,
  };

  describe("attendance.submit authorization guard", () => {
    it("allows superadmin to submit attendance for any group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                groupId: 5,
                courseId: 1,
                studentId: 101,
                date: "2026-09-14",
                status: "present",
                comment: null,
                markedByUserId: 1,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: superUser });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 101, status: "present" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("allows admin to submit attendance for any group", async () => {
      // Mock finding the group
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      // Mock upsert
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                groupId: 5,
                courseId: 1,
                studentId: 101,
                date: "2026-09-14",
                status: "present",
                comment: null,
                markedByUserId: 2,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 101, status: "present" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("allows assigned teacher to submit attendance for their assigned group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 2,
                groupId: 5,
                courseId: 1,
                studentId: 102,
                date: "2026-09-14",
                status: "absent",
                comment: "Sick",
                markedByUserId: 10,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 102, status: "absent", comment: "Sick" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("prevents teacher from submitting attendance for a group they do not teach (FORBIDDEN)", async () => {
      // testGroup has teacherId = 10, but caller is otherTeacher (id = 99)
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });

      await expect(
        caller.submit({
          groupId: 5,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });

    it("throws NOT_FOUND if group does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });

      await expect(
        caller.submit({
          groupId: 999,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "NOT_FOUND",
        }),
      );
    });

    it("throws UNAUTHORIZED if user is not logged in", async () => {
      const caller = attendanceRouter.createCaller({ user: null });

      await expect(
        caller.submit({
          groupId: 5,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("attendance.getByGroupAndDate authorization guard", () => {
    it("allows admin to view attendance for any group", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, groupId: 5, studentId: 101, date: "2026-09-14", status: "present" },
          ]),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.getByGroupAndDate({ groupId: 5, date: "2026-09-14" });
      expect(result).toHaveLength(1);
    });

    it("prevents unassigned teacher from viewing attendance for another group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });
      await expect(
        caller.getByGroupAndDate({ groupId: 5, date: "2026-09-14" }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });
  });

  describe("attendance.getSheet", () => {
    it("returns enrolled students with attendance records and absence comments", async () => {
      // 1. Group query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([testGroup]),
            }),
          }),
        })
        // 2. Enrolled students query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([
                  {
                    studentId: 101,
                    studentName: "Alex Popescu",
                    studentPhone: "+37369000001",
                    parentName: "Maria Popescu",
                    parentPhone: "+37360000000",
                    age: 14,
                  },
                ]),
              }),
            }),
          }),
        })
        // 3. Existing attendance records query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                studentId: 101,
                status: "absent",
                comment: "Bolnav - febră",
                markedByUserId: 10,
                updatedAt: new Date("2026-09-15"),
              },
            ]),
          }),
        });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.getSheet({ groupId: 5, date: "2026-09-15" });

      expect(result).toHaveLength(1);
      expect(result[0].studentName).toBe("Alex Popescu");
      expect(result[0].parentPhone).toBe("+37360000000");
      expect(result[0].status).toBe("absent");
      expect(result[0].comment).toBe("Bolnav - febră");
    });

    it("prevents unassigned teacher from accessing the attendance sheet (FORBIDDEN)", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });
      await expect(
        caller.getSheet({ groupId: 5, date: "2026-09-15" }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });
  });
});
