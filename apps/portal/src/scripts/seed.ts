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
  groups,
  studentGroupEnrollments,
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
    } else {
      console.log("ℹ️ Using existing student:", s.name, `(id: ${s.id})`);
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

  // Create Courses with full schedule and level information (idempotent)
  async function findOrCreateCourse(data: {
    name: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    totalSessions: number;
    sessionDurationMinutes: number;
    scheduleDays: string[];
    scheduleTime: string;
    teacherId: number;
    schoolId: number;
    active: boolean;
  }) {
    let [c] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.schoolId, data.schoolId), eq(courses.name, data.name)))
      .limit(1);
    if (!c) {
      [c] = await db.insert(courses).values(data).returning();
      console.log("✅ Created course:", c.name);
    } else {
      console.log("ℹ️ Using existing course:", c.name, `(id: ${c.id})`);
    }
    return c;
  }

  const courseEnglish = await findOrCreateCourse({
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
  });

  const courseRobotics = await findOrCreateCourse({
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
  });

  const courseWeb = await findOrCreateCourse({
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
  });
  console.log("✅ Configured 3 sample courses with schedules and levels");

  // Assign courses to teacher
  await db
    .update(users)
    .set({ courseIds: [courseEnglish.id, courseRobotics.id, courseWeb.id] })
    .where(eq(users.id, teacher.id));

  // Create Course Materials (idempotent)
  const sampleMaterials = [
    {
      courseId: courseEnglish.id,
      title: "English Grammar in Use (5th Edition)",
      type: "textbook" as const,
      url: "https://example.com/materials/english-grammar-in-use.pdf",
      orderIndex: 1,
    },
    {
      courseId: courseEnglish.id,
      title: "Beginner Audio Listening Exercises",
      type: "link" as const,
      url: "https://example.com/audio/a1-listening",
      orderIndex: 2,
    },
    {
      courseId: courseRobotics.id,
      title: "LEGO SPIKE Prime Teacher Guide & Lab Manual",
      type: "manual" as const,
      url: "https://example.com/manuals/spike-prime-lab-guide.pdf",
      orderIndex: 1,
    },
    {
      courseId: courseWeb.id,
      title: "Fullstack TypeScript System Architecture Docs",
      type: "file" as const,
      url: "https://example.com/docs/fullstack-architecture.pdf",
      orderIndex: 1,
    },
  ];

  for (const mat of sampleMaterials) {
    const [existing] = await db
      .select()
      .from(courseMaterials)
      .where(
        and(
          eq(courseMaterials.courseId, mat.courseId),
          eq(courseMaterials.title, mat.title),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(courseMaterials).values(mat);
    }
  }
  console.log("✅ Configured sample course materials (manuals, textbooks, links, files)");

  // Create Student Course Progress (idempotent)
  const sampleProgress = [
    {
      studentId: student1.id,
      courseId: courseEnglish.id,
      currentSession: 8,
      completedSessions: 7,
      status: "in_progress" as const,
      notes: "Alex is showing good grasp of regular verbs. Needs extra practice with past simple.",
    },
    {
      studentId: student2.id,
      courseId: courseEnglish.id,
      currentSession: 24,
      completedSessions: 24,
      status: "completed" as const,
      notes: "Successfully passed the final spoken exam with an A grade.",
    },
    {
      studentId: student3.id,
      courseId: courseRobotics.id,
      currentSession: 1,
      completedSessions: 0,
      status: "not_started" as const,
      notes: "Enrolled for upcoming fall semester.",
    },
    {
      studentId: student4.id,
      courseId: courseRobotics.id,
      currentSession: 5,
      completedSessions: 4,
      status: "on_pause" as const,
      notes: "Paused due to medical leave; will resume next month.",
    },
  ];

  for (const prog of sampleProgress) {
    const [existing] = await db
      .select()
      .from(studentCourseProgress)
      .where(
        and(
          eq(studentCourseProgress.studentId, prog.studentId),
          eq(studentCourseProgress.courseId, prog.courseId),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(studentCourseProgress).values(prog);
    }
  }
  console.log("✅ Configured sample student course progress records");

  // Create Groups for Courses (idempotent)
  async function findOrCreateGroup(data: {
    name: string;
    courseId: number;
    schoolId: number;
    scheduleDays: string[];
    scheduleTime: string;
    room: string;
    teacherId: number;
    active: boolean;
  }) {
    let [g] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.courseId, data.courseId), eq(groups.name, data.name)))
      .limit(1);
    if (!g) {
      [g] = await db.insert(groups).values(data).returning();
      console.log("✅ Created group:", g.name);
    } else {
      console.log("ℹ️ Using existing group:", g.name, `(id: ${g.id})`);
    }
    return g;
  }

  const groupEnglishA = await findOrCreateGroup({
    name: "Grupa A - Marți 17:30",
    courseId: courseEnglish.id,
    schoolId: school.id,
    scheduleDays: ["tue", "thu"],
    scheduleTime: "17:30 - 19:00",
    room: "Sala 101 (Etaj 1)",
    teacherId: teacher.id,
    active: true,
  });

  const groupEnglishB = await findOrCreateGroup({
    name: "Grupa B - Sâmbătă 10:00",
    courseId: courseEnglish.id,
    schoolId: school.id,
    scheduleDays: ["sat"],
    scheduleTime: "10:00 - 12:00",
    room: "Sala 102 (Etaj 1)",
    teacherId: teacher.id,
    active: true,
  });

  const groupRobotics1 = await findOrCreateGroup({
    name: "Robotics Cohort 1 - Miercuri 15:00",
    courseId: courseRobotics.id,
    schoolId: school.id,
    scheduleDays: ["wed", "fri"],
    scheduleTime: "15:00 - 16:30",
    room: "Lab Robotică (Corp B)",
    teacherId: teacher.id,
    active: true,
  });
  console.log("✅ Configured sample groups with schedules, rooms, and teachers");

  // Create Student Group Enrollments (idempotent)
  const sampleEnrollments = [
    {
      studentId: student1.id,
      groupId: groupEnglishA.id,
      courseId: courseEnglish.id,
      status: "active" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1400,
      joinedAt: new Date(Date.now() - 14 * 86400000),
    },
    {
      studentId: student1.id,
      groupId: groupRobotics1.id,
      courseId: courseRobotics.id,
      status: "active" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1400,
      joinedAt: new Date(Date.now() - 7 * 86400000),
    },
    {
      studentId: student2.id,
      groupId: groupEnglishA.id,
      courseId: courseEnglish.id,
      status: "inactive" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1200,
      joinedAt: new Date(Date.now() - 30 * 86400000),
      leftAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      studentId: student2.id,
      groupId: groupRobotics1.id,
      courseId: courseRobotics.id,
      status: "active" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1200,
      joinedAt: new Date(Date.now() - 10 * 86400000),
    },
    {
      studentId: student3.id,
      groupId: groupEnglishA.id,
      courseId: courseEnglish.id,
      status: "archived" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1000,
      joinedAt: new Date(Date.now() - 60 * 86400000),
      leftAt: new Date(Date.now() - 15 * 86400000),
    },
    {
      studentId: student4.id,
      groupId: groupEnglishB.id,
      courseId: courseEnglish.id,
      status: "active" as const,
      billingType: "subscription_monthly" as const,
      customPrice: 1400,
      joinedAt: new Date(Date.now() - 5 * 86400000),
    },
  ];

  for (const enr of sampleEnrollments) {
    const [existing] = await db
      .select()
      .from(studentGroupEnrollments)
      .where(
        and(
          eq(studentGroupEnrollments.studentId, enr.studentId),
          eq(studentGroupEnrollments.groupId, enr.groupId),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(studentGroupEnrollments).values(enr);
    } else if (existing.customPrice === null && enr.customPrice) {
      await db
        .update(studentGroupEnrollments)
        .set({ customPrice: enr.customPrice, billingType: enr.billingType })
        .where(eq(studentGroupEnrollments.id, existing.id));
    }
  }
  console.log("✅ Configured sample student group enrollments (active, inactive, archived)");

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
