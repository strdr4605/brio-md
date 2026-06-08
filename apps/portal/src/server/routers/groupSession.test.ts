import { describe, it, expect, vi, beforeEach } from "vitest";

const insertValues: unknown[] = [];
const selectImpl = vi.fn();

const defaultSelectResult = {
  from: () => ({
    where: () => ({
      limit: async () => [],
    }),
  }),
};

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (v: unknown) => {
        insertValues.push(v);
        return {
          returning: async () => {
            if (insertValues.length > 1) {
              const err = new Error("duplicate key value violates unique constraint");
              (err as { code?: string }).code = "23505";
              throw err;
            }
            return [{ id: 1, ...(v as object) }];
          },
        };
      },
    }),
    select: (...args: unknown[]) => {
      return selectImpl(...args);
    },
    delete: () => ({
      where: async () => undefined,
    }),
  },
}));

import { groupSessionRouter } from "./groupSession";

const caller = groupSessionRouter.createCaller({
  user: {
    id: "1",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  },
});

describe("groupSessionRouter", () => {
  beforeEach(() => {
    insertValues.length = 0;
    selectImpl.mockReset();
    selectImpl.mockImplementation(() => defaultSelectResult);
  });

  it("create rejects duplicate (groupId, date) with BAD_REQUEST", async () => {
    await expect(caller.create({ groupId: 1, date: "2026-06-08" })).resolves.toBeDefined();

    await expect(caller.create({ groupId: 1, date: "2026-06-08" })).rejects.toThrow(/exista|lec/i);
  });

  it("remove rejects when attendance exists", async () => {
    selectImpl.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 1 }],
        }),
      }),
    }));

    await expect(caller.remove({ id: 5 })).rejects.toThrow(/prezențele/i);
  });
});
