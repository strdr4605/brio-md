import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { userRouter } from "./user";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

  it("returns all users when called by role-only superadmin without explicit super permission", async () => {
    const mockUsers = [
      {
        id: 1,
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: [],
        courseIds: [],
        schoolId: null,
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
        permissions: [],
        courseIds: [],
        schoolId: null,
      },
    });

    const result = await caller.list({});
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("super@example.com");
  });

  it("returns school users when called by role-only admin without explicit admin permission", async () => {
    const mockUsers = [
      {
        id: 2,
        email: "admin@school.com",
        name: "School Admin",
        role: "admin",
        permissions: [],
        courseIds: [],
        schoolId: 5,
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
        email: "admin@school.com",
        name: "School Admin",
        role: "admin",
        permissions: [],
        courseIds: [],
        schoolId: 5,
      },
    });

    const result = await caller.list({});
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("admin@school.com");
  });
});

describe("user.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when requested by superadmin", async () => {
    const mockUser = {
      id: 10,
      email: "target@school.com",
      name: "Target User",
      role: "teacher",
      permissions: [],
      courseIds: [],
      schoolId: 2,
      phone: null,
      info: null,
      active: true,
      createdAt: new Date(),
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: null,
      },
    });

    const result = await caller.getById({ id: 10 });
    expect(result).toEqual(mockUser);
    expect((result as any).passwordHash).toBeUndefined();
  });

  it("throws FORBIDDEN when school admin tries to view user from another school", async () => {
    const mockUser = {
      id: 10,
      email: "target@school2.com",
      name: "Target User",
      role: "teacher",
      permissions: [],
      courseIds: [],
      schoolId: 2,
      phone: null,
      info: null,
      active: true,
      createdAt: new Date(),
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school1.com",
        name: "School 1 Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(caller.getById({ id: 10 })).rejects.toThrow(TRPCError);
  });

  it("throws NOT_FOUND when user does not exist", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: null,
      },
    });

    await expect(caller.getById({ id: 999 })).rejects.toThrow(TRPCError);
  });
});

describe("user.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user successfully and strips passwordHash from result", async () => {
    const mockCreated = {
      id: 5,
      email: "newteacher@school.com",
      passwordHash: "hashed_password123",
      name: "New Teacher",
      role: "teacher",
      permissions: [],
      courseIds: [],
      schoolId: 1,
      phone: null,
      info: null,
      active: true,
    };

    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockCreated]),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.create({
      email: "newteacher@school.com",
      password: "password123",
      name: "New Teacher",
      role: "teacher",
      permissions: [],
    });

    expect(result.id).toBe(5);
    expect(result.email).toBe("newteacher@school.com");
    expect((result as any).passwordHash).toBeUndefined();
  });

  it("throws FORBIDDEN when school admin tries to create superadmin", async () => {
    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(
      caller.create({
        email: "fake-super@school.com",
        password: "password123",
        name: "Fake Super",
        role: "superadmin",
        permissions: [],
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when school admin tries to grant super permission", async () => {
    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(
      caller.create({
        email: "sneaky@school.com",
        password: "password123",
        name: "Sneaky User",
        role: "teacher",
        permissions: ["super"],
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when school admin tries to assign user to another school", async () => {
    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(
      caller.create({
        email: "other@school2.com",
        password: "password123",
        name: "Other School User",
        role: "teacher",
        permissions: [],
        schoolId: 2,
      }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("user.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user successfully and strips passwordHash from response", async () => {
    const existingUser = {
      id: 5,
      email: "teacher@school.com",
      name: "Old Name",
      role: "teacher",
      permissions: [],
      schoolId: 1,
    };
    const updatedUser = {
      ...existingUser,
      name: "Updated Name",
      passwordHash: "new_hashed_password",
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingUser]),
        }),
      }),
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedUser]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.update({
      id: 5,
      name: "Updated Name",
    });

    expect(result.name).toBe("Updated Name");
    expect((result as any).passwordHash).toBeUndefined();
  });

  it("throws NOT_FOUND when target user does not exist", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        permissions: ["super"],
        courseIds: [],
        schoolId: null,
      },
    });

    await expect(caller.update({ id: 999, name: "Nonexistent" })).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when school admin tries to update user from another school", async () => {
    const existingUser = {
      id: 10,
      email: "user@school2.com",
      name: "School 2 User",
      role: "teacher",
      permissions: [],
      schoolId: 2,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingUser]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school1.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(caller.update({ id: 10, name: "Hijacked" })).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when school admin tries to update a superadmin", async () => {
    const existingSuper = {
      id: 1,
      email: "super@example.com",
      name: "Real Super",
      role: "superadmin",
      permissions: ["super"],
      schoolId: 1,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingSuper]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(caller.update({ id: 1, name: "Demoted" })).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when school admin tries to escalate role to superadmin", async () => {
    const existingTeacher = {
      id: 5,
      email: "teacher@school.com",
      name: "Teacher",
      role: "teacher",
      permissions: [],
      schoolId: 1,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingTeacher]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "2",
        email: "admin@school.com",
        name: "Admin",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(caller.update({ id: 5, role: "superadmin" })).rejects.toThrow(TRPCError);
  });
});
