import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { teacherRouter } from "./teacher";

// Mock database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("teacherRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authorization & Role Guarding", () => {
    it("throws UNAUTHORIZED when user is null", async () => {
      const caller = teacherRouter.createCaller({
        user: null,
      });

      await expect(caller.getMyCourses()).rejects.toThrow(TRPCError);
    });

    it("throws FORBIDDEN when user has student role", async () => {
      const caller = teacherRouter.createCaller({
        user: {
          id: "10",
          role: "student",
          permissions: [],
          courseIds: [1],
          studentId: 5,
          schoolId: 1,
        },
      });

      await expect(caller.getMyCourses()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("getMyCourses", () => {
    it("returns assigned courses with aggregated stats for teacher", async () => {
      const mockCourse = {
        id: 1,
        name: "General English",
        description: "Beginner course",
        level: "beginner",
        totalSessions: 10,
        sessionDurationMinutes: 60,
        scheduleDays: ["mon"],
        scheduleTime: "10:00",
        teacherId: 2,
        schoolId: 1,
        active: true,
      };

      const mockProgress = [
        {
          id: 1,
          courseId: 1,
          studentId: 101,
          currentSession: 5,
          completedSessions: 5,
          status: "in_progress",
          notes: "Good progress",
        },
        {
          id: 2,
          courseId: 1,
          studentId: 102,
          currentSession: 10,
          completedSessions: 10,
          status: "completed",
          notes: "Finished",
        },
      ];

      // First db.select() call returns courses, second returns progress
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([mockCourse]);
            }
            return Promise.resolve(mockProgress);
          }),
        })),
      }));

      const caller = teacherRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: ["teach"],
          courseIds: [1],
          studentId: null,
          schoolId: 1,
        },
      });

      const courses = await caller.getMyCourses();

      expect(courses).toHaveLength(1);
      expect(courses[0].id).toBe(1);
      expect(courses[0].totalStudents).toBe(2);
      expect(courses[0].activeStudents).toBe(1);
      expect(courses[0].completedStudents).toBe(1);
      // Student 101: 5/10 = 50%, Student 102: 10/10 = 100% -> avg = 75%
      expect(courses[0].averageCompletionRate).toBe(75);
    });

    it("returns all courses for superadmin", async () => {
      const mockCourses = [
        { id: 1, name: "Course 1", totalSessions: 10, teacherId: 99 },
        { id: 2, name: "Course 2", totalSessions: 20, teacherId: 88 },
      ];

      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(mockCourses);
          }
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      }));

      const caller = teacherRouter.createCaller({
        user: {
          id: "1",
          role: "superadmin",
          permissions: ["super"],
          courseIds: [],
          studentId: null,
          schoolId: null,
        },
      });

      const courses = await caller.getMyCourses();
      expect(courses).toHaveLength(2);
      expect(courses[0].totalStudents).toBe(0);
      expect(courses[0].averageCompletionRate).toBe(0);
    });
  });

  describe("getCourseStudentsProgress", () => {
    it("throws FORBIDDEN when teacher is not assigned to course", async () => {
      const mockCourse = {
        id: 5,
        name: "Unassigned Course",
        teacherId: 99,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCourse]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: [],
          courseIds: [1], // Not course 5
          studentId: null,
          schoolId: 1,
        },
      });

      await expect(
        caller.getCourseStudentsProgress({ courseId: 5 }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("returns roster and progress for authorized teacher", async () => {
      const mockCourse = {
        id: 1,
        name: "General English",
        totalSessions: 12,
        teacherId: 2,
      };

      const mockRoster = [
        {
          progressId: 1,
          studentId: 101,
          courseId: 1,
          currentSession: 6,
          completedSessions: 5,
          status: "in_progress",
          notes: "Good work",
          updatedAt: new Date(),
          studentName: "Alex Popescu",
          studentPhone: "+37369000001",
          parentName: "Maria Popescu",
          parentPhone: "+37360000000",
        },
      ];

      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockCourse]),
              }),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockRoster),
            }),
          }),
        };
      });

      const caller = teacherRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: [],
          courseIds: [1],
          studentId: null,
          schoolId: 1,
        },
      });

      const result = await caller.getCourseStudentsProgress({ courseId: 1 });
      expect(result.course.id).toBe(1);
      expect(result.students).toHaveLength(1);
      expect(result.students[0].name).toBe("Alex Popescu");
      expect(result.students[0].phone).toBe("+37369000001");
      expect(result.students[0].currentSession).toBe(6);
      expect(result.students[0].progressPercentage).toBe(42); // 5/12 = 41.66% -> 42%
    });
  });

  describe("updateStudentProgress", () => {
    it("updates progress and applies smart completed status when total sessions reached", async () => {
      const mockCourse = {
        id: 1,
        totalSessions: 10,
        teacherId: 2,
      };

      const mockExistingProgress = {
        id: 1,
        studentId: 101,
        courseId: 1,
        currentSession: 9,
        completedSessions: 8,
        status: "in_progress",
        notes: "Almost done",
      };

      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              // First call gets course, second gets existing progress
              if (!db.select.prototype._calledCourse) {
                db.select.prototype._calledCourse = true;
                return Promise.resolve([mockCourse]);
              }
              return Promise.resolve([mockExistingProgress]);
            }),
          })),
        })),
      }));
      db.select.prototype._calledCourse = false;

      const updatedRecord = {
        ...mockExistingProgress,
        currentSession: 10,
        completedSessions: 10,
        status: "completed",
        notes: "Completed course",
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRecord]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: [],
          courseIds: [1],
          studentId: null,
          schoolId: 1,
        },
      });

      const result = await caller.updateStudentProgress({
        courseId: 1,
        studentId: 101,
        currentSession: 10,
        completedSessions: 10,
        notes: "Completed course",
      });

      expect(result.status).toBe("completed");
      expect(result.currentSession).toBe(10);
      expect(result.completedSessions).toBe(10);
    });

    it("prevents cross-course tampering by checking teacher course authorization", async () => {
      const mockCourse = {
        id: 3,
        totalSessions: 10,
        teacherId: 99, // Another teacher
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCourse]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({
        user: {
          id: "2",
          role: "teacher",
          permissions: [],
          courseIds: [1], // Not course 3
          studentId: null,
          schoolId: 1,
        },
      });

      await expect(
        caller.updateStudentProgress({
          courseId: 3,
          studentId: 101,
          currentSession: 2,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });
});
