import { db } from "@/lib/db";
import {
  studentGroupEnrollments,
  studentResourceSubmissions,
  attendanceRecords,
  invoices,
  learningResources,
} from "@brio-md/db";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type SessionUserInfo = {
  id: string;
  role?: string | null;
  studentId?: number | null;
  schoolId?: number | null;
  permissions?: string[] | null;
};

export async function broadcastResourceToGroupService(params: {
  groupId: number;
  courseId: number;
  resourceId: number;
  user: SessionUserInfo;
}) {
  const { groupId, courseId, resourceId, user } = params;
  const teacherId = parseInt(user.id, 10);

  const enrollments = await db
    .select({ studentId: studentGroupEnrollments.studentId })
    .from(studentGroupEnrollments)
    .where(and(eq(studentGroupEnrollments.groupId, groupId), eq(studentGroupEnrollments.status, "active")));

  if (enrollments.length === 0) return { assignedCount: 0, studentIds: [] };

  const assignedStudentIds: number[] = [];
  for (const enrollment of enrollments) {
    const [existing] = await db
      .select({ id: studentResourceSubmissions.id })
      .from(studentResourceSubmissions)
      .where(and(
        eq(studentResourceSubmissions.studentId, enrollment.studentId),
        eq(studentResourceSubmissions.resourceId, resourceId),
        eq(studentResourceSubmissions.courseId, courseId),
      ))
      .limit(1);

    if (!existing) {
      await db.insert(studentResourceSubmissions).values({
        studentId: enrollment.studentId,
        resourceId,
        courseId,
        groupId,
        teacherId: isNaN(teacherId) ? null : teacherId,
        status: "assigned",
      });
    }
    assignedStudentIds.push(enrollment.studentId);
  }

  return { assignedCount: assignedStudentIds.length, studentIds: assignedStudentIds };
}

export async function assignIndividualResourceService(params: {
  studentId: number;
  courseId: number;
  resourceId: number;
  groupId?: number;
  user: SessionUserInfo;
}) {
  const { studentId, courseId, resourceId, groupId, user } = params;
  const teacherId = parseInt(user.id, 10);

  const [existing] = await db
    .select()
    .from(studentResourceSubmissions)
    .where(and(
      eq(studentResourceSubmissions.studentId, studentId),
      eq(studentResourceSubmissions.resourceId, resourceId),
      eq(studentResourceSubmissions.courseId, courseId),
    ))
    .limit(1);

  if (existing) return existing;

  const [submission] = await db
    .insert(studentResourceSubmissions)
    .values({
      studentId,
      resourceId,
      courseId,
      groupId: groupId ?? null,
      teacherId: isNaN(teacherId) ? null : teacherId,
      status: "assigned",
    })
    .returning();

  return submission;
}

export async function recordStudentSubmissionService(params: {
  studentId?: number;
  resourceId: number;
  courseId: number;
  groupId?: number;
  score?: number | null;
  maxScore?: number | null;
  teacherFeedback?: string | null;
  status?: "assigned" | "in_progress" | "completed" | "reviewed";
  date?: string;
  user: SessionUserInfo;
}) {
  const { user, resourceId, courseId, groupId, score, maxScore, teacherFeedback, date } = params;
  const status = params.status ?? "completed";

  let targetStudentId = params.studentId;
  if (user.role === "student") {
    if (!user.studentId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Student account not linked." });
    }
    targetStudentId = user.studentId;
  } else if (!targetStudentId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Student ID is required." });
  }

  // Guard: check if student has restricted status or overdue debt
  const [restrictedEnrollment] = await db
    .select()
    .from(studentGroupEnrollments)
    .where(and(
      eq(studentGroupEnrollments.studentId, targetStudentId),
      groupId ? eq(studentGroupEnrollments.groupId, groupId) : undefined,
      eq(studentGroupEnrollments.status, "restricted"),
    ))
    .limit(1);

  const [overdueInvoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.studentId, targetStudentId), eq(invoices.status, "overdue")))
    .limit(1);

  if (restrictedEnrollment || overdueInvoice) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acces restricționat: elevul are o restanță financiară sau contul este marcat ca restricționat.",
    });
  }

  const now = new Date();
  const completedAt = status === "completed" || status === "reviewed" ? now : null;

  const [existingSubmission] = await db
    .select()
    .from(studentResourceSubmissions)
    .where(and(
      eq(studentResourceSubmissions.studentId, targetStudentId),
      eq(studentResourceSubmissions.resourceId, resourceId),
      eq(studentResourceSubmissions.courseId, courseId),
    ))
    .limit(1);

  let savedSubmission;
  if (existingSubmission) {
    const [updated] = await db
      .update(studentResourceSubmissions)
      .set({
        score: score ?? existingSubmission.score,
        maxScore: maxScore ?? existingSubmission.maxScore,
        status,
        teacherFeedback: teacherFeedback ?? existingSubmission.teacherFeedback,
        completedAt: completedAt ?? existingSubmission.completedAt,
      })
      .where(eq(studentResourceSubmissions.id, existingSubmission.id))
      .returning();
    savedSubmission = updated;
  } else {
    const teacherId = parseInt(user.id, 10);
    const [inserted] = await db
      .insert(studentResourceSubmissions)
      .values({
        studentId: targetStudentId,
        resourceId,
        courseId,
        groupId: groupId ?? null,
        teacherId: isNaN(teacherId) ? null : teacherId,
        status,
        score: score ?? null,
        maxScore: maxScore ?? null,
        teacherFeedback: teacherFeedback ?? null,
        completedAt,
      })
      .returning();
    savedSubmission = inserted;
  }

  // Side-effect: Automated attendance marking upon submission completion
  if (status === "completed") {
    let attendanceGroupId = groupId;
    if (!attendanceGroupId) {
      const [enrollment] = await db
        .select({ groupId: studentGroupEnrollments.groupId })
        .from(studentGroupEnrollments)
        .where(and(
          eq(studentGroupEnrollments.studentId, targetStudentId),
          eq(studentGroupEnrollments.courseId, courseId),
          eq(studentGroupEnrollments.status, "active"),
        ))
        .limit(1);
      attendanceGroupId = enrollment?.groupId;
    }

    if (attendanceGroupId) {
      const today = date || new Date().toISOString().split("T")[0];
      const [existingAttendance] = await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.groupId, attendanceGroupId),
          eq(attendanceRecords.studentId, targetStudentId),
          eq(attendanceRecords.date, today),
        ))
        .limit(1);

      if (existingAttendance) {
        if (existingAttendance.status !== "present") {
          await db
            .update(attendanceRecords)
            .set({ status: "present", updatedAt: now })
            .where(eq(attendanceRecords.id, existingAttendance.id));
        }
      } else {
        await db.insert(attendanceRecords).values({
          groupId: attendanceGroupId,
          studentId: targetStudentId,
          courseId,
          date: today,
          status: "present",
          comment: "Prezență marcată automat la predarea sarcinii",
        });
      }
    }
  }

  return savedSubmission;
}

export async function bulkFinalizeLessonSubmissionsService(params: {
  courseId: number;
  groupId: number;
  submissions: Array<{
    studentId: number;
    resourceId: number;
    score?: number | null;
    maxScore?: number | null;
    teacherFeedback?: string | null;
    status?: "assigned" | "in_progress" | "completed" | "reviewed";
  }>;
  user: SessionUserInfo;
}) {
  const { courseId, groupId, submissions, user } = params;
  const teacherId = parseInt(user.id, 10);
  const now = new Date();

  for (const sub of submissions) {
    const subStatus = sub.status ?? "completed";
    const [existing] = await db
      .select()
      .from(studentResourceSubmissions)
      .where(and(
        eq(studentResourceSubmissions.studentId, sub.studentId),
        eq(studentResourceSubmissions.resourceId, sub.resourceId),
        eq(studentResourceSubmissions.courseId, courseId),
      ))
      .limit(1);

    if (existing) {
      await db
        .update(studentResourceSubmissions)
        .set({
          score: sub.score ?? existing.score,
          maxScore: sub.maxScore ?? existing.maxScore,
          status: subStatus,
          teacherFeedback: sub.teacherFeedback ?? existing.teacherFeedback,
          completedAt: now,
        })
        .where(eq(studentResourceSubmissions.id, existing.id));
    } else {
      await db.insert(studentResourceSubmissions).values({
        studentId: sub.studentId,
        resourceId: sub.resourceId,
        courseId,
        groupId,
        teacherId: isNaN(teacherId) ? null : teacherId,
        status: subStatus,
        score: sub.score ?? null,
        maxScore: sub.maxScore ?? null,
        teacherFeedback: sub.teacherFeedback ?? null,
        completedAt: now,
      });
    }
  }

  return { success: true, count: submissions.length };
}

export async function getLessonSubmissionsService(params: {
  courseId: number;
  groupId?: number;
  studentId?: number;
}) {
  const { courseId, groupId, studentId } = params;
  const conditions = [eq(studentResourceSubmissions.courseId, courseId)];
  if (groupId) conditions.push(eq(studentResourceSubmissions.groupId, groupId));
  if (studentId) conditions.push(eq(studentResourceSubmissions.studentId, studentId));

  return await db
    .select({
      id: studentResourceSubmissions.id,
      studentId: studentResourceSubmissions.studentId,
      resourceId: studentResourceSubmissions.resourceId,
      status: studentResourceSubmissions.status,
      score: studentResourceSubmissions.score,
      maxScore: studentResourceSubmissions.maxScore,
      teacherFeedback: studentResourceSubmissions.teacherFeedback,
      completedAt: studentResourceSubmissions.completedAt,
      createdAt: studentResourceSubmissions.createdAt,
      resourceTitle: learningResources.title,
      resourceType: learningResources.type,
      resourceUrl: learningResources.url,
    })
    .from(studentResourceSubmissions)
    .innerJoin(learningResources, eq(studentResourceSubmissions.resourceId, learningResources.id))
    .where(and(...conditions));
}
