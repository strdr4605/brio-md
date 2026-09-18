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

vi.mock("../conflictChecker", () => ({
  checkStudentCourseConflicts: vi.fn(),
  checkStudentGroupConflicts: vi.fn(),
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
        phone: "069123456",
        age: 14,
        courseIds: [1, 2],
      });

      expect(result).toEqual(mockResult);
      expect(progressValuesMock).toHaveBeenCalledWith([
        { studentId: 1, courseId: 1, status: "in_progress" },
        { studentId: 1, courseId: 2, status: "in_progress" },
      ]);
    });

    it("throws BAD_REQUEST when neither phone nor parentPhone is provided", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      await expect(
        caller.create({
          name: "No Phone Student",
          schoolId: 1,
        }),
      ).rejects.toThrowError(/cel puțin un număr de telefon/);
    });

    it("creates a student when only parentPhone is provided", async () => {
      const mockResult = {
        id: 5,
        name: "Kid with Parent Phone",
        phone: null,
        age: 8,
        schoolId: 1,
        parentName: "Parent",
        parentPhone: "+37368111222",
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
        name: "Kid with Parent Phone",
        parentPhone: "068111222",
        age: 8,
        schoolId: 1,
      });

      expect(result).toEqual(mockResult);
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

      await expect(caller.create({ name: "Unauthorized", phone: "069111222" })).rejects.toThrow(
        TRPCError,
      );
    });

    it("throws CONFLICT when a student with same name and same phone already exists in the same school", async () => {
      const existingStudent = {
        id: 1,
        name: "Alex Popescu",
        schoolId: 1,
        phone: "+37369000001",
        parentPhone: null,
        parentName: null,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingStudent]),
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

      await expect(
        caller.create({
          name: "Alex Popescu",
          phone: "069000001",
          schoolId: 1,
        }),
      ).rejects.toThrowError(/există deja/);
    });

    it("allows creating a student with same name but different profile info in the same school", async () => {
      const existingStudent = {
        id: 1,
        name: "Alex Popescu",
        schoolId: 1,
        phone: "+37369000001",
        parentPhone: "+37360000000",
        parentName: "Maria Popescu",
      };

      const newStudentResult = {
        id: 2,
        name: "Alex Popescu",
        schoolId: 1,
        phone: "+37369999999",
        parentPhone: "+37368888888",
        parentName: "Ion Popescu",
        active: true,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingStudent]),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newStudentResult]),
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
        name: "Alex Popescu",
        phone: "069999999",
        parentPhone: "068888888",
        parentName: "Ion Popescu",
        schoolId: 1,
      });

      expect(result).toEqual(newStudentResult);
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
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
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
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
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
      expect(db.update).toHaveBeenCalled();
      expect(insertValuesMock).toHaveBeenCalledWith([
        { studentId: 10, courseId: 2, status: "in_progress" },
      ]);
    });

    it("deactivates active group enrollments when a course is removed", async () => {
      const mockStudent = { id: 10, name: "Student", schoolId: 1 };
      const existingEnrollments = [
        { studentId: 10, courseId: 1 },
        { studentId: 10, courseId: 2 },
      ];

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
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 101, courseId: 1 }]),
          }),
        });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const updateSetMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });
      (db.update as any).mockReturnValue({
        set: updateSetMock,
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
      expect(db.update).toHaveBeenCalled();
      expect(updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "inactive",
        }),
      );
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

  describe("getById", () => {
    it("returns student profile with school and courses when authorized", async () => {
      const mockStudent = {
        id: 1,
        name: "Alex Popescu",
        phone: "+37369123456",
        age: 14,
        schoolId: 1,
        schoolName: "Chișinău Campus",
        parentName: "Elena Popescu",
        parentPhone: "+37369234567",
        info: "Recomandare robotică",
        active: true,
        createdAt: new Date("2026-01-10"),
        lastChangedAt: new Date("2026-01-10"),
      };

      const mockCourses = [{ id: 10, name: "Robotică Avansată" }];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockStudent]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockCourses),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
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

      const result = await caller.getById({ id: 1 });
      expect(result).toEqual({
        ...mockStudent,
        courses: mockCourses,
      });
    });

    it("includes courses from active group enrollments even when missing from course progress", async () => {
      const mockStudent = {
        id: 1,
        name: "Alex",
        schoolId: 1,
      };
      const mockGroupCourses = [{ id: 202, name: "Robotică & STEM" }];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockStudent]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]), // No progress records
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockGroupCourses), // Has active group in Robotics
              }),
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

      const result = await caller.getById({ id: 1 });
      expect(result.courses).toEqual(mockGroupCourses);
    });

    it("throws NOT_FOUND when student does not exist", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
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

      await expect(caller.getById({ id: 999 })).rejects.toThrow(
        expect.objectContaining({ code: "NOT_FOUND" }),
      );
    });

    it("throws FORBIDDEN when admin from another school tries to access", async () => {
      const mockStudent = {
        id: 1,
        name: "Alex",
        schoolId: 2, // different school
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent]),
            }),
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

      await expect(caller.getById({ id: 1 })).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });
  });

  describe("search", () => {
    it("returns matching students with groups and courses", async () => {
      const mockStudent = {
        id: 1,
        name: "Mihai Popescu",
        phone: "+37369123456",
        parentName: "Elena Popescu",
        parentPhone: "+37369987654",
        schoolId: 1,
        active: true,
      };

      const mockGroupEnrollment = {
        studentId: 1,
        groupId: 10,
        groupName: "Grupa A",
        courseId: 20,
        courseName: "Robotică",
      };

      const mockCourseProgress = {
        studentId: 1,
        courseId: 20,
        courseName: "Robotică",
      };

      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent]),
            }),
          })),
          innerJoin: vi.fn().mockImplementation(() => ({
            innerJoin: vi.fn().mockImplementation(() => ({
              where: vi.fn().mockResolvedValue([mockGroupEnrollment]),
            })),
            where: vi.fn().mockResolvedValue([mockCourseProgress]),
          })),
        })),
      }));

      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      const result = await caller.search({ query: "Popescu" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Mihai Popescu");
      expect(result[0].parentName).toBe("Elena Popescu");
    });

    it("returns empty array when query is empty string", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          schoolId: null,
        },
      });

      const result = await caller.search({ query: "   " });
      expect(result).toEqual([]);
    });

    it("returns empty array when non-super user has no schoolId (multi-tenancy guard)", async () => {
      const caller = studentRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [],
          schoolId: null,
        },
      });

      const result = await caller.search({ query: "Popescu" });
      expect(result).toEqual([]);
    });
  });
});

