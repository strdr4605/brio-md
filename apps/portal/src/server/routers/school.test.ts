import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { schoolRouter } from "./school";
import { userRouter } from "./user";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (password) => `hashed_${password}`),
  compare: vi.fn(async (password, hash) => hash === `hashed_${password}`),
}));

import { db } from "@/lib/db";

describe("schoolRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSchool = {
    id: 1,
    name: "Vibe Academy Botanica",
    address: "bd. Dacia 31, Chișinău",
    phone: "+373 69 123 456",
    email: "botanica@vibe.md",
    bankName: "Moldova Agroindbank SA",
    iban: "MD24AG0000000123456789",
    fiscalCode: "1002600012345",
    createdAt: new Date(),
  };

  it("returns school details for authenticated user", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockSchool]),
        }),
      }),
    });

    const caller = schoolRouter.createCaller({
      user: {
        id: "2",
        email: "admin@vibe.md",
        name: "Admin User",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.getDetails();
    expect(result.id).toBe(1);
    expect(result.name).toBe("Vibe Academy Botanica");
    expect(result.iban).toBe("MD24AG0000000123456789");
    expect(result.fiscalCode).toBe("1002600012345");
  });

  it("throws BAD_REQUEST when user has no associated schoolId", async () => {
    const caller = schoolRouter.createCaller({
      user: {
        id: "3",
        email: "staff@vibe.md",
        name: "Staff Without School",
        role: "teacher",
        permissions: [],
        courseIds: [],
        schoolId: null,
      },
    });

    await expect(caller.getDetails()).rejects.toThrow(TRPCError);
  });

  it("updates school business profile and bank details when admin", async () => {
    const updatedSchool = {
      ...mockSchool,
      bankName: "Victoriabank SA",
      iban: "MD55VI0000000987654321",
      fiscalCode: "1003600099999",
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockSchool]),
        }),
      }),
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedSchool]),
        }),
      }),
    });

    const caller = schoolRouter.createCaller({
      user: {
        id: "2",
        email: "admin@vibe.md",
        name: "Admin User",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    const result = await caller.updateDetails({
      bankName: "Victoriabank SA",
      iban: "MD55VI0000000987654321",
      fiscalCode: "1003600099999",
    });

    expect(result.bankName).toBe("Victoriabank SA");
    expect(result.iban).toBe("MD55VI0000000987654321");
    expect(result.fiscalCode).toBe("1003600099999");
  });

  it("rejects update when regular admin tries to modify another schoolId", async () => {
    const caller = schoolRouter.createCaller({
      user: {
        id: "2",
        email: "admin@vibe.md",
        name: "Admin User",
        role: "admin",
        permissions: ["admin"],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(
      caller.updateDetails({
        schoolId: 2,
        iban: "MD99XX0000000000000000",
      }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("userRouter.changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changes password successfully when current password matches", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: 5, passwordHash: "hashed_oldPassword123" },
          ]),
        }),
      }),
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "5",
        email: "user5@vibe.md",
        name: "Test User",
        role: "teacher",
        permissions: [],
        courseIds: [],
        schoolId: 1,
      },
    });

    const res = await caller.changePassword({
      currentPassword: "oldPassword123",
      newPassword: "newSecurePassword456",
    });

    expect(res.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when current password is wrong", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: 5, passwordHash: "hashed_correctPassword" },
          ]),
        }),
      }),
    });

    const caller = userRouter.createCaller({
      user: {
        id: "5",
        email: "user5@vibe.md",
        name: "Test User",
        role: "teacher",
        permissions: [],
        courseIds: [],
        schoolId: 1,
      },
    });

    await expect(
      caller.changePassword({
        currentPassword: "wrongPassword",
        newPassword: "newSecurePassword456",
      }),
    ).rejects.toThrow(TRPCError);
  });
});
