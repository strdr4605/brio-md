import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { courseRouter } from "./course";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("courseRouter", () => {
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

  const teacherUser = {
    id: "3",
    email: "teacher@example.com",
    name: "Teacher",
    role: "teacher",
    permissions: [],
    courseIds: [1],
    schoolId: 1,
  };

  describe("course.list", () => {
    it("returns courses for superadmin", async () => {
      const mockCourses = [
        {
          id: 1,
          name: "Robotics 101",
          description: "Intro to robotics",
          level: "beginner",
          totalSessions: 12,
          sessionDurationMinutes: 60,
          scheduleDays: ["mon", "wed"],
          scheduleTime: "10:00 - 11:00",
          teacherId: 3,
          teacherName: "Teacher",
          schoolId: 1,
          active: true,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockCourses),
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(mockQuery),
        }),
      });

      const caller = courseRouter.createCaller({ user: superUser });
      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Robotics 101");
      expect(result[0].teacherName).toBe("Teacher");
    });

    it("throws FORBIDDEN when called by regular teacher", async () => {
      const caller = courseRouter.createCaller({ user: teacherUser });
      await expect(caller.list()).rejects.toThrow(TRPCError);
    });

    it("throws UNAUTHORIZED when user is null", async () => {
      const caller = courseRouter.createCaller({ user: null });
      await expect(caller.list()).rejects.toThrow(TRPCError);
    });
  });

  describe("course.getById", () => {
    it("returns course with materials for admin in same school", async () => {
      const mockCourse = {
        id: 1,
        name: "Robotics 101",
        description: "Intro to robotics",
        level: "beginner",
        totalSessions: 12,
        sessionDurationMinutes: 60,
        scheduleDays: ["mon", "wed"],
        scheduleTime: "10:00 - 11:00",
        teacherId: 3,
        teacherName: "Teacher",
        schoolId: 1,
        active: true,
        createdAt: new Date(),
      };

      const mockMaterials = [
        {
          id: 10,
          courseId: 1,
          title: "Robotics Manual",
          type: "manual",
          url: "https://example.com/robotics.pdf",
          orderIndex: 0,
        },
      ];

      (db.select as any).mockImplementation((fields?: any) => {
        if (!fields) {
          // materials query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockMaterials),
              }),
            }),
          };
        }
        // course query
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockCourse]),
              }),
            }),
          }),
        };
      });

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      const result = await caller.getById({ id: 1 });
      expect(result.name).toBe("Robotics 101");
      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].title).toBe("Robotics Manual");
    });

    it("throws FORBIDDEN when admin tries to get course from another school", async () => {
      const mockCourse = {
        id: 2,
        name: "English Advanced",
        schoolId: 999, // different school
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockCourse]),
            }),
          }),
        }),
      });

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      await expect(caller.getById({ id: 2 })).rejects.toThrow(TRPCError);
    });

    it("throws NOT_FOUND when course does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const caller = courseRouter.createCaller({ user: superUser });
      await expect(caller.getById({ id: 999 })).rejects.toThrow(TRPCError);
    });
  });

  describe("course.create", () => {
    it("creates course and attached materials", async () => {
      const createdCourse = {
        id: 5,
        name: "New STEM Course",
        level: "intermediate",
        totalSessions: 10,
        sessionDurationMinutes: 90,
        scheduleDays: ["fri"],
        scheduleTime: "15:00 - 16:30",
        teacherId: 3,
        schoolId: 1,
        active: true,
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          if (val.name) {
            // Course insert
            return {
              returning: vi.fn().mockResolvedValue([createdCourse]),
            };
          }
          // Materials insert
          return Promise.resolve();
        }),
      }));

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      const result = await caller.create({
        name: "New STEM Course",
        level: "intermediate",
        totalSessions: 10,
        sessionDurationMinutes: 90,
        scheduleDays: ["fri"],
        scheduleTime: "15:00 - 16:30",
        teacherId: 3,
        materials: [
          {
            title: "STEM Guide",
            type: "manual",
            url: "https://example.com/guide.pdf",
          },
        ],
      });

      expect(result.id).toBe(5);
      expect(result.name).toBe("New STEM Course");
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("course.update", () => {
    it("updates course and replaces materials", async () => {
      const existingCourse = {
        id: 1,
        name: "Old Name",
        schoolId: 1,
      };

      const updatedCourse = {
        id: 1,
        name: "Updated Name",
        schoolId: 1,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingCourse]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCourse]),
          }),
        }),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      const result = await caller.update({
        id: 1,
        name: "Updated Name",
        materials: [
          {
            title: "Updated Textbook",
            type: "textbook",
            url: "https://example.com/book.pdf",
          },
        ],
      });

      expect(result.name).toBe("Updated Name");
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("course.toggleActive and delete", () => {
    it("toggles course active status", async () => {
      const existingCourse = { id: 1, active: true, schoolId: 1 };
      const updatedCourse = { id: 1, active: false, schoolId: 1 };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingCourse]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCourse]),
          }),
        }),
      });

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      const result = await caller.toggleActive({ id: 1 });
      expect(result.active).toBe(false);
    });

    it("deletes course", async () => {
      const existingCourse = { id: 1, schoolId: 1 };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingCourse]),
          }),
        }),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const caller = courseRouter.createCaller({ user: adminSchool1 });
      const result = await caller.delete({ id: 1 });
      expect(result.success).toBe(true);
    });
  });
});

