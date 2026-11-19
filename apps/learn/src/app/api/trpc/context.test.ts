import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@brio-md/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { createLearnContext } from "./[trpc]/route";

describe("apps/learn createLearnContext (Issue #275)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { user: null } when session is absent", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const ctx = await createLearnContext();
    expect(ctx.user).toBeNull();
  });

  it("returns { user: null } when session is marked expired", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", expired: true },
    } as any);

    const ctx = await createLearnContext();
    expect(ctx.user).toBeNull();
  });

  it("returns { user: null } when dbUser is inactive (active = false)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", expired: false },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 42,
              email: "student@brio.md",
              active: false,
            },
          ]),
        }),
      }),
    } as any);

    const ctx = await createLearnContext();
    expect(ctx.user).toBeNull();
  });

  it("returns { user: null } when user record is not found in database", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", expired: false },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const ctx = await createLearnContext();
    expect(ctx.user).toBeNull();
  });

  it("returns { user: null } when dbUser lastChangedAt is newer than session token", async () => {
    const sessionDate = new Date("2026-01-01T10:00:00Z");
    const newerDate = new Date("2026-01-01T11:00:00Z");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", expired: false, lastChangedAt: sessionDate },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 42,
              email: "student@brio.md",
              active: true,
              lastChangedAt: newerDate,
            },
          ]),
        }),
      }),
    } as any);

    const ctx = await createLearnContext();
    expect(ctx.user).toBeNull();
  });

  it("returns user object when user is active and token is fresh", async () => {
    const validDate = new Date("2026-01-01T10:00:00Z");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", expired: false, lastChangedAt: validDate },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 42,
              email: "student@brio.md",
              name: "Student Active",
              role: "student",
              permissions: [],
              courseIds: [1, 2],
              studentId: 10,
              schoolId: 1,
              active: true,
              lastChangedAt: validDate,
            },
          ]),
        }),
      }),
    } as any);

    const ctx = await createLearnContext();
    expect(ctx.user).toEqual({
      id: "42",
      email: "student@brio.md",
      name: "Student Active",
      role: "student",
      permissions: [],
      courseIds: [1, 2],
      studentId: 10,
      schoolId: 1,
    });
  });
});
