import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { groupRouter } from "./group";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../conflictChecker", () => ({
  checkCourseNameConflict: vi.fn(),
  checkGroupConflicts: vi.fn(),
}));

import { db } from "@/lib/db";

describe("groupRouter", () => {
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

  const adminSchool1 = {
    id: "2",
    email: "admin1@example.com",
    name: "Admin School 1",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  };

  const adminSchool2 = {
    id: "3",
    email: "admin2@example.com",
    name: "Admin School 2",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 2,
  };

  const regularUser = {
    id: "4",
    email: "teacher@example.com",
    name: "Teacher",
    role: "teacher",
    permissions: [],
    courseIds: [],
    schoolId: 1,
  };

  describe("group.list", () => {
    it("returns groups with student count", async () => {
      const mockGroups = [
        {
          id: 1,
          courseId: 10,
          courseName: "Robotics Basics",
          schoolId: 1,
          name: "Grupa A - Luni & Miercuri",
          scheduleDays: ["mon", "wed"],
          scheduleTime: "17:30 - 18:30",
          room: "Sala 204",
          teacherId: 4,
          teacherName: "Teacher",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentCount: 12,
        },
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockGroups),
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      const result = await caller.list({ courseId: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Grupa A - Luni & Miercuri");
      expect(result[0].studentCount).toBe(12);
      expect(result[0].room).toBe("Sala 204");
    });

    it("scopes groups to teacher when user is a teacher", async () => {
      const mockGroups = [
        {
          id: 2,
          courseId: 10,
          courseName: "Robotics Basics",
          schoolId: 1,
          name: "Grupa Teacher",
          scheduleDays: ["tue", "thu"],
          scheduleTime: "15:00 - 16:00",
          room: "Sala 101",
          teacherId: 4,
          teacherName: "Teacher",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentCount: 5,
        },
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockGroups),
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: regularUser });
      const result = await caller.list({});

      expect(result).toHaveLength(1);
      expect(result[0].teacherId).toBe(4);
      expect(mockQuery.where).toHaveBeenCalled();
    });

    it("throws UNAUTHORIZED when user is not authenticated", async () => {
      const caller = groupRouter.createCaller({ user: null });
      await expect(caller.list({})).rejects.toThrow(TRPCError);
    });
  });

  describe("group.getById", () => {
    it("returns single group with student count and course name", async () => {
      const mockGroup = {
        id: 1,
        courseId: 10,
        courseName: "Robotics Basics",
        schoolId: 1,
        name: "Grupa A",
        scheduleDays: ["mon", "wed"],
        scheduleTime: "17:30 - 18:30",
        room: "Sala 204",
        teacherId: 4,
        teacherName: "Teacher",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentCount: 8,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockGroup]),
              }),
            }),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      const result = await caller.getById({ id: 1 });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Grupa A");
      expect(result.studentCount).toBe(8);
    });

    it("throws NOT_FOUND if group does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      await expect(caller.getById({ id: 999 })).rejects.toThrow(TRPCError);
    });

    it("throws FORBIDDEN if user from different school attempts access", async () => {
      const mockGroup = {
        id: 1,
        schoolId: 1,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockGroup]),
              }),
            }),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool2 });
      await expect(caller.getById({ id: 1 })).rejects.toThrow(TRPCError);
    });

    it("allows superadmin to view group from any school", async () => {
      const mockGroup = {
        id: 1,
        courseId: 10,
        courseName: "Robotics Basics",
        schoolId: 99,
        name: "Grupa A",
        studentCount: 5,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockGroup]),
              }),
            }),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: superUser });
      const result = await caller.getById({ id: 1 });
      expect(result.id).toBe(1);
    });
  });

  describe("group.create", () => {
    it("creates a new group when user has admin role", async () => {
      const course = { id: 10, schoolId: 1, name: "Robotics" };
      const createdGroup = {
        id: 5,
        courseId: 10,
        schoolId: 1,
        name: "Grupa Noua",
        scheduleDays: ["tue", "thu"],
        scheduleTime: "16:00 - 17:30",
        room: "Lab 1",
        teacherId: 4,
        active: true,
      };

      // Mock course lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([course]),
          }),
        }),
      });

      // Mock group insert
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdGroup]),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      const result = await caller.create({
        courseId: 10,
        name: "Grupa Noua",
        scheduleDays: ["tue", "thu"],
        scheduleTime: "16:00 - 17:30",
        room: "Lab 1",
        teacherId: 4,
      });

      expect(result.id).toBe(5);
      expect(result.name).toBe("Grupa Noua");
    });

    it("throws FORBIDDEN if user is non-admin", async () => {
      const caller = groupRouter.createCaller({ user: regularUser });
      await expect(
        caller.create({
          courseId: 10,
          name: "Test Group",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("group.update", () => {
    it("updates group attributes successfully", async () => {
      const existingGroup = {
        id: 1,
        schoolId: 1,
        name: "Grupa Veche",
        active: true,
      };
      const updatedGroup = {
        id: 1,
        schoolId: 1,
        name: "Grupa Modificata",
        scheduleDays: ["fri"],
        scheduleTime: "18:00 - 19:00",
        room: "Sala B",
        teacherId: null,
        active: true,
      };

      // Mock existing lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingGroup]),
          }),
        }),
      });

      // Mock update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedGroup]),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      const result = await caller.update({
        id: 1,
        name: "Grupa Modificata",
        scheduleDays: ["fri"],
        scheduleTime: "18:00 - 19:00",
        room: "Sala B",
      });

      expect(result.name).toBe("Grupa Modificata");
      expect(result.scheduleDays).toEqual(["fri"]);
    });

    it("throws FORBIDDEN when admin from other school attempts update", async () => {
      const existingGroup = {
        id: 1,
        schoolId: 1,
        name: "Grupa 1",
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingGroup]),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool2 });
      await expect(
        caller.update({
          id: 1,
          name: "Hacked Group",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("allows assigned teacher to update group settings", async () => {
      const assignedTeacherUser = {
        id: "4",
        email: "assigned@example.com",
        name: "Assigned Teacher",
        role: "teacher",
        permissions: ["teach"],
        courseIds: [10],
        schoolId: 1,
      };

      const existingGroup = {
        id: 1,
        schoolId: 1,
        courseId: 10,
        teacherId: 4,
        name: "Grupa Mea",
        active: true,
      };

      const updatedGroup = {
        id: 1,
        schoolId: 1,
        courseId: 10,
        teacherId: 4,
        name: "Grupa Mea Actualizata",
        scheduleDays: ["mon"],
        active: true,
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingGroup]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedGroup]),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: assignedTeacherUser });
      const result = await caller.update({
        id: 1,
        name: "Grupa Mea Actualizata",
        scheduleDays: ["mon"],
      });

      expect(result.name).toBe("Grupa Mea Actualizata");
    });

    it("throws FORBIDDEN when unassigned teacher attempts update", async () => {
      const unassignedTeacherUser = {
        id: "99",
        email: "otherteacher@example.com",
        name: "Other Teacher",
        role: "teacher",
        permissions: ["teach"],
        courseIds: [],
        schoolId: 1,
      };

      const existingGroup = {
        id: 1,
        schoolId: 1,
        courseId: 10,
        teacherId: 4, // assigned to teacher 4, not 99
        name: "Grupa Altui Profesor",
        active: true,
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingGroup]),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: unassignedTeacherUser });
      await expect(
        caller.update({
          id: 1,
          name: "Unauthorized Update",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("group.toggleActive", () => {
    it("archives a group by setting active to false", async () => {
      const existingGroup = { id: 1, schoolId: 1, active: true };
      const archivedGroup = { id: 1, schoolId: 1, active: false };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingGroup]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([archivedGroup]),
          }),
        }),
      });

      const caller = groupRouter.createCaller({ user: adminSchool1 });
      const result = await caller.toggleActive({ id: 1, active: false });

      expect(result.active).toBe(false);
    });
  });
});
