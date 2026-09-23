import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { attendanceRouter } from "./attendance";

vi.mock("@/lib/db", () => {
  const mockDb: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  mockDb.transaction = vi.fn(async (cb: any) => cb(mockDb));
  return { db: mockDb };
});

import { db } from "@/lib/db";

describe("attendanceRouter & Server-side Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const superUser = {
    id: "1",
    email: "super@example.com",
    name: "Super Admin",
    role: "superadmin",
    permissions: ["super"],
    courseIds: [],
    schoolId: 1,
  };

  const adminUser = {
    id: "2",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    schoolId: 1,
  };

  const assignedTeacher = {
    id: "10",
    email: "teacher10@example.com",
    name: "Assigned Teacher",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1],
    schoolId: 1,
  };

  const otherTeacher = {
    id: "99",
    email: "teacher99@example.com",
    name: "Other Teacher",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [2],
    schoolId: 1,
  };

  const testGroup = {
    id: 5,
    courseId: 1,
    schoolId: 1,
    name: "Robotics Tuesday 17:30",
    teacherId: 10, // Assigned to teacher 10
    active: true,
  };

  describe("attendance.submit authorization guard", () => {
    it("allows superadmin to submit attendance for any group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                groupId: 5,
                courseId: 1,
                studentId: 101,
                date: "2026-09-14",
                status: "present",
                comment: null,
                markedByUserId: 1,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: superUser });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 101, status: "present" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("allows admin to submit attendance for any group", async () => {
      // Mock finding the group
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      // Mock upsert
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                groupId: 5,
                courseId: 1,
                studentId: 101,
                date: "2026-09-14",
                status: "present",
                comment: null,
                markedByUserId: 2,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 101, status: "present" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("allows assigned teacher to submit attendance for their assigned group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 2,
                groupId: 5,
                courseId: 1,
                studentId: 102,
                date: "2026-09-14",
                status: "absent",
                comment: "Sick",
                markedByUserId: 10,
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.submit({
        groupId: 5,
        date: "2026-09-14",
        records: [{ studentId: 102, status: "absent", comment: "Sick" }],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("prevents teacher from submitting attendance for a group they do not teach (FORBIDDEN)", async () => {
      // testGroup has teacherId = 10, but caller is otherTeacher (id = 99)
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });

      await expect(
        caller.submit({
          groupId: 5,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });

    it("throws NOT_FOUND if group does not exist", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });

      await expect(
        caller.submit({
          groupId: 999,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "NOT_FOUND",
        }),
      );
    });

    it("throws UNAUTHORIZED if user is not logged in", async () => {
      const caller = attendanceRouter.createCaller({ user: null });

      await expect(
        caller.submit({
          groupId: 5,
          date: "2026-09-14",
          records: [{ studentId: 101, status: "present" }],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("attendance.getByGroupAndDate authorization guard", () => {
    it("allows admin to view attendance for any group", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, groupId: 5, studentId: 101, date: "2026-09-14", status: "present" },
          ]),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.getByGroupAndDate({ groupId: 5, date: "2026-09-14" });
      expect(result).toHaveLength(1);
    });

    it("prevents unassigned teacher from viewing attendance for another group", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });
      await expect(
        caller.getByGroupAndDate({ groupId: 5, date: "2026-09-14" }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });
  });

  describe("attendance.getSheet", () => {
    it("returns enrolled students with attendance records and absence comments", async () => {
      // 1. Group query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([testGroup]),
            }),
          }),
        })
        // 2. Enrolled students query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([
                  {
                    studentId: 101,
                    studentName: "Alex Popescu",
                    studentPhone: "+37369000001",
                    parentName: "Maria Popescu",
                    parentPhone: "+37360000000",
                    age: 14,
                  },
                ]),
              }),
            }),
          }),
        })
        // 3. Existing attendance records query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                studentId: 101,
                status: "absent",
                comment: "Bolnav - febră",
                markedByUserId: 10,
                updatedAt: new Date("2026-09-15"),
              },
            ]),
          }),
        });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.getSheet({ groupId: 5, date: "2026-09-15" });

      expect(result).toHaveLength(1);
      expect(result[0].studentName).toBe("Alex Popescu");
      expect(result[0].parentPhone).toBe("+37360000000");
      expect(result[0].status).toBe("absent");
      expect(result[0].comment).toBe("Bolnav - febră");
    });

    it("prevents unassigned teacher from accessing the attendance sheet (FORBIDDEN)", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher });
      await expect(
        caller.getSheet({ groupId: 5, date: "2026-09-15" }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        }),
      );
    });
  });

  describe("attendance.getByStudent", () => {
    it("returns records and calculates summary statistics accurately", async () => {
      const mockStudent = {
        id: 101,
        name: "Test Student",
        schoolId: 1,
      };

      const mockRecords = [
        {
          id: 1,
          groupId: 5,
          groupName: "Grupa A",
          courseId: 2,
          courseName: "Robotică",
          courseLevel: "beginner",
          scheduleDays: ["tue"],
          scheduleTime: "17:30",
          room: "Lab 1",
          date: "2026-09-11",
          status: "present",
          comment: "Excelentă participare",
        },
        {
          id: 2,
          groupId: 5,
          groupName: "Grupa A",
          courseId: 2,
          courseName: "Robotică",
          courseLevel: "beginner",
          scheduleDays: ["tue"],
          scheduleTime: "17:30",
          room: "Lab 1",
          date: "2026-09-04",
          status: "late",
          comment: "Întârziat 5 min",
        },
        {
          id: 3,
          groupId: 5,
          groupName: "Grupa A",
          courseId: 2,
          courseName: "Robotică",
          courseLevel: "beginner",
          scheduleDays: ["tue"],
          scheduleTime: "17:30",
          room: "Lab 1",
          date: "2026-08-28",
          status: "absent",
          comment: null,
        },
        {
          id: 4,
          groupId: 5,
          groupName: "Grupa A",
          courseId: 2,
          courseName: "Robotică",
          courseLevel: "beginner",
          scheduleDays: ["tue"],
          scheduleTime: "17:30",
          room: "Lab 1",
          date: "2026-08-21",
          status: "excused",
          comment: "Motivat medical",
        },
      ];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockRecords),
                }),
              }),
            }),
          }),
        });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.getByStudent({ studentId: 101 });

      expect(result.records).toHaveLength(4);
      expect(result.summary).toEqual({
        totalSessions: 4,
        attendedCount: 2, // 1 present + 1 late
        presentCount: 1,
        lateCount: 1,
        absentCount: 1,
        excusedCount: 1,
        attendanceRate: 50, // (2 / 4) * 100 = 50%
      });
    });

    it("returns attendanceRate: null when student has 0 sessions recorded", async () => {
      const mockStudent = {
        id: 102,
        name: "New Student",
        schoolId: 1,
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.getByStudent({ studentId: 102 });

      expect(result.records).toHaveLength(0);
      expect(result.summary).toEqual({
        totalSessions: 0,
        attendedCount: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        attendanceRate: null,
      });
    });

    it("throws NOT_FOUND when student does not exist", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      await expect(caller.getByStudent({ studentId: 999 })).rejects.toThrow(
        expect.objectContaining({ code: "NOT_FOUND" }),
      );
    });

    it("throws FORBIDDEN when admin attempts to access student from another school", async () => {
      const mockStudent = {
        id: 101,
        name: "Different School Student",
        schoolId: 99, // user is schoolId 1
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      await expect(caller.getByStudent({ studentId: 101 })).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });
  });

  describe("attendance.getJournal", () => {
    it("returns gradebook matrix data for an authorized user", async () => {
      const mockGroup = {
        id: 5,
        name: "Grupa Robotică A1",
        courseId: 1,
        courseName: "Robotică",
        schoolId: 1,
        room: "Sala 3",
        scheduleDays: ["mon", "wed"],
        scheduleTime: "17:00 - 18:30",
        teacherId: 10,
        teacherName: "Assigned Teacher",
      };

      const mockStudents = [
        {
          studentId: 101,
          studentName: "Ana Ionescu",
          studentPhone: "+37368000001",
          parentName: "Elena Ionescu",
          parentPhone: "+37368000002",
          age: 12,
        },
      ];

      const mockRecords = [
        {
          id: 1,
          groupId: 5,
          studentId: 101,
          date: "2026-09-02",
          status: "present",
          comment: null,
        },
      ];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockGroup]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockStudents),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRecords),
          }),
        });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.getJournal({ groupId: 5, month: "2026-09" });

      expect(result.group.id).toBe(5);
      expect(result.students).toHaveLength(1);
      expect(result.dates.length).toBeGreaterThan(0);
      expect(result.records["101_2026-09-02"]).toEqual({
        status: "present",
        comment: null,
      });
    });

    it("rejects unauthorized teacher trying to view another teacher's journal", async () => {
      const mockGroup = {
        id: 5,
        name: "Grupa Robotică A1",
        teacherId: 10, // Assigned to 10
      };

      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockGroup]),
              }),
            }),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: otherTeacher }); // id: 99
      await expect(caller.getJournal({ groupId: 5, month: "2026-09" })).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });
  });

  describe("attendance.quickMark", () => {
    it("upserts attendance status on 1-click / 2-click", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                groupId: 5,
                studentId: 101,
                date: "2026-09-17",
                status: "present",
              },
            ]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.quickMark({
        groupId: 5,
        studentId: 101,
        date: "2026-09-17",
        status: "present",
      });

      expect(result.success).toBe(true);
      expect(result.record?.status).toBe("present");
    });

    it("clears attendance record when status is null (3-click cycle)", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testGroup]),
          }),
        }),
      });

      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.quickMark({
        groupId: 5,
        studentId: 101,
        date: "2026-09-17",
        status: null,
      });

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(true);
    });
  });

  describe("attendance.getTeacherActiveSession", () => {
    it("returns null if teacher has no lessons scheduled today", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      const result = await caller.getTeacherActiveSession();

      expect(result.activeSession).toBeNull();
    });
  });

  describe("attendanceRouter.getMatrix & Historical Analytics", () => {
    it("throws FORBIDDEN when a teacher attempts to access matrix", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1, schoolId: 1, teacherId: 10 }]),
            }),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      await expect(caller.getMatrix({ groupId: 1 })).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("throws FORBIDDEN when admin attempts to access group from another school", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1, schoolId: 99 }]),
            }),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      await expect(caller.getMatrix({ groupId: 1 })).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("returns matrix view and flags 3+ consecutive absences for admin", async () => {
      const mockGroup = { id: 1, name: "Grupa Alpha", schoolId: 1, courseId: 5, courseName: "Robotică" };
      const mockStudents = [
        { studentId: 101, studentName: "Ana Popa", studentPhone: "069123456", parentName: "Ion Popa", parentPhone: "069111222", age: 10 },
        { studentId: 102, studentName: "Bogdan Rusu", studentPhone: "068222333", parentName: "Maria Rusu", parentPhone: "068333444", age: 11 },
      ];
      const mockRecords = [
        // Ana: 3 consecutive absences
        { id: 1, studentId: 101, date: "2026-09-01", status: "absent", comment: "Bolnavă" },
        { id: 2, studentId: 101, date: "2026-09-03", status: "absent", comment: "Familie" },
        { id: 3, studentId: 101, date: "2026-09-05", status: "absent", comment: "Fără motiv" },
        { id: 4, studentId: 101, date: "2026-09-08", status: "present", comment: null },
        // Bogdan: 1 absence, 3 present
        { id: 5, studentId: 102, date: "2026-09-01", status: "present", comment: null },
        { id: 6, studentId: 102, date: "2026-09-03", status: "absent", comment: null },
        { id: 7, studentId: 102, date: "2026-09-05", status: "present", comment: null },
        { id: 8, studentId: 102, date: "2026-09-08", status: "present", comment: null },
      ];

      // 1. Group query
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockGroup]),
            }),
          }),
        }),
      });

      // 2. Enrolled students query
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockStudents),
            }),
          }),
        }),
      });

      // 3. Attendance records query
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: adminUser });
      const result = await caller.getMatrix({ groupId: 1, month: "2026-09" });

      expect(result.dates).toEqual(["2026-09-01", "2026-09-03", "2026-09-05", "2026-09-08"]);
      expect(result.summary.totalStudents).toBe(2);
      expect(result.summary.totalDates).toBe(4);
      expect(result.summary.atRiskCount).toBe(1);

      const ana = result.students.find((s) => s.studentId === 101);
      expect(ana?.stats.hasConsecutiveAbsences).toBe(true);
      expect(ana?.stats.maxConsecutiveAbsences).toBe(3);
      expect(ana?.stats.attendanceRate).toBe(25); // 1 present out of 4 sessions
      expect(ana?.cells["2026-09-01"].comment).toBe("Bolnavă");

      const bogdan = result.students.find((s) => s.studentId === 102);
      expect(bogdan?.stats.hasConsecutiveAbsences).toBe(false);
      expect(bogdan?.stats.maxConsecutiveAbsences).toBe(1);
      expect(bogdan?.stats.attendanceRate).toBe(75); // 3 present out of 4 sessions
    });
  });

  describe("attendanceRouter.updateCell", () => {
    it("throws FORBIDDEN when teacher attempts to update cell", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, schoolId: 1, courseId: 10 }]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: assignedTeacher });
      await expect(
        caller.updateCell({
          groupId: 1,
          studentId: 101,
          date: "2026-09-01",
          status: "present",
          comment: "Corectat de admin",
        }),
      ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
    });

    it("allows admin to retroactively update attendance cell", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, schoolId: 1, courseId: 10 }]),
          }),
        }),
      });

      const mockUpdated = {
        id: 99,
        groupId: 1,
        studentId: 101,
        date: "2026-09-01",
        status: "excused",
        comment: "Certificat medical prezentat",
      };

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const caller = attendanceRouter.createCaller({ user: superUser });
      const res = await caller.updateCell({
        groupId: 1,
        studentId: 101,
        date: "2026-09-01",
        status: "excused",
        comment: "Certificat medical prezentat",
      });

      expect(res.success).toBe(true);
      expect(res.record.status).toBe("excused");
      expect(res.record.comment).toBe("Certificat medical prezentat");
    });
  });
});

