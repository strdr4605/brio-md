import { describe, it, expect, vi, beforeEach } from "vitest";

const mockState: {
  sessions: Array<{ id: number; groupId: number; date: string; schoolId: number }>;
  enrollments: Array<{
    id: number;
    studentId: number;
    groupId: number;
    status: string;
    startDate: string;
    endDate: string | null;
  }>;
  attendances: Array<{
    id: number;
    groupSessionId: number;
    studentId: number;
    enrollmentId: number;
    status: string;
    notes: string | null;
  }>;
} = {
  sessions: [{ id: 10, groupId: 1, date: "2026-06-08", schoolId: 1 }],
  enrollments: [
    {
      id: 100,
      studentId: 1,
      groupId: 1,
      status: "active",
      startDate: "2026-01-01",
      endDate: null,
    },
  ],
  attendances: [],
};

let selectCallCount = 0;
const selectImpl = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => selectImpl(...args),
    insert: () => ({
      values: (v: {
        groupSessionId: number;
        studentId: number;
        enrollmentId: number;
        status: string;
        notes?: string | null;
      }) => {
        mockState.attendances.push({
          id: mockState.attendances.length + 1,
          ...v,
          notes: v.notes ?? null,
        });
        return {
          onConflictDoUpdate: () => ({
            returning: async () => [{ id: mockState.attendances.length, ...v }],
          }),
          returning: async () => [{ id: mockState.attendances.length, ...v }],
        };
      },
    }),
    update: () => ({
      set: (v: { status: string; notes?: string | null }) => ({
        where: () => ({
          returning: async () => [
            {
              id: 1,
              groupSessionId: 10,
              studentId: 1,
              enrollmentId: 100,
              ...v,
            },
          ],
        }),
      }),
    }),
  },
}));

import { attendanceRouter } from "./attendance";

const caller = attendanceRouter.createCaller({
  user: {
    id: "1",
    role: "teacher",
    permissions: [],
    courseIds: [],
    schoolId: 1,
  },
});

describe("attendanceRouter.bulkSave", () => {
  beforeEach(() => {
    mockState.attendances = [];
    selectImpl.mockReset();
    selectCallCount = 0;
  });

  it("rejects rows for students with no active enrollment and saves valid rows", async () => {
    // Select call sequence:
    //   0: groupSessions lookup (returns the session for groupSessionId 10)
    //   1+: enrollments lookup, one per row, filtered by the row's studentId
    const studentIdQueue: number[] = [1, 999];
    selectImpl.mockImplementation(() => {
      const idx = selectCallCount++;
      if (idx === 0) {
        return {
          from: () => ({
            where: () => ({
              limit: async () => mockState.sessions,
            }),
          }),
        };
      }
      const wantStudent = studentIdQueue[idx - 1] ?? 0;
      return {
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => mockState.enrollments.filter((e) => e.studentId === wantStudent),
            }),
          }),
        }),
      };
    });

    const result = (await caller.bulkSave({
      groupSessionId: 10,
      rows: [
        { studentId: 1, status: "present" },
        { studentId: 999, status: "absent" },
      ],
    })) as { saved: number; rejected: Array<{ studentId: number; reason: string }> };

    expect(result.saved).toBe(1);
    expect(result.rejected).toEqual([{ studentId: 999, reason: "no_active_enrollment" }]);
  });
});
