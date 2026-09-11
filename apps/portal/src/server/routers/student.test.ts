import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { studentRouter } from "./student";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("studentRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a student with age and normalized phone", async () => {
      const mockResult = {
        id: 1,
        name: "Test Student",
        phone: "+37369123456",
        age: 12,
        schoolId: 1,
        parentName: "Parent",
        parentPhone: null,
        info: null,
        active: true,
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockResult]),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      const result = await caller.create({
        name: "Test Student",
        phone: "069123456",
        age: 12,
        schoolId: 1,
      });

      expect(result).toEqual(mockResult);
    });
    it("creates a student when caller is teacher", async () => {
      const mockResult = {
        id: 2,
        name: "Student by Teacher",
        phone: "+37369111222",
        age: 15,
        schoolId: 1,
        parentName: null,
        parentPhone: null,
        info: null,
        active: true,
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockResult]),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "3",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [10],
          schoolId: 1,
        },
      });

      const result = await caller.create({
        name: "Student by Teacher",
        phone: "069111222",
        age: 15,
      });

      expect(result).toEqual(mockResult);
    });

    it("creates a student with course enrollments", async () => {
      const mockResult = {
        id: 1,
        name: "Enrolled Student",
        phone: null,
        age: 14,
        schoolId: 1,
        parentName: null,
        parentPhone: null,
        info: null,
        active: true,
      };

      const insertValuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockResult]),
      });
      const progressValuesMock = vi.fn().mockResolvedValue({});

      (db.insert as any)
        .mockReturnValueOnce({ values: insertValuesMock })
        .mockReturnValueOnce({ values: progressValuesMock });

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      const result = await caller.create({
        name: "Enrolled Student",
        age: 14,
        courseIds: [1, 2],
      });

      expect(result).toEqual(mockResult);
      expect(progressValuesMock).toHaveBeenCalledWith([
        { studentId: 1, courseId: 1, status: "in_progress" },
        { studentId: 1, courseId: 2, status: "in_progress" },
      ]);
    });
    it("throws FORBIDDEN when user has no student management permissions", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "4",
          role: "guest",
          permissions: [],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(caller.create({ name: "Unauthorized" })).rejects.toThrow(TRPCError);
    });
  });

  describe("list", () => {
    it("returns students for teacher without restricting to teacher school", async () => {
      const mockStudents = [
        { id: 1, name: "Student School 1", schoolId: 1 },
        { id: 2, name: "Student School 2", schoolId: 2 },
      ];
      const mockEnrollments = [{ studentId: 1, courseId: 101, courseName: "Matematică" }];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockStudents),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockEnrollments),
            }),
          }),
        });

      const caller = studentRouter.createCaller({
        user: {
          id: "3",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [],
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toEqual([
        {
          id: 1,
          name: "Student School 1",
          schoolId: 1,
          courses: [{ id: 101, name: "Matematică" }],
        },
        {
          id: 2,
          name: "Student School 2",
          schoolId: 2,
          courses: [],
        },
      ]);
    });

    it("returns empty array for unauthorized caller", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "5",
          role: "student",
          permissions: [],
          courseIds: [],
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("updates student when caller is teacher even in another school", async () => {
      const mockStudent = { id: 10, name: "Student", schoolId: 99 };
      const mockUpdated = { ...mockStudent, name: "Updated Student" };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "3",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [],
          schoolId: 1,
        },
      });

      const result = await caller.update({ id: 10, name: "Updated Student" });
      expect(result).toEqual(mockUpdated);
    });

    it("throws FORBIDDEN when user has no permissions to update", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "4",
          role: "guest",
          permissions: [],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(caller.update({ id: 10, name: "Updated Student" })).rejects.toThrow(TRPCError);
    });
  });

  describe("updateCourses", () => {
    it("updates student courses successfully (adds and removes courses)", async () => {
      const mockStudent = { id: 10, name: "Student", schoolId: 1 };
      const existingEnrollments = [{ studentId: 10, courseId: 1 }];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(existingEnrollments),
          }),
        });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const insertValuesMock = vi.fn().mockResolvedValue({});
      (db.insert as any).mockReturnValue({
        values: insertValuesMock,
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "3",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [],
          schoolId: 1,
        },
      });

      const result = await caller.updateCourses({
        studentId: 10,
        courseIds: [2],
      });

      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalled();
      expect(insertValuesMock).toHaveBeenCalledWith([
        { studentId: 10, courseId: 2, status: "in_progress" },
      ]);
    });

    it("throws NOT_FOUND when student does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(caller.updateCourses({ studentId: 999, courseIds: [1] })).rejects.toThrow(
        TRPCError,
      );
    });

    it("throws FORBIDDEN when caller has no permission", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "4",
          role: "guest",
          permissions: [],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(caller.updateCourses({ studentId: 1, courseIds: [1] })).rejects.toThrow(
        TRPCError,
      );
    });

    it("throws FORBIDDEN when school admin tries to update courses for student in another school", async () => {
      const mockStudent = { id: 10, name: "Student", schoolId: 99 };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "2",
          role: "admin",
          permissions: ["admin"],
          courseIds: [],
          schoolId: 1,
        },
      });

      await expect(caller.updateCourses({ studentId: 10, courseIds: [1] })).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("delete", () => {
    it("deletes a student when caller is superadmin", async () => {
      const mockStudent = {
        id: 1,
        name: "Test Student",
        schoolId: 2,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      const res = await caller.delete({ id: 1 });
      expect(res).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalled();
    });

    it("deletes a student when caller is teacher", async () => {
      const mockStudent = {
        id: 1,
        name: "Other School Student",
        schoolId: 99,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "3",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [],
          schoolId: 1,
        },
      });

      const res = await caller.delete({ id: 1 });
      expect(res).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalled();
    });

    it("throws FORBIDDEN when school admin tries to delete student from another school", async () => {
      const mockStudent = {
        id: 1,
        name: "Other School Student",
        schoolId: 99,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "2",
          role: "admin",
          permissions: ["admin"],
          courseIds: [],
          schoolId: 1,
        },
      });

      await expect(caller.delete({ id: 1 })).rejects.toThrow(TRPCError);
    });

    it("throws NOT_FOUND when student does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(caller.delete({ id: 999 })).rejects.toThrow(TRPCError);
    });
  });
});
