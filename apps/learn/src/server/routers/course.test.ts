import { describe, it, expect, vi, beforeEach } from "vitest";
import { courseRouter } from "./course";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("courseRouter for students and teachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list query", () => {
    it("returns empty list if student has no active enrollments or progress", async () => {
      const mockSelect = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({ where: vi.fn().mockResolvedValueOnce([]) }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({ where: vi.fn().mockResolvedValueOnce([]) }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toEqual([]);
    });

    it("returns courses when student has active group enrollment", async () => {
      const mockCourse = {
        id: 10,
        name: "Robotică Începători",
        level: "beginner",
        totalSessions: 12,
        active: true,
      };

      const mockProgress = {
        courseId: 10,
        studentId: 42,
        completedSessions: 3,
        currentSession: 4,
        status: "in_progress",
        notes: null,
      };

      const mockSelect = vi.fn()
        // 1. group enrollments
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce([
                {
                  status: "active",
                  enrollmentCourseId: 10,
                  groupCourseId: 10,
                  groupActive: true,
                },
              ]),
            }),
          }),
        })
        // 2. studentCourseProgress for courseIds
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([]),
          }),
        })
        // 3. courses list
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([mockCourse]),
          }),
        })
        // 4. progress list for courses
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([mockProgress]),
          }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(10);
      expect(result[0].name).toBe("Robotică Începători");
      expect(result[0].progress.completedSessions).toBe(3);
      expect(result[0].progress.currentSession).toBe(4);
    });

    it("immediately removes course from LMS view when student is withdrawn from group", async () => {
      const mockSelect = vi.fn()
        // 1. group enrollments has inactive/withdrawn status
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce([
                {
                  status: "inactive",
                  enrollmentCourseId: 10,
                  groupCourseId: 10,
                  groupActive: true,
                },
              ]),
            }),
          }),
        })
        // 2. studentCourseProgress still has residual record
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([
              {
                courseId: 10,
                status: "in_progress",
              },
            ]),
          }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toEqual([]);
    });

    it("retains direct course progress when student has no group enrollments for it", async () => {
      const mockCourse = {
        id: 20,
        name: "Matematică Avansată",
        level: "advanced",
        totalSessions: 8,
        active: true,
      };

      const mockSelect = vi.fn()
        // 1. group enrollments: none
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 2. direct studentCourseProgress: course 20
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([
              {
                courseId: 20,
                status: "in_progress",
              },
            ]),
          }),
        })
        // 3. courses list
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([mockCourse]),
          }),
        })
        // 4. progress list
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([]),
          }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(20);
    });
  });

  describe("getById query", () => {
    it("throws FORBIDDEN when student is not enrolled in the requested course", async () => {
      const mockSelect = vi.fn()
        // 1. group enrollments: empty
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 2. progress: empty
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([]),
          }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      await expect(caller.getById({ id: 99 })).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "You are not enrolled in this course.",
      });
    });

    it("returns course details when student is actively enrolled", async () => {
      const mockCourse = {
        id: 10,
        name: "Robotică Începători",
        level: "beginner",
        teacherId: 2,
        active: true,
      };

      const mockSelect = vi.fn()
        // 1. group enrollments: active in course 10
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce([
                {
                  status: "active",
                  enrollmentCourseId: 10,
                  groupCourseId: 10,
                  groupActive: true,
                },
              ]),
            }),
          }),
        })
        // 2. progress: empty
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([]),
          }),
        })
        // 3. fetch course
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([mockCourse]),
            }),
          }),
        })
        // 4. teacher name
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([{ name: "Profesor Ion" }]),
            }),
          }),
        })
        // 5. course materials
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 6. student progress
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        });

      (db.select as any) = mockSelect;

      const caller = courseRouter.createCaller({
        user: {
          id: "101",
          role: "student",
          permissions: [],
          courseIds: [],
          studentId: 42,
          schoolId: 1,
        },
      });

      const result = await caller.getById({ id: 10 });
      expect(result.id).toBe(10);
      expect(result.instructorName).toBe("Profesor Ion");
    });
  });
});
