import { describe, it, expect, vi, beforeEach } from "vitest";
import { teacherRouter } from "./teacher";

// Mock database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("Learning Resources, Lesson Assignment & Submissions", () => {
  const teacherUser = {
    id: "2",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1],
    studentId: null,
    schoolId: 1,
  };

  const studentUser = {
    id: "10",
    role: "student",
    permissions: [],
    courseIds: [1],
    studentId: 101,
    schoolId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  });

  describe("createLearningResource", () => {
    it("creates a new learning resource with typed metadata", async () => {
      const mockResource = {
        id: 1,
        schoolId: 1,
        title: "Fisa de lucru Matematica",
        description: "Exercitii adunare",
        type: "worksheet",
        url: "https://example.com/worksheet-1.pdf",
        metadata: { maxScore: 100, level: "A1", instructions: "Rezolva exercitiile" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockResource]),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });

      const result = await caller.createLearningResource({
        title: "Fisa de lucru Matematica",
        description: "Exercitii adunare",
        type: "worksheet",
        url: "https://example.com/worksheet-1.pdf",
        metadata: { maxScore: 100, level: "A1", instructions: "Rezolva exercitiile" },
        courseId: 1,
        sessionNumber: 3,
      });

      expect(result.id).toBe(1);
      expect(result.type).toBe("worksheet");
      expect(result.title).toBe("Fisa de lucru Matematica");
    });

    it("throws Zod validation error when title or URL is empty", async () => {
      const caller = teacherRouter.createCaller({ user: teacherUser });

      await expect(
        caller.createLearningResource({
          title: "",
          type: "pdf",
          url: "https://example.com",
        } as any),
      ).rejects.toThrow();

      await expect(
        caller.createLearningResource({
          title: "Valid Title",
          type: "pdf",
          url: "",
        } as any),
      ).rejects.toThrow();
    });
  });

  describe("getLibraryResources & getCourseResources", () => {
    it("filters library resources by type", async () => {
      const mockResources = [
        {
          id: 1,
          title: "Manual Romana",
          type: "manual",
          url: "https://example.com/manual.pdf",
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockResources),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.getLibraryResources({ type: "manual" });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("manual");
    });

    it("retrieves assigned course resources for a session", async () => {
      const mockCourseResources = [
        {
          id: 1,
          courseId: 1,
          resourceId: 10,
          sessionNumber: 2,
          orderIndex: 0,
          resource: {
            id: 10,
            title: "Minigame 1",
            type: "minigame",
            url: "https://game.example.com",
          },
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockCourseResources),
            }),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.getCourseResources({ courseId: 1, sessionNumber: 2 });

      expect(result).toHaveLength(1);
      expect(result[0].resource.type).toBe("minigame");
    });

    it("retrieves resource assignments mapping across courses", async () => {
      const mockAssignments = [{ resourceId: 10, courseId: 1, courseName: "Python", sessionNumber: 2 }];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockResolvedValue(mockAssignments),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.getResourceAssignments();

      expect(result).toHaveLength(1);
      expect(result[0].courseName).toBe("Python");
    });
  });

  describe("recordStudentSubmission with restriction guard & presence side-effect", () => {
    it("blocks restricted student with FORBIDDEN error", async () => {
      // Mock restricted enrollment guard finding a restricted status
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: "restricted" }]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: studentUser });

      await expect(
        caller.recordStudentSubmission({
          resourceId: 5,
          courseId: 1,
          status: "completed",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("saves completed submission and triggers automated presence side-effect", async () => {
      // 1. Guard check (not restricted)
      // 2. Overdue invoices check (none)
      // 3. Existing submission check (none)
      // 4. Enrollment group lookup
      // 5. Existing attendance check
      let selectCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCount++;
              if (selectCount === 1) return Promise.resolve([]); // not restricted
              if (selectCount === 2) return Promise.resolve([]); // no overdue
              if (selectCount === 3) return Promise.resolve([]); // no existing sub
              return Promise.resolve([]); // no existing attendance
            }),
          })),
        })),
      }));

      const mockSavedSubmission = {
        id: 1,
        studentId: 101,
        resourceId: 5,
        courseId: 1,
        groupId: 10,
        status: "completed",
        score: 95,
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([mockSavedSubmission]),
        })),
      }));

      const caller = teacherRouter.createCaller({ user: studentUser });

      const result = await caller.recordStudentSubmission({
        resourceId: 5,
        courseId: 1,
        groupId: 10,
        status: "completed",
        score: 95,
      });

      expect(result.status).toBe("completed");
      expect(result.score).toBe(95);
      // Verify db.insert was called for both submission and attendanceRecords
      expect(db.insert).toHaveBeenCalledTimes(2);
    });

    it("returns submissions for the current student in getMyCourseSubmissions", async () => {
      const mockSubmissions = [
        {
          id: 1,
          studentId: 101,
          resourceId: 5,
          courseId: 1,
          status: "completed",
          score: 95,
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSubmissions),
        }),
      });

      const caller = teacherRouter.createCaller({ user: studentUser });
      const subs = await caller.getMyCourseSubmissions({ courseId: 1 });

      expect(subs).toHaveLength(1);
      expect(subs[0].status).toBe("completed");
    });
  });

  describe("getLessonAttendance & updateLessonAttendance", () => {
    it("returns students with isRestricted flag and restrictionReason for debtors", async () => {
      const mockEnrollments = [
        {
          enrollmentId: 1,
          studentId: 101,
          enrollmentStatus: "active",
          groupId: 10,
          courseId: 1,
          studentName: "Mihai Eminescu",
          studentPhone: "079000001",
          parentName: "Gheorghe",
          parentPhone: "079000002",
        },
      ];

      const mockOverdueInvoices = [{ studentId: 101 }];

      let selectCall = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue(mockEnrollments),
          })),
          where: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) return Promise.resolve([]); // attendance records
            return Promise.resolve(mockOverdueInvoices); // overdue invoices
          }),
        })),
      }));

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const roster = await caller.getLessonAttendance({ groupId: 10, date: "2026-10-05" });

      expect(roster).toHaveLength(1);
      expect(roster[0].studentName).toBe("Mihai Eminescu");
      expect(roster[0].isRestricted).toBe(true);
      expect(roster[0].restrictionReason).toBe("Restanță plată");
    });

    it("updates lesson attendance toggle to present/late/absent", async () => {
      const mockUpdatedAttendance = {
        id: 1,
        groupId: 10,
        studentId: 101,
        date: "2026-10-05",
        status: "late",
        comment: "Intarziat 10 min",
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }),
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedAttendance]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.updateLessonAttendance({
        groupId: 10,
        studentId: 101,
        date: "2026-10-05",
        status: "late",
        comment: "Intarziat 10 min",
      });

      expect(result.status).toBe("late");
      expect(result.comment).toBe("Intarziat 10 min");
    });
  });

  describe("getNextCourseSession & orderIndex", () => {
    it("calculates next session number accurately based on existing course sessions", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { sessionNumber: 1 },
            { sessionNumber: 2 },
            { sessionNumber: 1 }, // duplicate session should be deduped
          ]),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.getNextCourseSession({ courseId: 1 });

      expect(result.nextSessionNumber).toBe(3);
      expect(result.existingSessions).toEqual([1, 2]);
    });

    it("returns nextSessionNumber as 1 when course has no assigned sessions", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.getNextCourseSession({ courseId: 99 });

      expect(result.nextSessionNumber).toBe(1);
      expect(result.existingSessions).toEqual([]);
    });

    it("creates resource with custom orderIndex", async () => {
      const mockResource = {
        id: 10,
        schoolId: 1,
        title: "Test Order Resource",
        type: "video",
        url: "https://youtube.com/watch?v=123",
      };

      const valuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockResource]),
      });

      (db.insert as any).mockReturnValue({
        values: valuesMock,
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      await caller.createLearningResource({
        title: "Test Order Resource",
        type: "video",
        url: "https://youtube.com/watch?v=123",
        courseId: 1,
        sessionNumber: 2,
        orderIndex: 0, // "Principal" preset
      });

      // Verify that courseLearningResources insertion received orderIndex: 0
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 1,
          resourceId: 10,
          sessionNumber: 2,
          orderIndex: 0,
        }),
      );
    });
  });
});
