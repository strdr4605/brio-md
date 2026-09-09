import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { userRouter } from "./user";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (password) => `hashed_${password}`),
}));

import { db } from "@/lib/db";

describe("user.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all users when called by superadmin", async () => {
    // Mock user data
    const mockUsers = [
      {
        id: 1,
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: 1,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        email: "teacher@example.com",
        name: "Teacher",
        role: "teacher",
        permissions: [],
        courseIds: [1],
        schoolId: 1,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        email: "admin@school2.com",
        name: "Admin School 2",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 2,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
    ];

    // Mock the drizzle query chain
    const mockQuery = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockUsers),
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.list({});
    expect(result).toHaveLength(3);
    expect(result[0].email).toBe("super@example.com");
    expect(result[1].email).toBe("teacher@example.com");
    expect(result[2].email).toBe("admin@school2.com");
  });

  it("returns only users in same school when called by admin", async () => {
    // Mock users - only school 1
    const mockUsers = [
      {
        id: 2,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        email: "teacher@example.com",
        name: "Teacher",
        role: "teacher",
        permissions: [],
        courseIds: [1],
        schoolId: 1,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
    ];

    const mockQuery = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockUsers),
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.list({});
    expect(result).toHaveLength(2);
    expect(result.every((u) => u.schoolId === 1)).toBe(true);
  });

  it("returns only self when called by non-admin user", async () => {
    const caller = userRouter.createCaller({
      user: {
        id: "3",
        email: "teacher@example.com",
        name: "Teacher",
        role: "teacher",
        permissions: [],
        courseIds: [1],
        schoolId: 1,
      },
    });

    // Should not query the database - just return the user themselves
    const result = await caller.list({});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
    expect(result[0].email).toBe("teacher@example.com");
    expect(result[0].name).toBe("Teacher");
    // Database should not be called
    expect(db.select).not.toHaveBeenCalled();
  });

  it("filters by active status", async () => {
    const mockUsers = [
      {
        id: 1,
        email: "active@example.com",
        name: "Active User",
        role: "teacher",
        permissions: [],
        courseIds: [],
        schoolId: 1,
        phone: null,
        info: null,
        active: true,
        createdAt: new Date(),
      },
    ];

    const mockQuery = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockUsers),
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.list({ active: true });
    expect(result).toHaveLength(1);
    expect(result[0].active).toBe(true);
  });

  it("returns empty array when non-admin has no school", async () => {
    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: null, // No school assigned
      },
    });

    const result = await caller.list({});
    expect(result).toEqual([]);
    // Database should not be called
    expect(db.select).not.toHaveBeenCalled();
  });

  it("throws UNAUTHORIZED when user is not authenticated", async () => {
    const caller = userRouter.createCaller({
      user: null,
    });

    await expect(caller.list({})).rejects.toThrow(TRPCError);
  });
});
