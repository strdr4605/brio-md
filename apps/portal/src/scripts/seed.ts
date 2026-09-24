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
  invoices,
  invoiceItems,
  payments,
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
      .where(and(eq(groups.schoolId, data.schoolId), eq(groups.name, data.name)))
      .limit(1);
    if (!g) {
      [g] = await db.insert(groups).values(data).returning();
      console.log("✅ Created group:", g.name);
    } else {
      [g] = await db
        .update(groups)
        .set(data)
        .where(eq(groups.id, g.id))
        .returning();
      console.log("ℹ️ Updated existing group:", g.name, `(id: ${g.id})`);
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

  // ----------------------------------------------------
  // Seed Invoices, Line Items, and Payments (idempotent)
  // ----------------------------------------------------
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@vibe.md"))
    .limit(1);

  const sampleInvoices = [
    {
      invoiceNumber: "INV-2026-001",
      schoolId: school.id,
      studentId: student1.id,
      groupId: groupEnglishA.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1200,
      paidAmount: 1200,
      dueDate: "2026-09-10",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Abonament lunar septembrie achitat integral online.",
      items: [
        {
          description: "Abonament Septembrie 2026 - Grupa A (Engleză)",
          quantity: 1,
          unitPrice: 1200,
          amount: 1200,
        },
      ],
      payments: [
        {
          amount: 1200,
          paymentDate: "2026-09-08",
          method: "card" as const,
          receiptNumber: "RCP-2026-001A",
          notes: "Plată online cu cardul prin portal",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-002",
      schoolId: school.id,
      studentId: student2.id,
      groupId: groupRobotics1.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1400,
      paidAmount: 1400,
      dueDate: "2026-09-12",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Achitat prin transfer bancar.",
      items: [
        {
          description: "Abonament Lunar Robotică & STEM - Septembrie",
          quantity: 1,
          unitPrice: 1400,
          amount: 1400,
        },
      ],
      payments: [
        {
          amount: 1400,
          paymentDate: "2026-09-11",
          method: "bank_transfer" as const,
          receiptNumber: "BT-98213",
          notes: "Transfer MAIB",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-003",
      schoolId: school.id,
      studentId: student3.id,
      groupId: groupEnglishA.id,
      type: "subscription" as const,
      status: "partially_paid" as const,
      totalAmount: 1200,
      paidAmount: 600,
      dueDate: "2026-09-30",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Prima tranșă achitată cash la recepție. A doua tranșă până la sfârșitul lunii.",
      items: [
        {
          description: "Abonament Septembrie 2026 (Plată în 2 tranșe)",
          quantity: 1,
          unitPrice: 1200,
          amount: 1200,
        },
      ],
      payments: [
        {
          amount: 600,
          paymentDate: "2026-09-15",
          method: "cash" as const,
          receiptNumber: "CASH-2026-044",
          notes: "Avans 50% achitat la recepție",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-004",
      schoolId: school.id,
      studentId: student4.id,
      groupId: groupEnglishB.id,
      type: "per_lesson" as const,
      status: "partially_paid" as const,
      totalAmount: 800,
      paidAmount: 400,
      dueDate: "2026-09-28",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Pachet 4 lecții individuale (achitat 2 lecții)",
      items: [
        {
          description: "Pachet lecții individuale Engleză B",
          quantity: 4,
          unitPrice: 200,
          amount: 800,
        },
      ],
      payments: [
        {
          amount: 400,
          paymentDate: "2026-09-18",
          method: "card" as const,
          receiptNumber: "RCP-2026-009B",
          notes: "Plată POS la școală",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-005",
      schoolId: school.id,
      studentId: student1.id,
      groupId: groupRobotics1.id,
      type: "subscription" as const,
      status: "overdue" as const,
      totalAmount: 1400,
      paidAmount: 0,
      dueDate: "2026-09-10",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Scadență depășită cu 14 zile. Notificare trimisă părintelui pe WhatsApp.",
      items: [
        {
          description: "Abonament Robotică Cohort 1 - Restanță Septembrie",
          quantity: 1,
          unitPrice: 1400,
          amount: 1400,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-006",
      schoolId: school.id,
      studentId: student2.id,
      groupId: null,
      type: "situational" as const,
      status: "overdue" as const,
      totalAmount: 450,
      paidAmount: 0,
      dueDate: "2026-09-05",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      notes: "Kit componente electronice & senzori Arduino. Termen limită depășit.",
      items: [
        {
          description: "Kit componente electronice & senzori Arduino",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-007",
      schoolId: school.id,
      studentId: student3.id,
      groupId: groupEnglishA.id,
      type: "subscription" as const,
      status: "issued" as const,
      totalAmount: 1200,
      paidAmount: 0,
      dueDate: "2026-10-05",
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      notes: "Factură emisă în avans pentru luna Octombrie 2026.",
      items: [
        {
          description: "Abonament Octombrie 2026 - Grupa A (Engleză)",
          quantity: 1,
          unitPrice: 1200,
          amount: 1200,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-008",
      schoolId: school.id,
      studentId: student4.id,
      groupId: groupEnglishB.id,
      type: "situational" as const,
      status: "draft" as const,
      totalAmount: 300,
      paidAmount: 0,
      dueDate: "2026-10-01",
      periodStart: null,
      periodEnd: null,
      notes: "Ciornă - de verificat sosirea manualelor Cambridge înainte de emitere.",
      items: [
        {
          description: "Manual Cambridge English Prepare! Level 2",
          quantity: 1,
          unitPrice: 300,
          amount: 300,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-009",
      schoolId: school.id,
      studentId: student1.id,
      groupId: groupEnglishA.id,
      type: "situational" as const,
      status: "cancelled" as const,
      totalAmount: 500,
      paidAmount: 0,
      dueDate: "2026-09-15",
      periodStart: null,
      periodEnd: null,
      notes: "Factură emisă eronat (dublură), anulată de administrator conform cererii părintelui.",
      items: [
        {
          description: "Taxă înscriere concurs (emisă eronat)",
          quantity: 1,
          unitPrice: 500,
          amount: 500,
        },
      ],
      payments: [],
    },
  ];

  for (const invData of sampleInvoices) {
    const { items, payments: payList, ...invFields } = invData;
    let [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invFields.invoiceNumber))
      .limit(1);

    if (!inv) {
      [inv] = await db.insert(invoices).values(invFields).returning();
      console.log(`✅ Created Invoice: ${inv.invoiceNumber} (${inv.status})`);
    } else {
      console.log(`ℹ️ Using existing Invoice: ${inv.invoiceNumber}`);
    }

    // Insert line items idempotently
    for (const item of items) {
      const [existingItem] = await db
        .select()
        .from(invoiceItems)
        .where(
          and(
            eq(invoiceItems.invoiceId, inv.id),
            eq(invoiceItems.description, item.description),
          ),
        )
        .limit(1);
      if (!existingItem) {
        await db.insert(invoiceItems).values({
          invoiceId: inv.id,
          ...item,
        });
      }
    }

    // Insert payments idempotently
    for (const p of payList) {
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, inv.id),
            eq(payments.receiptNumber, p.receiptNumber!),
          ),
        )
        .limit(1);
      if (!existingPayment) {
        await db.insert(payments).values({
          invoiceId: inv.id,
          studentId: inv.studentId,
          schoolId: inv.schoolId,
          recordedByUserId: adminUser?.id ?? null,
          ...p,
        });
      }
    }
  }
  console.log("✅ Configured sample billing invoices, line items, and payment receipts");

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
