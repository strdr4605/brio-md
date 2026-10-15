import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStudentLmsAccess,
  provisionStudentLmsAccess,
  generateStudentPassword,
} from "./studentLmsService";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("mocked_hashed_password"),
}));

import { db } from "@/lib/db";

describe("studentLmsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateStudentPassword", () => {
    it("generates a password with Brio prefix and 6 digits", () => {
      const pwd = generateStudentPassword();
      expect(pwd).toMatch(/^Brio\d{6}$/);
    });
  });

  describe("getStudentLmsAccess", () => {
    it("throws UNAUTHORIZED when user context is missing", async () => {
      await expect(getStudentLmsAccess(null, 1)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("throws FORBIDDEN when user has insufficient permissions", async () => {
      await expect(
        getStudentLmsAccess({ id: "1", role: "guest", permissions: [] }, 1),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("returns hasAccess: false when no user entry exists for student", async () => {
      const mockSelect = vi.fn()
        // 1. student found
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([{ id: 1, schoolId: 1 }]),
            }),
          }),
        })
        // 2. user not found
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        });

      (db.select as any) = mockSelect;

      const result = await getStudentLmsAccess(
        { id: "1", role: "admin", permissions: ["admin"], schoolId: 1 },
        1,
      );

      expect(result.hasAccess).toBe(false);
      expect(result.user).toBeNull();
    });

    it("returns hasAccess: true when user entry exists for student", async () => {
      const mockSelect = vi.fn()
        // 1. student found
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([{ id: 1, schoolId: 1 }]),
            }),
          }),
        })
        // 2. user found
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([
                {
                  id: 99,
                  email: "elev1@brio.md",
                  name: "Ion Popescu",
                  role: "student",
                  active: true,
                },
              ]),
            }),
          }),
        });

      (db.select as any) = mockSelect;

      const result = await getStudentLmsAccess(
        { id: "1", role: "admin", permissions: ["admin"], schoolId: 1 },
        1,
      );

      expect(result.hasAccess).toBe(true);
      expect(result.user?.email).toBe("elev1@brio.md");
    });
  });

  describe("provisionStudentLmsAccess", () => {
    it("throws FORBIDDEN when called by a teacher without admin role", async () => {
      await expect(
        provisionStudentLmsAccess(
          { id: "5", role: "teacher", permissions: ["teach"], schoolId: 1 },
          { studentId: 1 },
        ),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("provisions new LMS credentials for a student", async () => {
      const mockStudent = {
        id: 15,
        name: "Mihai Eminescu",
        schoolId: 1,
        phone: "+37369111222",
        parentPhone: "+37369333444",
      };

      const mockSelect = vi.fn()
        // 1. student lookup
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([mockStudent]),
            }),
          }),
        })
        // 2. existing user lookup (none)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 3. email collision lookup (none)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        });

      const mockInsert = vi.fn().mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([
            {
              id: 50,
              email: "elev15@brio.md",
              name: "Mihai Eminescu",
              role: "student",
              studentId: 15,
            },
          ]),
        }),
      });

      (db.select as any) = mockSelect;
      (db.insert as any) = mockInsert;

      const result = await provisionStudentLmsAccess(
        { id: "1", role: "admin", permissions: ["admin"], schoolId: 1 },
        { studentId: 15 },
      );

      expect(result.success).toBe(true);
      expect(result.isReset).toBe(false);
      expect(result.username).toBe("elev15@brio.md");
      expect(result.password).toMatch(/^Brio\d{6}$/);
      expect(result.studentName).toBe("Mihai Eminescu");
    });

    it("resets password for an already provisioned student", async () => {
      const mockStudent = {
        id: 15,
        name: "Mihai Eminescu",
        schoolId: 1,
      };

      const mockExistingUser = {
        id: 50,
        email: "elev15@brio.md",
        name: "Mihai Eminescu",
        role: "student",
        studentId: 15,
        phone: "+37369111222",
      };

      const mockSelect = vi.fn()
        // 1. student lookup
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([mockStudent]),
            }),
          }),
        })
        // 2. existing user lookup (found)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([mockExistingUser]),
            }),
          }),
        });

      const mockUpdate = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 50,
                email: "elev15@brio.md",
                name: "Mihai Eminescu",
              },
            ]),
          }),
        }),
      });

      (db.select as any) = mockSelect;
      (db.update as any) = mockUpdate;

      const result = await provisionStudentLmsAccess(
        { id: "1", role: "admin", permissions: ["admin"], schoolId: 1 },
        { studentId: 15, password: "SecretPassword123" },
      );

      expect(result.success).toBe(true);
      expect(result.isReset).toBe(true);
      expect(result.username).toBe("elev15@brio.md");
      expect(result.password).toBe("SecretPassword123");
    });

    it("rejects password shorter than 6 characters", async () => {
      const mockStudent = { id: 15, schoolId: 1 };
      (db.select as any) = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([mockStudent]),
          }),
        }),
      });

      await expect(
        provisionStudentLmsAccess(
          { id: "1", role: "admin", permissions: ["admin"], schoolId: 1 },
          { studentId: 15, password: "123" },
        ),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });
});
