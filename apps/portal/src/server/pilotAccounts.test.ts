import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("./conflictChecker", () => ({
  checkStudentCourseConflicts: vi.fn(),
  checkStudentGroupConflicts: vi.fn(),
}));

import { db } from "@/lib/db";
import { studentRouter } from "./routers/student";

describe("Pilot Accounts Multi-Tenant Isolation (Issue #247)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const demo01User = {
    id: "101",
    name: "Admin Demo School 1",
    email: "demo01@brio.md",
    role: "admin",
    permissions: ["admin", "manage_billing"],
    courseIds: [],
    schoolId: 1,
  };

  const demo02User = {
    id: "102",
    name: "Admin Demo School 2",
    email: "demo02@brio.md",
    role: "admin",
    permissions: ["admin", "manage_billing"],
    courseIds: [],
    schoolId: 2,
  };

  it("filters students strictly by school_id when demo01 logs in", async () => {
    const school1Students = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Student ${i + 1}`,
      schoolId: 1,
      phone: `+373690000${String(i + 1).padStart(2, "0")}`,
      active: true,
    }));

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(school1Students),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
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

    const caller = studentRouter.createCaller({ user: demo01User });
    const studentsList = await caller.list();

    expect(studentsList).toHaveLength(15);
    expect(studentsList.every((s) => s.schoolId === 1)).toBe(true);
  });

  it("prevents demo01 admin from deleting a student from demo02", async () => {
    const studentFromSchool2 = {
      id: 99,
      name: "School 2 Student",
      schoolId: 2, // belongs to Demo School 2
      phone: "+37369000099",
      active: true,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([studentFromSchool2]),
        }),
      }),
    });

    const caller = studentRouter.createCaller({ user: demo01User });

    await expect(caller.delete({ id: 99 })).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți șterge un student din altă școală",
      }),
    );
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("allows demo01 admin to delete their own student without affecting demo02", async () => {
    const studentFromSchool1 = {
      id: 1,
      name: "School 1 Student",
      schoolId: 1, // belongs to Demo School 1
      phone: "+37369000001",
      active: true,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([studentFromSchool1]),
        }),
      }),
    });

    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const caller = studentRouter.createCaller({ user: demo01User });
    const result = await caller.delete({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it("prevents demo01 admin from updating a student in demo02", async () => {
    const studentFromSchool2 = {
      id: 88,
      name: "School 2 Student",
      schoolId: 2,
      phone: "+37369000088",
      active: true,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([studentFromSchool2]),
        }),
      }),
    });

    const caller = studentRouter.createCaller({ user: demo01User });

    await expect(
      caller.update({
        id: 88,
        name: "Tampered Name",
      }),
    ).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți modifica un student din altă școală",
      }),
    );
  });

  it("allows demo02 admin to manage their own students independently", async () => {
    const studentFromSchool2 = {
      id: 88,
      name: "School 2 Student",
      schoolId: 2,
      phone: "+37369000088",
      active: true,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([studentFromSchool2]),
        }),
      }),
    });

    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const caller = studentRouter.createCaller({ user: demo02User });
    const result = await caller.delete({ id: 88 });

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  const profPilot03User = {
    id: "103",
    name: "Profesor Pilot Sandbox 03",
    email: "prof-pilot03@brio.md",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1, 2],
    schoolId: 3,
  };

  it("filters students strictly by school_id when pilot teacher logs in, seeing exactly 15 students", async () => {
    const school3Students = Array.from({ length: 15 }, (_, i) => ({
      id: i + 31,
      name: `Student ${i + 1}`,
      schoolId: 3,
      phone: `+373693000${String(i + 1).padStart(2, "0")}`,
      active: true,
    }));

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(school3Students),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
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

    const caller = studentRouter.createCaller({ user: profPilot03User });
    const studentsList = await caller.list();

    expect(studentsList).toHaveLength(15);
    expect(studentsList.every((s) => s.schoolId === 3)).toBe(true);
  });

  it("prevents teacher from deleting student from another school", async () => {
    const studentFromSchool1 = {
      id: 1,
      name: "School 1 Student",
      schoolId: 1,
      phone: "+37369000001",
      active: true,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([studentFromSchool1]),
        }),
      }),
    });

    const caller = studentRouter.createCaller({ user: profPilot03User });

    await expect(caller.delete({ id: 1 })).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți șterge un student din altă școală",
      }),
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});
