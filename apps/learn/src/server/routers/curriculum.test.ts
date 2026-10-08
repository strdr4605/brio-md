import { describe, it, expect, vi, beforeEach } from "vitest";
import { teacherRouter } from "./teacher";
import { resourceRouter } from "./resource";

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
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { db } from "@/lib/db";

describe("Curriculum & Course Session Resource Manager Router", () => {
  const teacherUser = {
    id: "2",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1],
    studentId: null,
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
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
  });

  describe("assignResourceToSession", () => {
    it("inserts a new course learning resource with custom settings", async () => {
      // Mock existing assignment check -> returns empty
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockCreated = {
        id: 101,
        courseId: 1,
        resourceId: 5,
        sessionNumber: 3,
        orderIndex: 2,
        settings: {
          maxScore: 100,
          targetMinigamesCount: 4,
          instructions: "Completeaza exercitiile interactive",
        },
      };

      const valuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockCreated]),
      });
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.assignResourceToSession({
        courseId: 1,
        resourceId: 5,
        sessionNumber: 3,
        orderIndex: 2,
        settings: {
          maxScore: 100,
          targetMinigamesCount: 4,
          instructions: "Completeaza exercitiile interactive",
        },
      });

      expect(result).toEqual(mockCreated);
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 1,
          resourceId: 5,
          sessionNumber: 3,
          orderIndex: 2,
          settings: {
            maxScore: 100,
            targetMinigamesCount: 4,
            instructions: "Completeaza exercitiile interactive",
          },
        }),
      );
    });

    it("updates existing course learning resource when already assigned", async () => {
      const existing = {
        id: 55,
        courseId: 1,
        resourceId: 5,
        sessionNumber: 2,
        orderIndex: 1,
        settings: { maxScore: 50 },
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      const updated = {
        ...existing,
        sessionNumber: 3,
        orderIndex: 0,
        settings: { maxScore: 80, targetMinigamesCount: 2 },
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const caller = resourceRouter.createCaller({ user: teacherUser });
      const result = await caller.assignResourceToSession({
        courseId: 1,
        resourceId: 5,
        sessionNumber: 3,
        orderIndex: 0,
        settings: { maxScore: 80, targetMinigamesCount: 2 },
      });

      expect(result).toEqual(updated);
    });
  });

  describe("updateCourseResourceSettings", () => {
    it("updates settings and orderIndex for an existing assignment", async () => {
      const existing = {
        id: 77,
        courseId: 1,
        resourceId: 12,
        sessionNumber: 1,
        orderIndex: 0,
        settings: { maxScore: 50 },
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      const updated = {
        ...existing,
        settings: { maxScore: 100, instructions: "Rezolva testul" },
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.updateCourseResourceSettings({
        id: 77,
        settings: { maxScore: 100, instructions: "Rezolva testul" },
      });

      expect(result).toEqual(updated);
    });

    it("throws NOT_FOUND when updating non-existent assignment", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      await expect(
        caller.updateCourseResourceSettings({
          id: 9999,
          settings: { maxScore: 100 },
        }),
      ).rejects.toThrow("Asignarea resursei nu a fost găsită.");
    });
  });

  describe("detachResourceFromSession", () => {
    it("deletes course learning resource by id", async () => {
      const deletedRecord = { id: 88, courseId: 1, resourceId: 4 };

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedRecord]),
        }),
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.detachResourceFromSession({ id: 88 });

      expect(result).toEqual(deletedRecord);
    });

    it("deletes course learning resource by courseId, resourceId and sessionNumber", async () => {
      const deletedRecord = { id: 99, courseId: 1, resourceId: 7, sessionNumber: 2 };

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedRecord]),
        }),
      });

      const caller = resourceRouter.createCaller({ user: teacherUser });
      const result = await caller.detachResourceFromSession({
        courseId: 1,
        resourceId: 7,
        sessionNumber: 2,
      });

      expect(result).toEqual(deletedRecord);
    });
  });

  describe("reorderSessionResources", () => {
    it("updates orderIndex for all provided items", async () => {
      const updateSetMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      (db.update as any).mockReturnValue({
        set: updateSetMock,
      });

      const caller = teacherRouter.createCaller({ user: teacherUser });
      const result = await caller.reorderSessionResources({
        courseId: 1,
        sessionNumber: 2,
        items: [
          { id: 10, orderIndex: 0 },
          { id: 11, orderIndex: 1 },
          { id: 12, orderIndex: 2 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(updateSetMock).toHaveBeenCalledTimes(3);
      expect(updateSetMock).toHaveBeenCalledWith({ orderIndex: 0 });
      expect(updateSetMock).toHaveBeenCalledWith({ orderIndex: 1 });
      expect(updateSetMock).toHaveBeenCalledWith({ orderIndex: 2 });
    });
  });
});
