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
  sanitizeTenantSchemaName,
  provisionTenantSchema,
} from "@brio-md/db";
import fs from "fs";
import path from "path";
import { GOLDEN_COURSES, GOLDEN_STUDENTS, PILOT_SCHOOLS } from "./pilotData";

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

  // Hash generic pilot password once for high performance (supports demo01..30)
  const genericPilotPasswordHash = await hash("BrioPilot2026!", 10);

  // 2. Provision each of the 30 isolated pilot schools with both distinct and demo credentials
  for (const schoolConf of PILOT_SCHOOLS) {
    const legacyName = `Demo School ${schoolConf.id}`;
    const legacyAdminEmail = `demo${String(schoolConf.id).padStart(2, "0")}@brio.md`;
    const legacyTeacherEmail = `teacher${String(schoolConf.id).padStart(2, "0")}@brio.md`;
    const passwordHash = await hash(schoolConf.password, 10);

    // 2a. Find or create School with isolated tenant schema
    const schemaName = sanitizeTenantSchemaName(schoolConf.name);
    let [school] = await db.select().from(schools).where(inArray(schools.name, [schoolConf.name, legacyName])).limit(1);

    if (!school) {
      [school] = await db.insert(schools).values({ name: schoolConf.name, schemaName }).returning();
    } else {
      [school] = await db.update(schools).set({ name: schoolConf.name, schemaName }).where(eq(schools.id, school.id)).returning();
    }

    // Provision the isolated PostgreSQL schema for this tenant
    await provisionTenantSchema(sql, schemaName);

    // 2b. Ensure branded Director exists with distinct password
    let [admin] = await db.select().from(users).where(eq(users.email, schoolConf.adminEmail)).limit(1);

    if (!admin) {
      [admin] = await db
        .insert(users)
        .values({
          email: schoolConf.adminEmail,
          passwordHash,
          name: `Director ${schoolConf.name}`,
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
          name: `Director ${schoolConf.name}`,
          passwordHash,
          schoolId: school.id,
          role: "admin",
          permissions: ["admin", "manage_billing"],
          active: true,
        })
        .where(eq(users.id, admin.id))
        .returning();
    }

    // 2c. Ensure generic demo admin (demo01..30@brio.md) exists for internal testing & legacy compatibility
    let [demoAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, legacyAdminEmail))
      .limit(1);

    if (!demoAdmin) {
      await db.insert(users).values({
        email: legacyAdminEmail,
        passwordHash: genericPilotPasswordHash,
        name: `Admin Demo ${schoolConf.id}`,
        role: "admin",
        permissions: ["admin", "manage_billing"],
        schoolId: school.id,
        active: true,
      });
    } else {
      await db
        .update(users)
        .set({
          passwordHash: genericPilotPasswordHash,
          schoolId: school.id,
          role: "admin",
          permissions: ["admin", "manage_billing"],
          active: true,
        })
        .where(eq(users.id, demoAdmin.id));
    }

    // 2d. Ensure branded Teacher exists with distinct password
    let [teacher] = await db
      .select()
      .from(users)
      .where(eq(users.email, schoolConf.teacherEmail))
      .limit(1);

    if (!teacher) {
      [teacher] = await db
        .insert(users)
        .values({
          email: schoolConf.teacherEmail,
          passwordHash,
          name: `Profesor ${schoolConf.name}`,
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
          name: `Profesor ${schoolConf.name}`,
          passwordHash,
          schoolId: school.id,
          role: "teacher",
          permissions: ["teach"],
          active: true,
        })
        .where(eq(users.id, teacher.id))
        .returning();
    }

    // 2e. Ensure generic demo teacher (teacher01..30@brio.md) exists
    let [demoTeacher] = await db
      .select()
      .from(users)
      .where(eq(users.email, legacyTeacherEmail))
      .limit(1);

    if (!demoTeacher) {
      await db.insert(users).values({
        email: legacyTeacherEmail,
        passwordHash: genericPilotPasswordHash,
        name: `Profesor Demo ${schoolConf.id}`,
        role: "teacher",
        permissions: ["teach"],
        schoolId: school.id,
        active: true,
      });
    } else {
      await db
        .update(users)
        .set({
          passwordHash: genericPilotPasswordHash,
          schoolId: school.id,
          role: "teacher",
          permissions: ["teach"],
          active: true,
        })
        .where(eq(users.id, demoTeacher.id));
    }

    // 2f. Find or create the 2 Golden Template Courses
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

    // 2f. Seed single example student (1 student per pilot sandbox)
    const sampleStudent = GOLDEN_STUDENTS[0];
    let [sampleStudentRow] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.schoolId, school.id), eq(students.phone, sampleStudent.phone)))
      .limit(1);

    if (!sampleStudentRow) {
      [sampleStudentRow] = await db
        .insert(students)
        .values({ ...sampleStudent, schoolId: school.id, active: true })
        .returning();
    }

    const allSchoolStudents = await db.select({ id: students.id }).from(students).where(eq(students.schoolId, school.id));
    if (allSchoolStudents.length > 1) {
      const extraIds = allSchoolStudents.filter((s) => s.id !== sampleStudentRow.id).map((s) => s.id);
      if (extraIds.length > 0) {
        await db.delete(studentCourseProgress).where(inArray(studentCourseProgress.studentId, extraIds));
        await db.delete(studentGroupEnrollments).where(inArray(studentGroupEnrollments.studentId, extraIds));
        await db.delete(students).where(inArray(students.id, extraIds));
      }
    }

    // 2g. Enroll sample student into the first group
    if (seededGroups[0]) {
      await db
        .insert(studentGroupEnrollments)
        .values({
          studentId: sampleStudentRow.id,
          groupId: seededGroups[0].id,
          courseId: seededGroups[0].courseId,
          status: "active",
        })
        .onConflictDoNothing();
      await db
        .insert(studentCourseProgress)
        .values({
          studentId: sampleStudentRow.id,
          courseId: seededGroups[0].courseId,
          status: "in_progress",
          completedSessions: 3,
        })
        .onConflictDoNothing();
    }

    // 2h. Seed isolated tenant schema with the 1 example student & course
    const safeSchema = schemaName.replace(/"/g, '""');
    await sql.unsafe(`
      INSERT INTO "${safeSchema}"."courses" ("id", "name", "description", "monthly_fee")
      VALUES (1, 'General English A1-A2', 'Foundational English course focusing on vocabulary and grammar.', 1200)
      ON CONFLICT ("id") DO NOTHING;
      INSERT INTO "${safeSchema}"."groups" ("id", "course_id", "name", "day_of_week", "start_time", "end_time", "cabinet", "monthly_fee")
      VALUES (1, 1, 'Grupa A - Engleză', 1, '15:00', '16:00', 'Sala 101', 1200)
      ON CONFLICT ("id") DO NOTHING;
      INSERT INTO "${safeSchema}"."students" ("id", "name", "phone", "email", "parent_name", "parent_phone", "age", "status")
      VALUES (1, '${sampleStudent.name}', '${sampleStudent.phone}', 'alex@example.md', '${sampleStudent.parentName}', '${sampleStudent.parentPhone}', ${sampleStudent.age}, 'active')
      ON CONFLICT ("id") DO NOTHING;
      INSERT INTO "${safeSchema}"."student_group_enrollments" ("student_id", "group_id", "status")
      SELECT 1, 1, 'active'
      WHERE NOT EXISTS (
        SELECT 1 FROM "${safeSchema}"."student_group_enrollments" WHERE "student_id" = 1 AND "group_id" = 1
      );
    `);

    console.log(`✅ [${schoolConf.id}/30] Provisioned ${schoolConf.name} (${schoolConf.adminEmail})`);
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
