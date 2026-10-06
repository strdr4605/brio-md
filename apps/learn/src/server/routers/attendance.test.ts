import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { attendanceRouter } from "./attendance";
import { getLocalDateString } from "../attendanceUtils";

// Mock database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("attendanceRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTeacherUser = {
    id: "2",
    role: "teacher",
    permissions: ["teach"],
    courseIds: [1],
    studentId: null,
    schoolId: 1,
  };

  const mockAdminUser = {
    id: "999",
    role: "admin",
    permissions: ["admin"],
    courseIds: [],
    studentId: null,
    schoolId: 1,
  };

  const mockStudentUser = {
    id: "10",
    role: "student",
    permissions: [],
    courseIds: [1],
    studentId: 5,
    schoolId: 1,
  };

  const mockCourse = {
    id: 1,
    name: "Robotics Cohort 1",
    totalSessions: 12,
    teacherId: 2,
    schoolId: 1,
  };

  const mockGroup = {
    id: 10,
    name: "Grupa Robotică 1",
    courseId: 1,
    teacherId: 2,
    schoolId: 1,
  };

  describe("Authorization & Role Guarding", () => {
    it("throws UNAUTHORIZED when user is null", async () => {
      const caller = attendanceRouter.createCaller({ user: null });
      await expect(
        caller.getLessonAttendance({ courseId: 1 }),
      ).rejects.toThrow(TRPCError);
    });

    it("throws FORBIDDEN when user has student role", async () => {
      const caller = attendanceRouter.createCaller({ user: mockStudentUser });
      await expect(
        caller.getLessonAttendance({ courseId: 1 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("throws FORBIDDEN when teacher is not assigned to course", async () => {
      const unassignedTeacher = {
        id: "99",
        role: "teacher",
        permissions: ["teach"],
        courseIds: [2],
        studentId: null,
        schoolId: 1,
      };

      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([mockCourse]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: unassignedTeacher });
      await expect(
        caller.getLessonAttendance({ courseId: 1 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("allows access for admin or superadmin even if unassigned to course", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockAdminUser });
      const result = await caller.getLessonAttendance({ courseId: 1 });
      expect(result.course.id).toBe(1);
    });

    it("allows access for teacher assigned via courseIds array", async () => {
      const courseWithDifferentTeacher = {
        ...mockCourse,
        teacherId: 88, // different teacher ID
      };

      const teacherAssignedViaArray = {
        id: "77",
        role: "teacher",
        permissions: ["teach"],
        courseIds: [1], // assigned through courseIds array
        studentId: null,
        schoolId: 1,
      };

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([courseWithDifferentTeacher]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: teacherAssignedViaArray });
      const result = await caller.getLessonAttendance({ courseId: 1 });
      expect(result.course.id).toBe(1);
    });

    it("throws NOT_FOUND when course does not exist", async () => {
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      await expect(
        caller.getLessonAttendance({ courseId: 9999 }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("guards markLessonAttendance, submitWorksheet, and finalizeLessonAttendance against unassigned teachers", async () => {
      const unassignedTeacher = {
        id: "99",
        role: "teacher",
        permissions: ["teach"],
        courseIds: [2],
        studentId: null,
        schoolId: 1,
      };

      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([mockCourse]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: unassignedTeacher });

      await expect(
        caller.markLessonAttendance({
          courseId: 1,
          studentId: 101,
          date: "2026-10-05",
          status: "present",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.submitWorksheet({
          courseId: 1,
          studentId: 101,
          date: "2026-10-05",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.finalizeLessonAttendance({
          courseId: 1,
          date: "2026-10-05",
          records: [{ studentId: 101, status: "absent" }],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("getLessonAttendance", () => {
    it("queries attendanceRecords, attaches debt info, restricted badge, and eligibility", async () => {
      const mockStudentsProgress = [
        {
          progressId: 1,
          studentId: 101,
          currentSession: 3,
          completedSessions: 2,
          status: "in_progress",
          notes: null,
          studentName: "Ion Popescu",
          studentPhone: "069123456",
          parentName: "Maria Popescu",
          parentPhone: "069123457",
        },
        {
          progressId: 2,
          studentId: 102,
          currentSession: 3,
          completedSessions: 1,
          status: "in_progress",
          notes: null,
          studentName: "Elena Rusu",
          studentPhone: "069222333",
          parentName: null,
          parentPhone: null,
        },
      ];

      const mockAttendance = [
        {
          id: 1,
          groupId: 10,
          studentId: 101,
          date: "2026-10-05",
          status: "late",
          comment: "A întârziat 10 minute",
        },
      ];

      // Student 101 has active debt (restricted), student 102 has paid invoice (clean)
      const mockInvoices = [
        {
          studentId: 101,
          status: "unpaid",
          totalAmount: 1200,
          paidAmount: 200,
          dueDate: "2026-10-01",
        },
        {
          studentId: 102,
          status: "paid",
          totalAmount: 1000,
          paidAmount: 1000,
          dueDate: "2026-10-01",
        },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudentsProgress);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve(mockAttendance);
            if (selectStep === 6) return Promise.resolve(mockInvoices);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudentsProgress);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({
        courseId: 1,
        date: "2026-10-05",
      });

      expect(result.course.id).toBe(1);
      expect(result.group?.id).toBe(10);
      expect(result.date).toBe("2026-10-05");
      expect(result.students).toHaveLength(2);

      // Student 101: marked late -> counts as present and is immediately eligible for assignment!
      const student101 = result.students.find((s) => s.studentId === 101);
      expect(student101).toBeDefined();
      expect(student101?.status).toBe("late");
      expect(student101?.isEligibleForAssignment).toBe(true);
      expect(student101?.hasDebt).toBe(true);
      expect(student101?.debtAmount).toBe(1000);
      expect(student101?.isRestricted).toBe(true);
      expect(student101?.restrictionReason).toContain("Restanță financiară (1000 MDL)");

      // Student 102: unmarked (status: null), zero debt -> not restricted, not eligible yet
      const student102 = result.students.find((s) => s.studentId === 102);
      expect(student102).toBeDefined();
      expect(student102?.status).toBeNull();
      expect(student102?.isEligibleForAssignment).toBe(false);
      expect(student102?.hasDebt).toBe(false);
      expect(student102?.isRestricted).toBe(false);
      expect(student102?.restrictionReason).toBeNull();
    });

    it("defaults date to today (YYYY-MM-DD) when date parameter is omitted", async () => {
      const todayStr = getLocalDateString();
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1 });
      expect(result.date).toBe(todayStr);
    });

    it("maps all presence statuses correctly and assigns eligibility accordingly", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 201, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "P1" },
        { progressId: 2, studentId: 202, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "P2" },
        { progressId: 3, studentId: 203, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "P3" },
        { progressId: 4, studentId: 204, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "P4" },
      ];

      const mockAttendance = [
        { studentId: 201, status: "present", comment: null },
        { studentId: 202, status: "late", comment: null },
        { studentId: 203, status: "absent", comment: null },
        { studentId: 204, status: "excused", comment: null },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve(mockAttendance);
            if (selectStep === 6) return Promise.resolve([]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      const sPresent = result.students.find((s) => s.studentId === 201);
      const sLate = result.students.find((s) => s.studentId === 202);
      const sAbsent = result.students.find((s) => s.studentId === 203);
      const sExcused = result.students.find((s) => s.studentId === 204);

      expect(sPresent?.status).toBe("present");
      expect(sPresent?.isEligibleForAssignment).toBe(true);

      expect(sLate?.status).toBe("late");
      expect(sLate?.isEligibleForAssignment).toBe(true);

      expect(sAbsent?.status).toBe("absent");
      expect(sAbsent?.isEligibleForAssignment).toBe(false);

      expect(sExcused?.status).toBe("excused");
      expect(sExcused?.isEligibleForAssignment).toBe(false);
    });

    it("ignores draft invoices and avoids falsely restricting students", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 301, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "S301" },
      ];

      const draftInvoices = [
        {
          studentId: 301,
          status: "draft", // should be ignored!
          totalAmount: 5000,
          paidAmount: 0,
          dueDate: "2026-10-01",
        },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) return Promise.resolve(draftInvoices);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });
      const student = result.students[0];

      expect(student.hasDebt).toBe(false);
      expect(student.debtAmount).toBe(0);
      expect(student.isRestricted).toBe(false);
      expect(student.restrictionReason).toBeNull();
    });

    it("handles overdue status with zero remaining debt by displaying general restriction without amount", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 302, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "S302" },
      ];

      const overdueZeroRemainder = [
        {
          studentId: 302,
          status: "overdue",
          totalAmount: 1000,
          paidAmount: 1000, // debtAmount will be 0
          dueDate: "2026-09-01",
        },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) return Promise.resolve(overdueZeroRemainder);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });
      const student = result.students[0];

      expect(student.hasDebt).toBe(true);
      expect(student.debtAmount).toBe(0);
      expect(student.isRestricted).toBe(true);
      expect(student.restrictionReason).toBe("Restanță financiară");
    });

    it("prevents negative debt calculation when student is overpaid", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 303, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "S303" },
      ];

      const overpaidInvoice = [
        {
          studentId: 303,
          status: "paid",
          totalAmount: 1000,
          paidAmount: 1500, // overpaid by 500
          dueDate: "2026-10-01",
        },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) return Promise.resolve(overpaidInvoice);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });
      const student = result.students[0];

      expect(student.debtAmount).toBe(0);
      expect(student.hasDebt).toBe(false);
      expect(student.isRestricted).toBe(false);
    });

    it("gracefully falls back when invoice table query throws an error", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 304, currentSession: 1, completedSessions: 0, status: "in_progress", studentName: "S304" },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) throw new Error("Invoices table timeout");
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      expect(result.students).toHaveLength(1);
      expect(result.students[0].hasDebt).toBe(false);
      expect(result.students[0].isRestricted).toBe(false);
    });

    it("returns empty student list when course has no enrolled students", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      expect(result.students).toEqual([]);
      expect(result.course.id).toBe(1);
    });

    it("automatically creates a default group when course has no existing groups", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([]); // No groups!
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const createdGroup = {
        id: 99,
        name: "Grupă Curs #1",
        courseId: 1,
        schoolId: 1,
        teacherId: 2,
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([createdGroup]),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      expect(result.group).toBeDefined();
      expect(result.group?.id).toBe(99);
      expect(result.group?.name).toBe("Grupă Curs #1");
    });

    it("correctly computes worksheetCompleted based on completedSessions >= currentSession", async () => {
      const mockStudents = [
        { progressId: 1, studentId: 401, currentSession: 4, completedSessions: 4, status: "in_progress", studentName: "Completed" },
        { progressId: 2, studentId: 402, currentSession: 4, completedSessions: 3, status: "in_progress", studentName: "Behind" },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve(mockStudents);
            if (selectStep === 4) return Promise.resolve([]);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) return Promise.resolve([]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve(mockStudents);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      const sCompleted = result.students.find((s) => s.studentId === 401);
      const sBehind = result.students.find((s) => s.studentId === 402);

      expect(sCompleted?.worksheetCompleted).toBe(true);
      expect(sBehind?.worksheetCompleted).toBe(false);
    });

    it("merges students from group enrollments who do not yet have course progress records", async () => {
      const mockGroupEnrollments = [
        {
          studentId: 501,
          studentName: "Group Only Student",
          studentPhone: "079000111",
          parentName: "Parent",
          parentPhone: "079000222",
        },
      ];

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            if (selectStep === 2) return Promise.resolve([mockGroup]);
            if (selectStep === 3) return Promise.resolve([]); // empty progressList
            if (selectStep === 4) return Promise.resolve(mockGroupEnrollments);
            if (selectStep === 5) return Promise.resolve([]);
            if (selectStep === 6) return Promise.resolve([]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              selectStep++;
              if (selectStep === 3) return Promise.resolve([]);
              if (selectStep === 4) return Promise.resolve(mockGroupEnrollments);
              return Promise.resolve([]);
            }),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const result = await caller.getLessonAttendance({ courseId: 1, date: "2026-10-05" });

      expect(result.students).toHaveLength(1);
      expect(result.students[0].studentId).toBe(501);
      expect(result.students[0].currentSession).toBe(1);
      expect(result.students[0].completedSessions).toBe(0);
      expect(result.students[0].progressStatus).toBe("in_progress");
    });
  });

  describe("markLessonAttendance & quickMark", () => {
    it("marks student as late and returns eligibility true", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockSavedRecord = {
        id: 50,
        groupId: 10,
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "late",
        comment: null,
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockSavedRecord]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "late",
      });

      expect(res.success).toBe(true);
      expect(res.record?.status).toBe("late");
      expect(res.isEligibleForAssignment).toBe(true);
    });

    it("marks student as present with eligibility true", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockSavedRecord = {
        id: 51,
        groupId: 10,
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "present",
        comment: "Prezent la oră",
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockSavedRecord]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "present",
        comment: "Prezent la oră",
      });

      expect(res.success).toBe(true);
      expect(res.record?.status).toBe("present");
      expect(res.isEligibleForAssignment).toBe(true);
    });

    it("marks student as absent or excused with eligibility false", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockSavedRecord = {
        id: 52,
        groupId: 10,
        courseId: 1,
        studentId: 103,
        date: "2026-10-05",
        status: "absent",
        comment: null,
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockSavedRecord]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 103,
        date: "2026-10-05",
        status: "absent",
      });

      expect(res.success).toBe(true);
      expect(res.record?.status).toBe("absent");
      expect(res.isEligibleForAssignment).toBe(false);
    });

    it("clears attendance record when status is null", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      (db.delete as any).mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: null,
      });

      expect(res.success).toBe(true);
      expect(res.cleared).toBe(true);
      expect(res.isEligibleForAssignment).toBe(false);
    });

    it("quickMark procedure operates identically to markLessonAttendance", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockSavedRecord = {
        id: 53,
        groupId: 10,
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "present",
        comment: "Quick marked",
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockSavedRecord]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.quickMark({
        courseId: 1,
        studentId: 102,
        date: "2026-10-05",
        status: "present",
        comment: "Quick marked",
      });

      expect(res.success).toBe(true);
      expect(res.record?.status).toBe("present");
      expect(res.isEligibleForAssignment).toBe(true);
    });

    it("validates date format rejecting non YYYY-MM-DD strings via Zod", async () => {
      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      await expect(
        caller.markLessonAttendance({
          courseId: 1,
          studentId: 102,
          date: "invalid-date",
          status: "present",
        }),
      ).rejects.toThrow();
    });
  });

  describe("submitWorksheet side-effect", () => {
    it("automatically marks presence as present upon worksheet submission", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockSavedRecord = {
        id: 55,
        groupId: 10,
        courseId: 1,
        studentId: 105,
        date: "2026-10-05",
        status: "present",
        comment: "Prezență automată la predarea fișei",
      };

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockSavedRecord]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.submitWorksheet({
        courseId: 1,
        studentId: 105,
        date: "2026-10-05",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("present");
      expect(res.worksheetCompleted).toBe(true);
      expect(res.isEligibleForAssignment).toBe(true);
      expect(res.record.comment).toBe("Prezență automată la predarea fișei");
    });

    it("defaults date to today when date is omitted", async () => {
      let capturedDate = "";
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          capturedDate = val.date;
          return {
            onConflictDoUpdate: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockResolvedValue([{ ...val, id: 56 }]),
            })),
          };
        }),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const todayStr = getLocalDateString();
      const res = await caller.submitWorksheet({
        courseId: 1,
        studentId: 105,
      });

      expect(res.success).toBe(true);
      expect(capturedDate).toBe(todayStr);
    });
  });

  describe("finalizeLessonAttendance", () => {
    it("bulk saves final statuses for unmarked students", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const mockRecords = [
        {
          studentId: 201,
          status: "absent" as const,
          comment: "Nemotivat",
        },
        {
          studentId: 202,
          status: "excused" as const,
          comment: "Motivat medical",
        },
      ];

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ ...val, id: Math.random() }]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.finalizeLessonAttendance({
        courseId: 1,
        date: "2026-10-05",
        records: mockRecords,
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(2);
      expect(res.records).toHaveLength(2);
    });

    it("handles empty records array gracefully returning count 0", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.finalizeLessonAttendance({
        courseId: 1,
        date: "2026-10-05",
        records: [],
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(0);
      expect(res.records).toEqual([]);
    });

    it("correctly sets markedByUserId and onConflict target for all finalized records", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      const insertedValues: any[] = [];
      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          insertedValues.push(val);
          return {
            onConflictDoUpdate: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockResolvedValue([{ ...val, id: 999 }]),
            })),
          };
        }),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.finalizeLessonAttendance({
        courseId: 1,
        date: "2026-10-05",
        records: [
          { studentId: 601, status: "present", comment: "Present" },
          { studentId: 602, status: "late", comment: "Late" },
          { studentId: 603, status: "absent", comment: "Absent" },
          { studentId: 604, status: "excused", comment: "Excused" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(4);
      expect(insertedValues).toHaveLength(4);
      insertedValues.forEach((val) => {
        expect(val.groupId).toBe(10);
        expect(val.courseId).toBe(1);
        expect(val.date).toBe("2026-10-05");
        expect(val.markedByUserId).toBe(2);
      });
    });
  });

  describe("Two-Way Synchronization with central attendance system", () => {
    it("ensures live lesson mutations update attendance_records compatible with portal AttendanceMatrixTab and AttendanceJournalTable", async () => {
      let insertPayload: any = null;

      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return { limit: vi.fn().mockResolvedValue([mockGroup]) };
          }),
        })),
      }));

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          insertPayload = val;
          return {
            onConflictDoUpdate: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockResolvedValue([
                {
                  id: 999,
                  ...val,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
            })),
          };
        }),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        groupId: 10,
        studentId: 301,
        date: "2026-10-05",
        status: "present",
        comment: "Marcat din live lesson",
      });

      expect(res.success).toBe(true);
      expect(insertPayload).toBeDefined();
      expect(insertPayload.groupId).toBe(10);
      expect(insertPayload.courseId).toBe(1);
      expect(insertPayload.studentId).toBe(301);
      expect(insertPayload.date).toBe("2026-10-05");
      expect(insertPayload.status).toBe("present");
      expect(insertPayload.comment).toBe("Marcat din live lesson");
      expect(insertPayload.markedByUserId).toBe(2);
    });

    it("matches portal billing criteria where late and present both satisfy billing session requirements", async () => {
      // In apps/portal/src/server/billingService.ts:
      // or(eq(attendanceRecords.status, "present"), eq(attendanceRecords.status, "late"))
      // Both live lesson "present" and "late" must grant isEligibleForAssignment: true
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep % 2 === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      (db.insert as any).mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => ({
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([val]),
          })),
        })),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });

      const resPresent = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 701,
        date: "2026-10-05",
        status: "present",
      });
      expect(resPresent.isEligibleForAssignment).toBe(true);

      const resLate = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 702,
        date: "2026-10-05",
        status: "late",
      });
      expect(resLate.isEligibleForAssignment).toBe(true);
    });

    it("matches portal clearing semantics by deleting on composite key (groupId, studentId, date)", async () => {
      let selectStep = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectStep++;
            if (selectStep === 1) return { limit: vi.fn().mockResolvedValue([mockCourse]) };
            return Promise.resolve([mockGroup]);
          }),
        })),
      }));

      let deleteCalled = false;
      (db.delete as any).mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => {
          deleteCalled = true;
          return Promise.resolve([]);
        }),
      }));

      const caller = attendanceRouter.createCaller({ user: mockTeacherUser });
      const res = await caller.markLessonAttendance({
        courseId: 1,
        studentId: 703,
        date: "2026-10-05",
        status: null,
      });

      expect(res.success).toBe(true);
      expect(res.cleared).toBe(true);
      expect(deleteCalled).toBe(true);
    });
  });
});
