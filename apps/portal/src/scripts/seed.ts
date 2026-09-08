import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hash } from "bcryptjs";
import { schools, users, courses, permissionDefinitions, students } from "@brio-md/db";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create school
  const [school] = await db
    .insert(schools)
    .values({
      name: "Vibe Academy",
    })
    .returning();
  console.log("✅ Created school:", school.name);

  // Create course
  const [course] = await db
    .insert(courses)
    .values({
      name: "English",
      schoolId: school.id,
    })
    .returning();
  console.log("✅ Created course:", course.name);

  // Create sample students
  const [student1] = await db
    .insert(students)
    .values({
      name: "Alex Popescu",
      schoolId: school.id,
      parentName: "Maria Popescu",
      parentPhone: "+37360000000",
    })
    .returning();
  console.log("✅ Created Student:", student1.name);

  const [student2] = await db
    .insert(students)
    .values({
      name: "Elena Ionescu",
      schoolId: school.id,
      parentName: "Ion Ionescu",
      parentPhone: "+37361111111",
    })
    .returning();
  console.log("✅ Created Student:", student2.name);

  const [student3] = await db
    .insert(students)
    .values({
      name: "Mihai Radu",
      schoolId: school.id,
      parentName: "Victor Radu",
      parentPhone: "+37362222222",
    })
    .returning();
  console.log("✅ Created Student:", student3.name);

  const [student4] = await db
    .insert(students)
    .values({
      name: "Sofia Ursu",
      schoolId: school.id,
      parentName: "Ana Ursu",
      parentPhone: "+37363333333",
    })
    .returning();
  console.log("✅ Created Student:", student4.name);

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
  await db
    .insert(users)
    .values({
      email: "teacher@vibe.md",
      passwordHash: teacherHash,
      name: "John Teacher",
      role: "teacher",
      permissions: ["teach"],
      courseIds: [course.id],
      schoolId: school.id,
    })
    .onConflictDoNothing();

  // Create sample students with phone
  const sampleStudents = [
    {
      name: "Alex Popescu",
      schoolId: school.id,
      phone: "+37369000001",
      parentName: "Maria Popescu",
      parentPhone: "+37360000000",
    },
    {
      name: "Elena Ionescu",
      schoolId: school.id,
      phone: "+37369000002",
      parentName: "Ion Ionescu",
      parentPhone: "+37361111111",
    },
  ];

  await db.insert(students).values(sampleStudents);
  console.log(`✅ Created ${sampleStudents.length} sample students with phone numbers`);

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

