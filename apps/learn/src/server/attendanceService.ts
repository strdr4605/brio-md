import { db } from "@/lib/db";
import {
  students,
  attendanceRecords,
  studentGroupEnrollments,
  studentCourseProgress,
  invoices,
} from "@brio-md/db";
import { and, eq, inArray, ne } from "drizzle-orm";
import {
  SessionUserInfo,
  assertCourseTeacherAccess,
  resolveGroupForCourse,
  getLocalDateString,
} from "./attendanceUtils";

export {
  markLessonAttendanceService,
  submitWorksheetService,
  finalizeLessonAttendanceService,
} from "./attendanceMutations";
export {
  assertCourseTeacherAccess,
  resolveGroupForCourse,
  getLocalDateString,
} from "./attendanceUtils";

export async function getLessonAttendanceService(params: {
  courseId: number;
  groupId: number;
  date?: string;
  user: SessionUserInfo;
}) {
  const { courseId, groupId, user } = params;
  const course = await assertCourseTeacherAccess(courseId, user);
  const date = params.date || getLocalDateString();
  const todayStr = getLocalDateString();

  const group = await resolveGroupForCourse(courseId, groupId);

  // 1. Fetch course progress records
  const progressList = await db
    .select({
      progressId: studentCourseProgress.id,
      studentId: studentCourseProgress.studentId,
      currentSession: studentCourseProgress.currentSession,
      completedSessions: studentCourseProgress.completedSessions,
      status: studentCourseProgress.status,
      notes: studentCourseProgress.notes,
      studentName: students.name,
      studentPhone: students.phone,
      parentName: students.parentName,
      parentPhone: students.parentPhone,
    })
    .from(studentCourseProgress)
    .innerJoin(students, eq(studentCourseProgress.studentId, students.id))
    .where(eq(studentCourseProgress.courseId, courseId));

  // 2. Fetch group enrollments for this specific group
  const groupEnrollments = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentPhone: students.phone,
      parentName: students.parentName,
      parentPhone: students.parentPhone,
    })
    .from(studentGroupEnrollments)
    .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentGroupEnrollments.groupId, group.id),
        inArray(studentGroupEnrollments.status, ["active", "restricted"]),
      ),
    );

  const progressByStudent = new Map(progressList.map((p) => [p.studentId, p]));

  const studentMap = new Map<number, {
    studentId: number;
    studentName: string;
    studentPhone: string | null;
    parentName: string | null;
    parentPhone: string | null;
    currentSession: number;
    completedSessions: number;
    progressStatus: string;
  }>();

  // Strictly scope roster to students enrolled in this group
  for (const ge of groupEnrollments) {
    const p = progressByStudent.get(ge.studentId);
    studentMap.set(ge.studentId, {
      studentId: ge.studentId,
      studentName: ge.studentName,
      studentPhone: ge.studentPhone,
      parentName: ge.parentName,
      parentPhone: ge.parentPhone,
      currentSession: p?.currentSession ?? 1,
      completedSessions: p?.completedSessions ?? 0,
      progressStatus: p?.status ?? "in_progress",
    });
  }

  const allStudentIds = Array.from(studentMap.keys());
  if (allStudentIds.length === 0) {
    return { course, group, date, students: [] };
  }

  // 2. Fetch attendance records for this date and group
  const existingAttendance = group
    ? await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.groupId, group.id),
            eq(attendanceRecords.date, date),
          ),
        )
    : [];

  const attendanceMap = new Map(existingAttendance.map((r) => [r.studentId, r]));

  // 3. Batch fetch invoices with school isolation
  let studentInvoices: any[] = [];
  try {
    const invoiceConditions = [
      inArray(invoices.studentId, allStudentIds),
      ne(invoices.status, "cancelled"),
    ];
    if (course.schoolId) {
      invoiceConditions.push(eq(invoices.schoolId, course.schoolId));
    }

    studentInvoices = await db
      .select({
        studentId: invoices.studentId,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(and(...invoiceConditions));
  } catch {
    studentInvoices = [];
  }

  const invoicesByStudent = new Map<number, typeof studentInvoices>();
  for (const inv of studentInvoices) {
    const list = invoicesByStudent.get(inv.studentId) || [];
    list.push(inv);
    invoicesByStudent.set(inv.studentId, list);
  }

  // 4. Construct response per student
  const studentsResult = Array.from(studentMap.values()).map((s) => {
    const att = attendanceMap.get(s.studentId);
    const status = (att?.status as "present" | "late" | "absent" | "excused" | undefined) || null;
    const comment = att?.comment || null;

    // Filter out draft, paid, and cancelled invoices for debt calculations
    const invs = (invoicesByStudent.get(s.studentId) || []).filter(
      (i) => i.status !== "draft" && i.status !== "paid" && i.status !== "cancelled",
    );
    const debtAmount = invs.reduce(
      (sum, i) => sum + Math.max(0, (i.totalAmount || 0) - (i.paidAmount || 0)),
      0,
    );
    const overdueCount = invs.filter(
      (i) => i.status === "overdue" || (i.dueDate && i.dueDate < todayStr),
    ).length;

    const hasDebt = debtAmount > 0 || overdueCount > 0;
    const isRestricted = hasDebt;
    const restrictionReason = isRestricted
      ? debtAmount > 0
        ? `Restanță financiară (${debtAmount} MDL)`
        : "Restanță financiară"
      : null;

    const isEligibleForAssignment = status === "present" || status === "late";
    const worksheetCompleted = s.completedSessions >= s.currentSession;

    return {
      studentId: s.studentId,
      studentName: s.studentName,
      studentPhone: s.studentPhone,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      currentSession: s.currentSession,
      completedSessions: s.completedSessions,
      progressStatus: s.progressStatus,
      status,
      comment,
      worksheetCompleted,
      isRestricted,
      restrictionReason,
      hasDebt,
      debtAmount,
      isOverdue: overdueCount > 0,
      isEligibleForAssignment,
    };
  });

  return { course, group, date, students: studentsResult };
}
