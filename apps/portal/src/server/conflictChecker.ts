import { eq, and, ne, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { groups, courses, studentGroupEnrollments } from "@/db/schema";
import { db } from "@/lib/db";
import {
  detectGroupConflicts,
  parseTimeRange,
  detectCourseScheduleConflicts,
  detectStudentGroupScheduleConflicts,
} from "@/lib/scheduleConflicts";

type DBType = typeof db;

export type CheckGroupConflictsParams = {
  schoolId?: number | null;
  excludeGroupId?: number;
  courseId: number;
  name: string;
  room?: string | null;
  teacherId?: number | null;
  scheduleDays?: string[];
  scheduleTime?: string | null;
};

export async function checkGroupConflicts(
  database: DBType,
  params: CheckGroupConflictsParams,
) {
  const { schoolId, excludeGroupId, courseId, name, room, teacherId, scheduleDays, scheduleTime } = params;

  // 1. Time format & interval sanity check
  if (scheduleTime && scheduleTime.trim() !== "") {
    const parsed = parseTimeRange(scheduleTime);
    if (!parsed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Format orar invalid. Folosiți formatul 'HH:MM - HH:MM' (ex: 17:30 - 18:30).",
      });
    }
    if (parsed[0] >= parsed[1]) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Intervalul orar este invalid: ora de sfârșit trebuie să fie după ora de început.",
      });
    }
  }

  // 2. Fetch existing active groups in this school to check room/teacher overlaps & duplicate group name
  const conditions = [eq(groups.active, true)];
  if (schoolId) {
    conditions.push(eq(groups.schoolId, schoolId));
  }
  if (excludeGroupId) {
    conditions.push(ne(groups.id, excludeGroupId));
  }

  const existingGroups = await database
    .select({
      id: groups.id,
      name: groups.name,
      courseId: groups.courseId,
      courseName: courses.name,
      room: groups.room,
      teacherId: groups.teacherId,
      scheduleDays: groups.scheduleDays,
      scheduleTime: groups.scheduleTime,
      active: groups.active,
    })
    .from(groups)
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...conditions));

  const conflicts = detectGroupConflicts({
    name,
    courseId,
    excludeGroupId,
    room,
    teacherId,
    scheduleDays,
    scheduleTime,
    existingGroups,
  });

  if (conflicts.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: conflicts[0].message,
    });
  }
}

export type CheckCourseNameParams = {
  schoolId?: number | null;
  excludeCourseId?: number;
  name: string;
};

export async function checkCourseNameConflict(
  database: DBType,
  params: CheckCourseNameParams,
) {
  const { schoolId, excludeCourseId, name } = params;
  const cleanName = name.trim();
  if (!cleanName) return;

  const conditions = [
    sql`LOWER(TRIM(${courses.name})) = LOWER(TRIM(${cleanName}))`,
  ];

  if (schoolId) {
    conditions.push(eq(courses.schoolId, schoolId));
  }
  if (excludeCourseId) {
    conditions.push(ne(courses.id, excludeCourseId));
  }

  const [existing] = await database
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Există deja un curs cu denumirea "${existing.name}" în această școală.`,
    });
  }
}

export async function checkStudentCourseConflicts(
  database: DBType,
  courseIds?: number[] | null,
) {
  if (!courseIds || courseIds.length <= 1) return;

  const selectedCourses = await database
    .select({
      id: courses.id,
      name: courses.name,
      scheduleDays: courses.scheduleDays,
      scheduleTime: courses.scheduleTime,
    })
    .from(courses)
    .where(inArray(courses.id, courseIds));

  const conflicts = detectCourseScheduleConflicts(selectedCourses);
  if (conflicts.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: conflicts[0].message,
    });
  }
}

export async function checkStudentGroupConflicts(
  database: DBType,
  params: {
    studentId: number;
    groupIds: number[];
    excludeEnrollmentId?: number;
  },
) {
  const { studentId, groupIds, excludeEnrollmentId } = params;
  if (!groupIds || groupIds.length === 0) return;

  const targetGroups = await database
    .select({
      id: groups.id,
      name: groups.name,
      courseName: courses.name,
      scheduleDays: groups.scheduleDays,
      scheduleTime: groups.scheduleTime,
      active: groups.active,
    })
    .from(groups)
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(inArray(groups.id, groupIds));

  const existingConditions = [
    eq(studentGroupEnrollments.studentId, studentId),
    eq(studentGroupEnrollments.status, "active"),
  ];
  if (excludeEnrollmentId) {
    existingConditions.push(ne(studentGroupEnrollments.id, excludeEnrollmentId));
  }

  const existingEnrollments = await database
    .select({
      id: groups.id,
      name: groups.name,
      courseName: courses.name,
      scheduleDays: groups.scheduleDays,
      scheduleTime: groups.scheduleTime,
      active: groups.active,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...existingConditions));

  const conflicts = detectStudentGroupScheduleConflicts({
    targetGroups,
    existingGroups: existingEnrollments,
  });

  if (conflicts.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: conflicts[0].message,
    });
  }
}
