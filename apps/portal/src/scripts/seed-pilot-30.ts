/* eslint-disable no-console */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, inArray } from "drizzle-orm";
import { hash } from "bcryptjs";
import {
  schools,
  users,
  courses,
  students,
  permissionDefinitions,
  groups,
  studentGroupEnrollments,
  studentCourseProgress,
} from "@brio-md/db";
import fs from "fs";
import path from "path";
import { GOLDEN_COURSES, GOLDEN_STUDENTS } from "./pilotData";

// Load environment variables if not present in process.env
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  const rootEnv = path.resolve(__dirname, "../../../../.env");
  const localEnv = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  } else if (fs.existsSync(localEnv)) {
    process.loadEnvFile(localEnv);
  }
}

const databaseUrl =
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md";

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function seedPilotAccounts() {
  console.log("🚀 Provisioning 30 isolated pilot demo accounts with activity tracking...");

  // 1. Ensure required permissions exist
  const permissionsList = [
    { key: "admin", label: "Admin Școală", description: "Gestionează utilizatorii și cursurile din școala sa." },
    { key: "manage_billing", label: "Gestiune Facturare", description: "Acces la facturi și plăți." },
    { key: "teach", label: "Profesor", description: "Acces la catalog și lecții live." },
  ];
  for (const perm of permissionsList) {
    await db.insert(permissionDefinitions).values(perm).onConflictDoNothing();
  }

  // Hash pilot password once for high performance
  const pilotPasswordHash = await hash("BrioPilot2026!", 12);

  // 2. Provision each of the 30 isolated pilot schools
  for (let i = 1; i <= 30; i++) {
    const pad = String(i).padStart(2, "0");
    const schoolName = `Demo School ${i}`;
    const adminEmail = `demo${pad}@brio.md`;
    const teacherEmail = `teacher${pad}@brio.md`;

    // 2a. Find or create School
    let [school] = await db.select().from(schools).where(eq(schools.name, schoolName)).limit(1);
    if (!school) {
      [school] = await db.insert(schools).values({ name: schoolName }).returning();
    }

    // 2b. Find or create Admin
    let [admin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (!admin) {
      [admin] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash: pilotPasswordHash,
          name: `Admin ${schoolName}`,
          role: "admin",
          permissions: ["admin", "manage_billing"],
          schoolId: school.id,
          active: true,
        })
        .returning();
    } else {
      [admin] = await db
        .update(users)
        .set({
          passwordHash: pilotPasswordHash,
          schoolId: school.id,
          role: "admin",
          permissions: ["admin", "manage_billing"],
          active: true,
        })
        .where(eq(users.id, admin.id))
        .returning();
    }

    // 2c. Find or create Teacher
    let [teacher] = await db.select().from(users).where(eq(users.email, teacherEmail)).limit(1);
    if (!teacher) {
      [teacher] = await db
        .insert(users)
        .values({
          email: teacherEmail,
          passwordHash: pilotPasswordHash,
          name: `Profesor ${schoolName}`,
          role: "teacher",
          permissions: ["teach"],
          schoolId: school.id,
          active: true,
        })
        .returning();
    } else {
      [teacher] = await db
        .update(users)
        .set({
          passwordHash: pilotPasswordHash,
          schoolId: school.id,
          role: "teacher",
          permissions: ["teach"],
          active: true,
        })
        .where(eq(users.id, teacher.id))
        .returning();
    }

    // 2d. Find or create the 2 Golden Template Courses
    const seededCourses = [];
    for (const cData of GOLDEN_COURSES) {
      let [c] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.schoolId, school.id), eq(courses.name, cData.name)))
        .limit(1);

      if (!c) {
        [c] = await db
          .insert(courses)
          .values({
            ...cData,
            schoolId: school.id,
            teacherId: teacher.id,
          })
          .returning();
      } else {
        [c] = await db
          .update(courses)
          .set({
            ...cData,
            teacherId: teacher.id,
          })
          .where(eq(courses.id, c.id))
          .returning();
      }
      seededCourses.push(c);
    }

    // Assign courses to teacher
    await db
      .update(users)
      .set({ courseIds: seededCourses.map((c) => c.id) })
      .where(eq(users.id, teacher.id));

    // 2e. Find or create study groups for the courses
    const seededGroups = [];
    for (const [idx, course] of seededCourses.entries()) {
      const groupName = idx === 0 ? "Grupa A - Engleză" : "Grupa 1 - Matematică";
      let [g] = await db
        .select()
        .from(groups)
        .where(and(eq(groups.courseId, course.id), eq(groups.name, groupName)))
        .limit(1);

      if (!g) {
        [g] = await db
          .insert(groups)
          .values({
            name: groupName,
            courseId: course.id,
            schoolId: school.id,
            teacherId: teacher.id,
            scheduleDays: course.scheduleDays,
            scheduleTime: course.scheduleTime || "15:00 - 16:00",
            room: idx === 0 ? "Sala 101" : "Sala 201",
            active: true,
          })
          .returning();
      }
      seededGroups.push(g);
    }

    // 2f. Batch clone Golden Template Students (15 students)
    const existingStudents = await db
      .select({ id: students.id, phone: students.phone })
      .from(students)
      .where(eq(students.schoolId, school.id));

    const existingPhones = new Set(existingStudents.map((s) => s.phone));
    const missingStudents = GOLDEN_STUDENTS.filter((st) => !existingPhones.has(st.phone)).map((st) => ({
      ...st,
      schoolId: school.id,
      active: true,
    }));

    if (missingStudents.length > 0) {
      await db.insert(students).values(missingStudents);
    }

    const allSchoolStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.schoolId, school.id));

    // 2g. Batch enroll students & set progress
    if (seededGroups.length >= 2 && allSchoolStudents.length > 0) {
      const studentIds = allSchoolStudents.map((s) => s.id);
      const existingEnrollments = await db
        .select({ studentId: studentGroupEnrollments.studentId, groupId: studentGroupEnrollments.groupId })
        .from(studentGroupEnrollments)
        .where(inArray(studentGroupEnrollments.studentId, studentIds));

      const enrolledKeys = new Set(existingEnrollments.map((e) => `${e.studentId}-${e.groupId}`));
      const newEnrollments = [];
      const newProgress = [];

      for (const [stIdx, student] of allSchoolStudents.entries()) {
        const assignedGroup = stIdx < 8 ? seededGroups[0] : seededGroups[1];
        if (assignedGroup && !enrolledKeys.has(`${student.id}-${assignedGroup.id}`)) {
          newEnrollments.push({
            studentId: student.id,
            groupId: assignedGroup.id,
            courseId: assignedGroup.courseId,
            status: "active" as const,
          });
          newProgress.push({
            studentId: student.id,
            courseId: assignedGroup.courseId,
            status: "in_progress" as const,
            completedSessions: 3,
          });
        }
      }

      if (newEnrollments.length > 0) {
        await db.insert(studentGroupEnrollments).values(newEnrollments);
      }
      if (newProgress.length > 0) {
        await db.insert(studentCourseProgress).values(newProgress).onConflictDoNothing();
      }
    }

    console.log(`✅ [${i}/30] Provisioned ${schoolName} (${adminEmail})`);
  }

  console.log("✨ All 30 isolated pilot demo schools provisioned successfully!");
}

seedPilotAccounts()
  .then(async () => {
    await sql.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Failed to provision pilot accounts:", err);
    await sql.end();
    process.exit(1);
  });
