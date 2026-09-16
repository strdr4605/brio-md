/* eslint-disable no-console */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import {
  schools,
  users,
  courses,
  permissionDefinitions,
  students,
  courseMaterials,
  studentCourseProgress,
} from "@brio-md/db";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding database...");

  // Find or create school (idempotent)
  let [school] = await db.select().from(schools).where(eq(schools.name, "Vibe Academy")).limit(1);
  if (!school) {
    [school] = await db
      .insert(schools)
      .values({
        name: "Vibe Academy",
      })
      .returning();
    console.log("✅ Created school:", school.name);
  } else {
    console.log("ℹ️ Using existing school:", school.name, `(id: ${school.id})`);
  }

  // Find or create sample students (idempotent)
  async function findOrCreateStudent(data: typeof students.$inferInsert) {
    let [s] = await db
      .select()
      .from(students)
      .where(and(eq(students.schoolId, data.schoolId!), eq(students.phone, data.phone!)))
      .limit(1);
    if (!s) {
      [s] = await db.insert(students).values(data).returning();
      console.log("✅ Created Student:", s.name);
    }
    return s;
  }

  const student1 = await findOrCreateStudent({
    name: "Alex Popescu",
    schoolId: school.id,
    phone: "+37369000001",
    age: 14,
    parentName: "Maria Popescu",
    parentPhone: "+37360000000",
  });

  const student2 = await findOrCreateStudent({
    name: "Elena Ionescu",
    schoolId: school.id,
    phone: "+37369000002",
    age: 12,
    parentName: "Ion Ionescu",
    parentPhone: "+37361111111",
  });

  const student3 = await findOrCreateStudent({
    name: "Mihai Radu",
    schoolId: school.id,
    phone: "+37369000003",
    age: 16,
    parentName: "Victor Radu",
    parentPhone: "+37362222222",
  });

  const student4 = await findOrCreateStudent({
    name: "Sofia Ursu",
    schoolId: school.id,
    phone: "+37369000004",
    age: 11,
    parentName: "Ana Ursu",
    parentPhone: "+37363333333",
  });

  // Create permission definitions
  await db
    .insert(permissionDefinitions)
    .values({
      key: "super",
      label: "Super Administrator",
      description: "Acces complet la sistem. Poate gestiona școli, utilizatori și permisiuni.",
    })
    .onConflictDoNothing();

  await db
    .insert(permissionDefinitions)
    .values({
      key: "admin",
      label: "Admin Școală",
      description: "Gestionează utilizatorii și cursurile din școala sa.",
    })
    .onConflictDoNothing();

  // Create SuperAdmin
  const superadminHash = await hash("admin123", 12);
  await db
    .insert(users)
    .values({
      email: "admin@brio.md",
      passwordHash: superadminHash,
      name: "Super Admin",
      role: "superadmin",
      permissions: ["super"],
      schoolId: null,
    })
    .onConflictDoNothing();

  // Create Admin
  const adminHash = await hash("admin123", 12);
  await db
    .insert(users)
    .values({
      email: "admin@vibe.md",
      passwordHash: adminHash,
      name: "School Admin",
      role: "admin",
      permissions: ["admin"],
      schoolId: school.id,
    })
    .onConflictDoNothing();

  // Create Teacher
  const teacherHash = await hash("teacher123", 12);
  const [teacher] = await db
    .insert(users)
    .values({
      email: "teacher@vibe.md",
      passwordHash: teacherHash,
      name: "John Teacher",
      role: "teacher",
      permissions: ["teach"],
      schoolId: school.id,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "John Teacher",
        schoolId: school.id,
      },
    })
    .returning();
  console.log("✅ Created Teacher:", teacher.name);

  // Find or create Courses (idempotent)
  let [courseEnglish] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.schoolId, school.id), eq(courses.name, "General English A1-A2")))
    .limit(1);
  if (!courseEnglish) {
    [courseEnglish] = await db
      .insert(courses)
      .values({
        name: "General English A1-A2",
        description:
          "Foundational English course focusing on vocabulary, basic grammar, and conversational skills for beginners.",
        level: "beginner",
        totalSessions: 24,
        sessionDurationMinutes: 60,
        scheduleDays: ["mon", "wed", "fri"],
        scheduleTime: "15:00 - 16:00",
        teacherId: teacher.id,
        schoolId: school.id,
        active: true,
      })
      .returning();
  }

  let [courseRobotics] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.schoolId, school.id), eq(courses.name, "Intermediate Robotics & STEM")))
    .limit(1);
  if (!courseRobotics) {
    [courseRobotics] = await db
      .insert(courses)
      .values({
        name: "Intermediate Robotics & STEM",
        description:
          "Hands-on robotics course covering sensor integration, motor controls, and algorithmic problem solving.",
        level: "intermediate",
        totalSessions: 16,
        sessionDurationMinutes: 90,
        scheduleDays: ["tue", "thu"],
        scheduleTime: "16:30 - 18:00",
        teacherId: teacher.id,
        schoolId: school.id,
        active: true,
      })
      .returning();
  }

  let [courseWeb] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.schoolId, school.id), eq(courses.name, "Advanced Web Engineering")))
    .limit(1);
  if (!courseWeb) {
    [courseWeb] = await db
      .insert(courses)
      .values({
        name: "Advanced Web Engineering",
        description:
          "Deep dive into full-stack development with modern TypeScript, databases, and distributed architectures.",
        level: "advanced",
        totalSessions: 30,
        sessionDurationMinutes: 120,
        scheduleDays: ["sat"],
        scheduleTime: "10:00 - 12:00",
        teacherId: teacher.id,
        schoolId: school.id,
        active: true,
      })
      .returning();
  }
  console.log("✅ Using courses with schedules and levels");

  // Assign courses to teacher
  await db
    .update(users)
    .set({ courseIds: [courseEnglish.id, courseRobotics.id, courseWeb.id] })
    .where(eq(users.id, teacher.id));

  // Create Course Materials
  await db.insert(courseMaterials).values([
    {
      courseId: courseEnglish.id,
      title: "English Grammar in Use (5th Edition)",
      type: "textbook",
      url: "https://example.com/materials/english-grammar-in-use.pdf",
      orderIndex: 1,
    },
    {
      courseId: courseEnglish.id,
      title: "Beginner Audio Listening Exercises",
      type: "link",
      url: "https://example.com/audio/a1-listening",
      orderIndex: 2,
    },
    {
      courseId: courseRobotics.id,
      title: "LEGO SPIKE Prime Teacher Guide & Lab Manual",
      type: "manual",
      url: "https://example.com/manuals/spike-prime-lab-guide.pdf",
      orderIndex: 1,
    },
    {
      courseId: courseWeb.id,
      title: "Fullstack TypeScript System Architecture Docs",
      type: "file",
      url: "https://example.com/docs/fullstack-architecture.pdf",
      orderIndex: 1,
    },
  ]);
  console.log("✅ Created sample course materials (manuals, textbooks, links, files)");

  // Create Student Course Progress
  await db.insert(studentCourseProgress).values([
    {
      studentId: student1.id,
      courseId: courseEnglish.id,
      currentSession: 8,
      completedSessions: 7,
      status: "in_progress",
      notes: "Alex is showing good grasp of regular verbs. Needs extra practice with past simple.",
    },
    {
      studentId: student2.id,
      courseId: courseEnglish.id,
      currentSession: 24,
      completedSessions: 24,
      status: "completed",
      notes: "Successfully passed the final spoken exam with an A grade.",
    },
    {
      studentId: student3.id,
      courseId: courseRobotics.id,
      currentSession: 1,
      completedSessions: 0,
      status: "not_started",
      notes: "Enrolled for upcoming fall semester.",
    },
    {
      studentId: student4.id,
      courseId: courseRobotics.id,
      currentSession: 5,
      completedSessions: 4,
      status: "on_pause",
      notes: "Paused due to medical leave; will resume next month.",
    },
  ]);
  console.log("✅ Created sample student course progress records");


  console.log("");
  console.log("🎉 Seed completed!");
  console.log("");
  console.log("Login credentials:");
  console.log("  SuperAdmin: admin@brio.md / admin123");
  console.log("  Admin:      admin@vibe.md / admin123");
  console.log("  Teacher:    teacher@vibe.md / teacher123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
