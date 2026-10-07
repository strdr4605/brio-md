import { describe, it, expect, vi, beforeEach } from "vitest";
import { submissionRouter } from "./submission";

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

describe("submissionRouter & submissionService", () => {
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
  });

  describe("broadcastResourceToGroup", () => {
    it("broadcasts resource to all active students in group", async () => {
      const mockActiveEnrollments = [
        { studentId: 101 },
        { studentId: 102 },
      ];

      let whereCall = 0;
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            whereCall++;
            if (whereCall === 1) {
              return Promise.resolve(mockActiveEnrollments);
            }
            return {
              limit: vi.fn().mockResolvedValue([]),
            };
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.broadcastResourceToGroup({
        groupId: 10,
        courseId: 1,
        resourceId: 5,
      });

      expect(result.assignedCount).toBe(2);
      expect(result.studentIds).toEqual([101, 102]);
      expect(db.insert).toHaveBeenCalled();
    });

    it("returns zero assigned when group has no active students", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.broadcastResourceToGroup({
        groupId: 99,
        courseId: 1,
        resourceId: 5,
      });

      expect(result.assignedCount).toBe(0);
      expect(result.studentIds).toEqual([]);
    });
  });

  describe("assignIndividualResource", () => {
    it("creates assigned record for individual student", async () => {
      // Mock existing check returning empty (none exists)
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockCreated = {
        id: 1,
        studentId: 101,
        resourceId: 8,
        courseId: 1,
        groupId: 10,
        status: "assigned",
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.assignIndividualResource({
        studentId: 101,
        courseId: 1,
        resourceId: 8,
        groupId: 10,
      });

      expect(result.id).toBe(1);
      expect(result.status).toBe("assigned");
      expect(result.resourceId).toBe(8);
    });

    it("returns existing record without creating duplicate", async () => {
      const existing = {
        id: 99,
        studentId: 101,
        resourceId: 8,
        courseId: 1,
        status: "assigned",
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.assignIndividualResource({
        studentId: 101,
        courseId: 1,
        resourceId: 8,
      });

      expect(result.id).toBe(99);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("bulkFinalizeLessonSubmissions", () => {
    it("persists multiple submissions and scores at once", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.bulkFinalizeLessonSubmissions({
        courseId: 1,
        groupId: 10,
        submissions: [
          { studentId: 101, resourceId: 5, score: 90, maxScore: 100, status: "completed" },
          { studentId: 102, resourceId: 6, score: 85, maxScore: 100, status: "completed" },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("recordStudentSubmission", () => {
    it("allows student to submit and records completion", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 1) return Promise.resolve([]);
              if (selectStep === 2) return Promise.resolve([]);
              if (selectStep === 3) return Promise.resolve([]);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, status: "completed", score: 95 }]),
        }),
      });

      const caller = submissionRouter.createCaller({ user: studentUser });
      const result = await caller.recordStudentSubmission({
        resourceId: 5,
        courseId: 1,
        status: "completed",
        score: 95,
      });

      expect(result.status).toBe("completed");
      expect(result.score).toBe(95);
    });
  });

  describe("getLessonSubmissions", () => {
    it("retrieves submissions joined with resource metadata", async () => {
      const mockSubmissions = [
        {
          id: 1,
          studentId: 101,
          resourceId: 5,
          status: "completed",
          score: 100,
          maxScore: 100,
          resourceTitle: "Matematica - Exercitii",
          resourceType: "worksheet",
          resourceUrl: "https://example.com/math.pdf",
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockSubmissions),
          }),
        }),
      });

      const caller = submissionRouter.createCaller({ user: teacherUser });
      const result = await caller.getLessonSubmissions({
        courseId: 1,
        groupId: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].resourceTitle).toBe("Matematica - Exercitii");
      expect(result[0].score).toBe(100);
    });
  });
});
