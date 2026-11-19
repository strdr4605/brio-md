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
import { createPortalContext } from "./[trpc]/route";

describe("apps/portal createPortalContext (Issue #275)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { user: null, db } when session is absent", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const ctx = await createPortalContext();
    expect(ctx.user).toBeNull();
    expect(ctx.db).toBe(db);
  });

  it("returns { user: null, db } when user is inactive", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "10", expired: false },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 10,
              email: "inactive@brio.md",
              active: false,
            },
          ]),
        }),
      }),
    } as any);

    const ctx = await createPortalContext();
    expect(ctx.user).toBeNull();
    expect(ctx.db).toBe(db);
  });

  it("returns { user, db } using the unified singleton db client operating on public schema", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "10", expired: false },
    } as any);

    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 10,
                email: "teacher@brio.md",
                name: "Teacher User",
                role: "teacher",
                permissions: ["teach"],
                courseIds: [1],
                schoolId: 3,
                active: true,
              },
            ]),
          }),
        }),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                schemaName: "tenant_liceul_orizont",
              },
            ]),
          }),
        }),
      } as any);

    const ctx = await createPortalContext();
    expect(ctx.user).toBeDefined();
    expect(ctx.user?.id).toBe("10");
    expect(ctx.user?.schemaName).toBe("tenant_liceul_orizont");
    expect(ctx.db).toBe(db);
  });
});
