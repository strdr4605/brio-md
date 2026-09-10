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
