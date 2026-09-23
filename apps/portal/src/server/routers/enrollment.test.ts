import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrollmentRouter } from "./enrollment";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../conflictChecker", () => ({
  checkStudentGroupConflicts: vi.fn(),
}));

import { db } from "@/lib/db";

describe("enrollmentRouter - Multi-Group Enrollment & Per-Course Status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminUser = {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  };

  const otherSchoolAdmin = {
    id: "2",
    email: "otheradmin@example.com",
    name: "Other Admin",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 2,
  };

  const student1 = {
    id: 10,
    name: "Alex Popescu",
    schoolId: 1,
    phone: "+37369000001",
  };

  const groupA_Course1 = {
    id: 101,
    courseId: 1, // Course 1: English
    schoolId: 1,
    name: "English Group A - Tue 17:30",
  };

  const groupB_Course2 = {
    id: 102,
    courseId: 2, // Course 2: Robotics
    schoolId: 1,
    name: "Robotics Group B - Thu 16:30",
  };

  describe("enrollment.enrollStudent", () => {
    it("allows admin to enroll a student into multiple groups across courses", async () => {
      // 1. Mock student lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      // 2. Mock target groups lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([groupA_Course1, groupB_Course2]),
        }),
      });

      // 3. Mock course progress check for group 1 & group 2
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, studentId: 10, courseId: 1 }]),
          }),
        }),
      });
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 2, studentId: 10, courseId: 2 }]),
          }),
        }),
      });

      // 4. Mock upsert inserts
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  studentId: 10,
                  groupId: 101,
                  courseId: 1,
                  status: "active",
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: 2,
                  studentId: 10,
                  groupId: 102,
                  courseId: 2,
                  status: "active",
                },
              ]),
            }),
          }),
        });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const result = await caller.enrollStudent({
        studentId: 10,
        groupIds: [101, 102],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.enrollments[0].groupId).toBe(101);
      expect(result.enrollments[0].courseId).toBe(1);
      expect(result.enrollments[1].groupId).toBe(102);
      expect(result.enrollments[1].courseId).toBe(2);
    });

    it("prevents admin from another school from enrolling a student", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: otherSchoolAdmin });
      await expect(
        caller.enrollStudent({
          studentId: 10,
          groupIds: [101],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });

    it("throws NOT_FOUND if student does not exist", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      await expect(
        caller.enrollStudent({
          studentId: 999,
          groupIds: [101],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "NOT_FOUND",
        }),
      );
    });

    it("automatically enrolls student into course if not yet enrolled when adding to a group", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([groupA_Course1]),
        }),
      });

      // Course progress lookup returns empty (not enrolled yet)
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock auto-insert into studentCourseProgress
      const insertCourseProgressValues = vi.fn().mockResolvedValue([]);
      (db.insert as any).mockReturnValueOnce({
        values: insertCourseProgressValues,
      });

      // Mock upsert into studentGroupEnrollments
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                studentId: 10,
                groupId: 101,
                courseId: 1,
                status: "active",
              },
            ]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const result = await caller.enrollStudent({
        studentId: 10,
        groupIds: [101],
      });

      expect(result.success).toBe(true);
      expect(insertCourseProgressValues).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 10,
          courseId: 1,
          status: "in_progress",
        }),
      );
    });
  });

  describe("enrollment.updateStatus (Independent per-course/group status)", () => {
    it("allows admin to mark a student inactive for Course A without affecting Course B", async () => {
      const enrollmentCourseA = {
        id: 1,
        studentId: 10,
        groupId: 101,
        courseId: 1,
        status: "active",
      };

      // 1. Mock enrollment lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([enrollmentCourseA]),
          }),
        }),
      });

      // 2. Mock student lookup (for school check)
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      // 3. Mock update
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                ...enrollmentCourseA,
                status: "inactive",
                leftAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const updated = await caller.updateStatus({
        enrollmentId: 1,
        status: "inactive",
      });

      expect(updated.id).toBe(1);
      expect(updated.status).toBe("inactive");
      expect(updated.leftAt).toBeDefined();
    });

    it("clears leftAt when setting status back to active", async () => {
      const inactiveEnrollment = {
        id: 1,
        studentId: 10,
        groupId: 101,
        courseId: 1,
        status: "inactive",
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([inactiveEnrollment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([student1]),
            }),
          }),
        });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockImplementation((payload) => {
          expect(payload.leftAt).toBeNull();
          expect(payload.status).toBe("active");
          return {
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  ...inactiveEnrollment,
                  status: "active",
                  leftAt: null,
                },
              ]),
            }),
          };
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const updated = await caller.updateStatus({
        enrollmentId: 1,
        status: "active",
      });

      expect(updated.status).toBe("active");
      expect(updated.leftAt).toBeNull();
    });
  });

  describe("enrollment.listByGroup (Status Filtering)", () => {
    it("retrieves group roster filtered by status", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([groupA_Course1]),
          }),
        }),
      });

      const mockStudents = [
        {
          enrollmentId: 1,
          studentId: 10,
          studentName: "Alex Popescu",
          studentPhone: "+37369000001",
          status: "active",
          joinedAt: new Date(),
          leftAt: null,
        },
      ];

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockStudents),
            }),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const roster = await caller.listByGroup({
        groupId: 101,
        status: "active",
      });

      expect(roster).toHaveLength(1);
      expect(roster[0].studentName).toBe("Alex Popescu");
      expect(roster[0].status).toBe("active");
    });
  });

  describe("enrollment.getByStudent", () => {
    it("returns all group enrollments across courses for a student", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      const mockEnrollments = [
        {
          id: 1,
          studentId: 10,
          groupId: 101,
          groupName: "English Group A",
          courseId: 1,
          courseName: "English A1",
          status: "inactive",
        },
        {
          id: 2,
          studentId: 10,
          groupId: 102,
          groupName: "Robotics Group B",
          courseId: 2,
          courseName: "Robotics STEM",
          status: "active",
        },
      ];

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockEnrollments),
                }),
              }),
            }),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const enrollments = await caller.getByStudent({ studentId: 10 });

      expect(enrollments).toHaveLength(2);
      expect(enrollments[0].courseName).toBe("English A1");
      expect(enrollments[0].status).toBe("inactive");
      expect(enrollments[1].courseName).toBe("Robotics STEM");
      expect(enrollments[1].status).toBe("active");
    });
  });

  describe("Billing & Pricing Configuration", () => {
    it("enrolls student with custom billing configuration (billingType, customPrice, discountPercent)", async () => {
      // 1. Student check
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      // 2. Groups check
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([groupA_Course1]),
        }),
      });

      // 3. Existing progress check
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 99 }]),
          }),
        }),
      });

      // 4. Upsert with pricing
      const mockSaved = {
        id: 501,
        studentId: 10,
        groupId: 101,
        courseId: 1,
        status: "active",
        billingType: "per_lesson",
        customPrice: 250,
        discountPercent: 10,
      };

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockSaved]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const result = await caller.enrollStudent({
        studentId: 10,
        groupIds: [101],
        billingType: "per_lesson",
        customPrice: 250,
        discountPercent: 10,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.enrollments[0].billingType).toBe("per_lesson");
      expect(result.enrollments[0].customPrice).toBe(250);
      expect(result.enrollments[0].discountPercent).toBe(10);
    });

    it("updates pricing configuration for an existing enrollment via updatePricing", async () => {
      // 1. Find enrollment
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 501,
                studentId: 10,
                groupId: 101,
                billingType: "subscription_monthly",
                customPrice: null,
                discountPercent: 0,
              },
            ]),
          }),
        }),
      });

      // 2. Student check
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      // 3. Update query
      const updatedRow = {
        id: 501,
        studentId: 10,
        groupId: 101,
        billingType: "custom",
        customPrice: 400,
        discountPercent: 15,
      };

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRow]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const result = await caller.updatePricing({
        enrollmentId: 501,
        billingType: "custom",
        customPrice: 400,
        discountPercent: 15,
      });

      expect(result.billingType).toBe("custom");
      expect(result.customPrice).toBe(400);
      expect(result.discountPercent).toBe(15);
    });

    it("prevents admin from another school from updating student pricing", async () => {
      // 1. Find enrollment
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 501,
                studentId: 10,
                groupId: 101,
              },
            ]),
          }),
        }),
      });

      // 2. Student check (schoolId = 1, but caller is from school 2)
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: otherSchoolAdmin });
      await expect(
        caller.updatePricing({
          enrollmentId: 501,
          billingType: "per_lesson",
        }),
      ).rejects.toThrow();
    });

    it("throws NOT_FOUND when associated student record is not found in updatePricing", async () => {
      // 1. Find enrollment
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 501,
                studentId: 9999,
                groupId: 101,
              },
            ]),
          }),
        }),
      });

      // 2. Student check returns null/empty
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      await expect(
        caller.updatePricing({
          enrollmentId: 501,
          billingType: "per_lesson",
        }),
      ).rejects.toThrow("Studentul asociat înscrierii nu a fost găsit.");
    });

    it("returns unmodified enrollment without executing db.update when updatePayload is empty", async () => {
      const existingEnrollment = {
        id: 501,
        studentId: 10,
        groupId: 101,
        billingType: "subscription_monthly",
        customPrice: 500,
        discountPercent: 10,
      };

      // 1. Find enrollment
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingEnrollment]),
          }),
        }),
      });

      // 2. Student check
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([student1]),
          }),
        }),
      });

      const updateSpy = vi.spyOn(db, "update");

      const caller = enrollmentRouter.createCaller({ user: adminUser });
      const result = await caller.updatePricing({
        enrollmentId: 501,
      });

      expect(result).toEqual(existingEnrollment);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
