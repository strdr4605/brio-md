/* eslint-disable no-console */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, or, like } from "drizzle-orm";
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
  attendanceRecords,
  learningResources,
  courseLearningResources,
} from "@brio-md/db";

import fs from "fs";
import path from "path";

// Automatically load .env if DATABASE_URL is not set in environment
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

// Helper to format dates YYYY-MM-DD
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Find past session dates in the last 14 days matching scheduled days of the week
function getPastSessionDates(scheduleDays: string[], count = 2): string[] {
  const dayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const targetDays = new Set(scheduleDays.map((d) => dayMap[d.toLowerCase()]));
  const dates: string[] = [];
  const now = new Date();

  for (let i = 1; i <= 14; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    if (targetDays.has(d.getDay())) {
      dates.push(formatDate(d));
      if (dates.length >= count) break;
    }
  }
  return dates.sort();
}

function ensureSamplePdfsExist(): void {
  const targetDir = path.resolve(__dirname, "../../../learn/uploads/resources");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const pdfFiles: Record<string, string> = {
    "lego-spike-prime-manual.pdf": `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 577 >>
stream
BT
/F1 20 Tf
50 740 Td
(LEGO SPIKE Prime - Ghid Didactic & Laborator) Tj
/F1 12 Tf
0 -25 Td
0 -18 Td
(Vibe Academy - Curriculum Robotica si STEM) Tj
0 -18 Td
(Modulul 1: Introducere in Motoare si Senzori Ultrasonici) Tj
0 -18 Td
(1. Notiuni introductive despre unitatea centrala SPIKE Hub.) Tj
0 -18 Td
(2. Conectarea senzorului de distanta la portul B.) Tj
0 -18 Td
(3. Algoritmul de detectare a obstacolelor si oprire automata.) Tj
0 -18 Td
(4. Calibrarea vitezei motoarelor pas-cu-pas.) Tj
0 -18 Td
(Exemplu practic: Programarea deplasarii autonome in linie dreapta.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
939
%%EOF
`,
    "math-logic-worksheet.pdf": `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 516 >>
stream
BT
/F1 20 Tf
50 740 Td
(Fisa de Lucru: Logica si Gandire Computationala) Tj
/F1 12 Tf
0 -25 Td
0 -18 Td
(Vibe Academy - Curs Matematica Aplicata & Logica) Tj
0 -18 Td
(Exercitiul 1: Identificarea tiparelor numerice si algoritmice.) Tj
0 -18 Td
(Exercitiul 2: Teorema lui Pitagora si aplicatii in spatiul 2D.) Tj
0 -18 Td
(Exercitiul 3: Rezolvarea labirintului logic prin backtracking.) Tj
0 -18 Td
(Exercitiul 4: Operatii cu fractii si reprezentari grafice.) Tj
0 -18 Td
(Timp recomandat de lucru: 45 minute.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
878
%%EOF
`,
    "english-grammar-practice.pdf": `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 486 >>
stream
BT
/F1 20 Tf
50 740 Td
(English Grammar in Use - Practical Exercises A1-A2) Tj
/F1 12 Tf
0 -25 Td
0 -18 Td
(Vibe Academy - General English Beginners) Tj
0 -18 Td
(Unit 1: Present Simple vs Present Continuous.) Tj
0 -18 Td
(Unit 2: Regular and Irregular Verbs in Past Simple.) Tj
0 -18 Td
(Unit 3: Asking Questions and Conversational Dialogues.) Tj
0 -18 Td
(Exercise A: Fill in the missing verb forms.) Tj
0 -18 Td
(Exercise B: Match the audio phrases with the correct response.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
848
%%EOF
`,
    "1791363119983-a00650ab-primul-an-de-facultate-este-o-perioada-plina-de-schimba-ri-s-i.pdf": `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 620 >>
stream
BT
/F1 18 Tf
50 740 Td
(Primul an de facultate este o perioada plina de schimbari) Tj
/F1 12 Tf
0 -25 Td
0 -18 Td
(Vibe Academy - English B2 Translation & Reading Comprehension) Tj
0 -20 Td
(Text de tradus in limba engleza:) Tj
0 -18 Td
(Tranzitia de la liceu la viata universitara aduce libertate, dar si responsabilitate.) Tj
0 -18 Td
(Studentii invata sa isi gestioneze timpul si sa colaboreze in echipe diverse.) Tj
0 -25 Td
(Task Instructions:) Tj
0 -18 Td
(1. Translate the paragraph above into academic English.) Tj
0 -18 Td
(2. Identify 3 phrasal verbs related to adapting to new environments.) Tj
0 -18 Td
(3. Expected time: 20 minutes. Do not use automated translation tools.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
982
%%EOF
`,
  };

  for (const [filename, content] of Object.entries(pdfFiles)) {
    const filePath = path.join(targetDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, "utf8");
    }
  }
}

async function seed() {
  console.log("🌱 Seeding rich showcase database for Vibe Academy...");

  // 1. Find or create School (idempotent)
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

  // 2. Permission Definitions (idempotent)
  const permissionsList = [
    {
      key: "super",
      label: "Super Administrator",
      description: "Acces complet la sistem. Poate gestiona școli, utilizatori și permisiuni.",
    },
    {
      key: "admin",
      label: "Admin Școală",
      description: "Gestionează utilizatorii și cursurile din școala sa.",
    },
    {
      key: "manage_billing",
      label: "Gestiune Facturare",
      description: "Permite accesul la facturi, plăți și generarea abonamentelor recurente.",
    },
  ];

  for (const perm of permissionsList) {
    await db.insert(permissionDefinitions).values(perm).onConflictDoNothing();
  }

  // 3. System Users (idempotent)
  const adminHash = await hash("admin123", 12);
  const teacherHash = await hash("teacher123", 12);

  // SuperAdmin
  await db
    .insert(users)
    .values({
      email: "admin@brio.md",
      passwordHash: adminHash,
      name: "Super Admin",
      role: "superadmin",
      permissions: ["super"],
      schoolId: null,
    })
    .onConflictDoNothing();

  // School Admin
  const [schoolAdmin] = await db
    .insert(users)
    .values({
      email: "admin@vibe.md",
      passwordHash: adminHash,
      name: "School Admin",
      role: "admin",
      permissions: ["admin", "manage_billing"],
      schoolId: school.id,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { schoolId: school.id, permissions: ["admin", "manage_billing"] },
    })
    .returning();

  // Teacher
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
      set: { name: "John Teacher", schoolId: school.id },
    })
    .returning();

  console.log("✅ Configured core administrative and teacher accounts");

  // 4. Courses (3 realistic courses: English, Math, Robotics) (idempotent)
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
      [c] = await db.update(courses).set(data).where(eq(courses.id, c.id)).returning();
      console.log("ℹ️ Updated course:", c.name, `(id: ${c.id})`);
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

  const courseMath = await findOrCreateCourse({
    name: "Applied Mathematics & Logic",
    description:
      "Interactive mathematical problem solving, geometry intuition, and computational algorithmic puzzles.",
    level: "intermediate",
    totalSessions: 20,
    sessionDurationMinutes: 90,
    scheduleDays: ["mon", "wed"],
    scheduleTime: "16:00 - 17:30",
    teacherId: teacher.id,
    schoolId: school.id,
    active: true,
  });

  const courseRobotics = await findOrCreateCourse({
    name: "Intermediate Robotics & STEM",
    description:
      "Hands-on robotics course covering LEGO SPIKE Prime, sensor integration, motor controls, and algorithmic navigation.",
    level: "intermediate",
    totalSessions: 16,
    sessionDurationMinutes: 90,
    scheduleDays: ["wed", "fri"],
    scheduleTime: "15:00 - 16:30",
    teacherId: teacher.id,
    schoolId: school.id,
    active: true,
  });

  // Assign courses to teacher
  await db
    .update(users)
    .set({ courseIds: [courseEnglish.id, courseMath.id, courseRobotics.id] })
    .where(eq(users.id, teacher.id));

  // 5. Study Groups (5 active groups across the courses) (idempotent)
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
      [g] = await db.update(groups).set(data).where(eq(groups.id, g.id)).returning();
      console.log("ℹ️ Updated group:", g.name, `(id: ${g.id})`);
    }
    return g;
  }

  const groupEnglishA = await findOrCreateGroup({
    name: "Grupa A - Engleză (Marți/Joi)",
    courseId: courseEnglish.id,
    schoolId: school.id,
    scheduleDays: ["tue", "thu"],
    scheduleTime: "17:30 - 19:00",
    room: "Sala 101 (Etaj 1)",
    teacherId: teacher.id,
    active: true,
  });

  const groupEnglishB = await findOrCreateGroup({
    name: "Grupa B - Engleză (Sâmbătă)",
    courseId: courseEnglish.id,
    schoolId: school.id,
    scheduleDays: ["sat"],
    scheduleTime: "10:00 - 12:00",
    room: "Sala 102 (Etaj 1)",
    teacherId: teacher.id,
    active: true,
  });

  const groupMath1 = await findOrCreateGroup({
    name: "Grupa M1 - Matematică & Logică",
    courseId: courseMath.id,
    schoolId: school.id,
    scheduleDays: ["mon", "wed"],
    scheduleTime: "16:00 - 17:30",
    room: "Sala 201 (Etaj 2)",
    teacherId: teacher.id,
    active: true,
  });

  const groupRobotics1 = await findOrCreateGroup({
    name: "Robotics Cohort 1 - Miercuri/Vineri",
    courseId: courseRobotics.id,
    schoolId: school.id,
    scheduleDays: ["wed", "fri"],
    scheduleTime: "15:00 - 16:30",
    room: "Lab Robotică (Corp B)",
    teacherId: teacher.id,
    active: true,
  });

  const groupRobotics2 = await findOrCreateGroup({
    name: "Robotics Cohort 2 - Sâmbătă",
    courseId: courseRobotics.id,
    schoolId: school.id,
    scheduleDays: ["sat"],
    scheduleTime: "12:30 - 14:30",
    room: "Lab Robotică (Corp B)",
    teacherId: teacher.id,
    active: true,
  });
  console.log("✅ Configured 5 active study groups with schedules and rooms");

  // 6. 15 Realistic Students with Moldovan phone numbers (+373 69...), parent names, and ages (idempotent)
  async function findOrCreateStudent(data: typeof students.$inferInsert) {
    let [s] = await db
      .select()
      .from(students)
      .where(and(eq(students.schoolId, data.schoolId!), eq(students.phone, data.phone!)))
      .limit(1);
    if (!s) {
      [s] = await db.insert(students).values(data).returning();
    } else {
      [s] = await db.update(students).set(data).where(eq(students.id, s.id)).returning();
    }
    return s;
  }

  const rawStudents = [
    {
      name: "Alex Popescu",
      phone: "+37369000001",
      age: 14,
      parentName: "Maria Popescu",
      parentPhone: "+37368000001",
    },
    {
      name: "Elena Ionescu",
      phone: "+37369000002",
      age: 12,
      parentName: "Ion Ionescu",
      parentPhone: "+37368000002",
    },
    {
      name: "Mihai Radu",
      phone: "+37369000003",
      age: 16,
      parentName: "Victor Radu",
      parentPhone: "+37368000003",
    },
    {
      name: "Sofia Ursu",
      phone: "+37369000004",
      age: 11,
      parentName: "Ana Ursu",
      parentPhone: "+37368000004",
    },
    {
      name: "Dumitru Moraru",
      phone: "+37369112233",
      age: 13,
      parentName: "Vasile Moraru",
      parentPhone: "+37368112233",
    },
    {
      name: "Anastasia Cebotari",
      phone: "+37369223344",
      age: 10,
      parentName: "Svetlana Cebotari",
      parentPhone: "+37368223344",
    },
    {
      name: "Maxim Lungu",
      phone: "+37369334455",
      age: 15,
      parentName: "Oleg Lungu",
      parentPhone: "+37368334455",
    },
    {
      name: "Valeria Rusu",
      phone: "+37369445566",
      age: 12,
      parentName: "Elena Rusu",
      parentPhone: "+37368445566",
    },
    {
      name: "Andrei Ceban",
      phone: "+37369556677",
      age: 14,
      parentName: "Igor Ceban",
      parentPhone: "+37368556677",
    },
    {
      name: "Daria Munteanu",
      phone: "+37369667788",
      age: 9,
      parentName: "Natalia Munteanu",
      parentPhone: "+37368667788",
    },
    {
      name: "Victor Sîrbu",
      phone: "+37369778899",
      age: 16,
      parentName: "Dumitru Sîrbu",
      parentPhone: "+37368778899",
    },
    {
      name: "Mihaela Plămădeală",
      phone: "+37369889900",
      age: 11,
      parentName: "Angela Plămădeală",
      parentPhone: "+37368889900",
    },
    {
      name: "Cristian Rotaru",
      phone: "+37369990011",
      age: 13,
      parentName: "Gheorghe Rotaru",
      parentPhone: "+37368990011",
    },
    {
      name: "Gabriela Cojocari",
      phone: "+37369123456",
      age: 8,
      parentName: "Rodica Cojocari",
      parentPhone: "+37368123456",
    },
    {
      name: "Bogdan Ciobanu",
      phone: "+37369234567",
      age: 15,
      parentName: "Sergiu Ciobanu",
      parentPhone: "+37368234567",
    },
  ];

  const seededStudents = [];
  for (const st of rawStudents) {
    const studentRecord = await findOrCreateStudent({
      ...st,
      schoolId: school.id,
      active: true,
    });
    seededStudents.push(studentRecord);
  }
  console.log(`✅ Configured ${seededStudents.length} realistic students with Moldovan contacts`);

  // Link Student User (Alex Popescu)
  await db
    .insert(users)
    .values({
      email: "student@vibe.md",
      passwordHash: teacherHash,
      name: seededStudents[0].name,
      role: "student",
      permissions: [],
      studentId: seededStudents[0].id,
      courseIds: [courseEnglish.id, courseRobotics.id],
      schoolId: school.id,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: seededStudents[0].name,
        studentId: seededStudents[0].id,
        courseIds: [courseEnglish.id, courseRobotics.id],
        schoolId: school.id,
      },
    });

  // 7. Student Group Enrollments (idempotent)
  // Mapping students across groups:
  // English A: students 0, 1, 4, 7
  // English B: students 3, 5, 9, 13
  // Math M1:   students 1, 6, 8, 10, 12
  // Robotics 1: students 0, 2, 4, 11, 14
  // Robotics 2: students 6, 7, 8, 9, 12
  const groupEnrollmentPlan = [
    { group: groupEnglishA, course: courseEnglish, studentIndices: [0, 1, 4, 7], price: 1200 },
    { group: groupEnglishB, course: courseEnglish, studentIndices: [3, 5, 9, 13], price: 1200 },
    { group: groupMath1, course: courseMath, studentIndices: [1, 6, 8, 10, 12], price: 1300 },
    {
      group: groupRobotics1,
      course: courseRobotics,
      studentIndices: [0, 2, 4, 11, 14],
      price: 1400,
    },
    {
      group: groupRobotics2,
      course: courseRobotics,
      studentIndices: [6, 7, 8, 9, 12],
      price: 1400,
    },
  ];

  const studentEnrollmentMap: Record<number, number[]> = {};

  for (const plan of groupEnrollmentPlan) {
    for (const idx of plan.studentIndices) {
      const student = seededStudents[idx];
      let [enr] = await db
        .select()
        .from(studentGroupEnrollments)
        .where(
          and(
            eq(studentGroupEnrollments.studentId, student.id),
            eq(studentGroupEnrollments.groupId, plan.group.id),
          ),
        )
        .limit(1);

      if (!enr) {
        [enr] = await db
          .insert(studentGroupEnrollments)
          .values({
            studentId: student.id,
            groupId: plan.group.id,
            courseId: plan.course.id,
            status: "active",
            billingType: "subscription_monthly",
            customPrice: plan.price,
            joinedAt: new Date(Date.now() - 30 * 86400000),
          })
          .returning();
      }

      if (!studentEnrollmentMap[student.id]) {
        studentEnrollmentMap[student.id] = [];
      }
      studentEnrollmentMap[student.id].push(enr.id);
    }
  }
  console.log("✅ Configured student group enrollments across all 5 groups");

  // 8. Dynamic Past Week Attendance Records (idempotent)
  // Generates green "present" and yellow "late" records for sessions in the past 14 days
  let totalAttendanceCount = 0;
  for (const plan of groupEnrollmentPlan) {
    const pastDates = getPastSessionDates(plan.group.scheduleDays || [], 2);

    for (let dateIdx = 0; dateIdx < pastDates.length; dateIdx++) {
      const sessionDate = pastDates[dateIdx];

      for (let stIdx = 0; stIdx < plan.studentIndices.length; stIdx++) {
        const student = seededStudents[plan.studentIndices[stIdx]];
        // Alternate statuses: ~80% present, ~20% late for realistic UI indicators
        const isLate = (stIdx + dateIdx) % 4 === 3;
        const status = isLate ? "late" : "present";
        const comment = isLate ? "Întârziat 10 min din cauza transportului" : null;

        const [existing] = await db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.groupId, plan.group.id),
              eq(attendanceRecords.studentId, student.id),
              eq(attendanceRecords.date, sessionDate),
            ),
          )
          .limit(1);

        if (!existing) {
          await db.insert(attendanceRecords).values({
            groupId: plan.group.id,
            courseId: plan.course.id,
            studentId: student.id,
            date: sessionDate,
            status,
            comment,
            markedByUserId: teacher.id,
          });
          totalAttendanceCount++;
        }
      }
    }
  }
  console.log(
    `✅ Configured ${totalAttendanceCount} attendance records with present & late indicators`,
  );

  // 9. Invoices across realistic states (6 paid, 2 partially paid, 3 overdue, 2 draft)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const sampleInvoices = [
    // 6 FULLY PAID
    {
      invoiceNumber: "INV-2026-001",
      studentId: seededStudents[0].id,
      groupId: groupEnglishA.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1200,
      paidAmount: 1200,
      dueDate: `${currentMonth}-10`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Abonament lunar engleză achitat integral online.",
      items: [
        { description: "Abonament Engleză Grupa A", quantity: 1, unitPrice: 1200, amount: 1200 },
      ],
      payments: [
        {
          amount: 1200,
          paymentDate: `${currentMonth}-05`,
          method: "card" as const,
          receiptNumber: "RCP-2026-001A",
          notes: "Plată online cu cardul prin portal",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-002",
      studentId: seededStudents[1].id,
      groupId: groupMath1.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1300,
      paidAmount: 1300,
      dueDate: `${currentMonth}-12`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Achitat integral prin transfer bancar MAIB.",
      items: [
        {
          description: "Abonament Matematică & Logică M1",
          quantity: 1,
          unitPrice: 1300,
          amount: 1300,
        },
      ],
      payments: [
        {
          amount: 1300,
          paymentDate: `${currentMonth}-08`,
          method: "bank_transfer" as const,
          receiptNumber: "MAIB-88129",
          notes: "Transfer bancar confirmat",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-003",
      studentId: seededStudents[3].id,
      groupId: groupEnglishB.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1200,
      paidAmount: 1200,
      dueDate: `${currentMonth}-10`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Achitat la terminal POS recepție.",
      items: [
        { description: "Abonament Engleză Grupa B", quantity: 1, unitPrice: 1200, amount: 1200 },
      ],
      payments: [
        {
          amount: 1200,
          paymentDate: `${currentMonth}-09`,
          method: "card" as const,
          receiptNumber: "POS-10492",
          notes: "Plată POS la școală",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-004",
      studentId: seededStudents[4].id,
      groupId: groupRobotics1.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1400,
      paidAmount: 1400,
      dueDate: `${currentMonth}-15`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Abonament Robotică Cohort 1 achitat prin transfer.",
      items: [
        {
          description: "Abonament Robotică SPIKE Prime Cohort 1",
          quantity: 1,
          unitPrice: 1400,
          amount: 1400,
        },
      ],
      payments: [
        {
          amount: 1400,
          paymentDate: `${currentMonth}-11`,
          method: "bank_transfer" as const,
          receiptNumber: "MAIB-90311",
          notes: "Transfer MAIB",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-005",
      studentId: seededStudents[5].id,
      groupId: groupEnglishB.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1200,
      paidAmount: 1200,
      dueDate: `${currentMonth}-10`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Achitat cash la recepție de către părinte.",
      items: [
        { description: "Abonament Engleză Grupa B", quantity: 1, unitPrice: 1200, amount: 1200 },
      ],
      payments: [
        {
          amount: 1200,
          paymentDate: `${currentMonth}-07`,
          method: "cash" as const,
          receiptNumber: "CASH-2026-081",
          notes: "Chitanță numerar recepție",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-006",
      studentId: seededStudents[6].id,
      groupId: groupRobotics2.id,
      type: "subscription" as const,
      status: "paid" as const,
      totalAmount: 1400,
      paidAmount: 1400,
      dueDate: `${currentMonth}-12`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Plată online confirmată.",
      items: [
        { description: "Abonament Robotică Cohort 2", quantity: 1, unitPrice: 1400, amount: 1400 },
      ],
      payments: [
        {
          amount: 1400,
          paymentDate: `${currentMonth}-10`,
          method: "card" as const,
          receiptNumber: "RCP-2026-006A",
          notes: "Plată card online",
        },
      ],
    },

    // 2 PARTIALLY PAID
    {
      invoiceNumber: "INV-2026-007",
      studentId: seededStudents[2].id,
      groupId: groupRobotics1.id,
      type: "subscription" as const,
      status: "partially_paid" as const,
      totalAmount: 1400,
      paidAmount: 700,
      dueDate: `${currentMonth}-28`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Avans 50% achitat la recepție. Tranșa a doua până la finele lunii.",
      items: [
        {
          description: "Abonament Robotică Cohort 1 (Tranșa 1/2)",
          quantity: 1,
          unitPrice: 1400,
          amount: 1400,
        },
      ],
      payments: [
        {
          amount: 700,
          paymentDate: `${currentMonth}-12`,
          method: "cash" as const,
          receiptNumber: "CASH-2026-092",
          notes: "Avans 50% achitat numerar",
        },
      ],
    },
    {
      invoiceNumber: "INV-2026-008",
      studentId: seededStudents[7].id,
      groupId: groupEnglishA.id,
      type: "subscription" as const,
      status: "partially_paid" as const,
      totalAmount: 1200,
      paidAmount: 600,
      dueDate: `${currentMonth}-25`,
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-28`,
      notes: "Plată parțială 50% confirmată online.",
      items: [
        {
          description: "Abonament Engleză Grupa A (Tranșa 1/2)",
          quantity: 1,
          unitPrice: 1200,
          amount: 1200,
        },
      ],
      payments: [
        {
          amount: 600,
          paymentDate: `${currentMonth}-14`,
          method: "card" as const,
          receiptNumber: "RCP-2026-008B",
          notes: "Plată POS 50%",
        },
      ],
    },

    // 3 OVERDUE DEBTS
    {
      invoiceNumber: "INV-2026-009",
      studentId: seededStudents[8].id,
      groupId: groupMath1.id,
      type: "subscription" as const,
      status: "overdue" as const,
      totalAmount: 1300,
      paidAmount: 0,
      dueDate: `${prevMonth}-10`,
      periodStart: `${prevMonth}-01`,
      periodEnd: `${prevMonth}-28`,
      notes: "Scadență depășită cu peste 30 de zile. Notificare trimisă părintelui pe WhatsApp.",
      items: [
        {
          description: "Restanță Abonament Matematică & Logică",
          quantity: 1,
          unitPrice: 1300,
          amount: 1300,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-010",
      studentId: seededStudents[10].id,
      groupId: groupMath1.id,
      type: "subscription" as const,
      status: "overdue" as const,
      totalAmount: 1300,
      paidAmount: 0,
      dueDate: `${prevMonth}-15`,
      periodStart: `${prevMonth}-01`,
      periodEnd: `${prevMonth}-28`,
      notes: "Scadență depășită. Părintele a solicitat amânare până la salariu.",
      items: [
        {
          description: "Restanță Abonament Matematică",
          quantity: 1,
          unitPrice: 1300,
          amount: 1300,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-011",
      studentId: seededStudents[11].id,
      groupId: groupRobotics1.id,
      type: "subscription" as const,
      status: "overdue" as const,
      totalAmount: 1400,
      paidAmount: 0,
      dueDate: `${prevMonth}-12`,
      periodStart: `${prevMonth}-01`,
      periodEnd: `${prevMonth}-28`,
      notes: "Scadență depășită cu 20 de zile. Notificare expediată prin SMS.",
      items: [
        {
          description: "Restanță Abonament Robotică SPIKE Prime",
          quantity: 1,
          unitPrice: 1400,
          amount: 1400,
        },
      ],
      payments: [],
    },

    // 2 DRAFTS
    {
      invoiceNumber: "INV-2026-012",
      studentId: seededStudents[12].id,
      groupId: groupRobotics2.id,
      type: "situational" as const,
      status: "draft" as const,
      totalAmount: 450,
      paidAmount: 0,
      dueDate: `${currentMonth}-28`,
      periodStart: null,
      periodEnd: null,
      notes: "Ciornă: Kit componente & senzori ultrasonici adiționali.",
      items: [
        {
          description: "Kit componente & senzori ultrasonici SPIKE",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ],
      payments: [],
    },
    {
      invoiceNumber: "INV-2026-013",
      studentId: seededStudents[13].id,
      groupId: groupEnglishB.id,
      type: "situational" as const,
      status: "draft" as const,
      totalAmount: 350,
      paidAmount: 0,
      dueDate: `${currentMonth}-30`,
      periodStart: null,
      periodEnd: null,
      notes: "Ciornă: Manual suplimentar Cambridge English Prepare! Level 2.",
      items: [
        {
          description: "Manual Cambridge English Prepare! Level 2",
          quantity: 1,
          unitPrice: 350,
          amount: 350,
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
      [inv] = await db
        .insert(invoices)
        .values({ ...invFields, schoolId: school.id })
        .returning();
      console.log(`✅ Created Invoice: ${inv.invoiceNumber} (${inv.status})`);
    } else {
      [inv] = await db
        .update(invoices)
        .set({ ...invFields, schoolId: school.id })
        .where(eq(invoices.id, inv.id))
        .returning();
    }

    // Line items
    for (const item of items) {
      const [existingItem] = await db
        .select()
        .from(invoiceItems)
        .where(
          and(eq(invoiceItems.invoiceId, inv.id), eq(invoiceItems.description, item.description)),
        )
        .limit(1);

      if (!existingItem) {
        await db.insert(invoiceItems).values({
          invoiceId: inv.id,
          ...item,
        });
      }
    }

    // Payments
    for (const p of payList) {
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.invoiceId, inv.id), eq(payments.receiptNumber, p.receiptNumber)))
        .limit(1);

      if (!existingPayment) {
        await db.insert(payments).values({
          invoiceId: inv.id,
          studentId: inv.studentId,
          schoolId: school.id,
          recordedByUserId: schoolAdmin?.id ?? teacher.id,
          ...p,
        });
      }
    }
  }
  console.log(
    "✅ Configured 13 invoices (6 paid, 2 partial, 3 overdue, 2 draft) with payments and line items",
  );

  // 10. Learning Resources & Course Curriculum Links (idempotent)
  // Ensure sample static PDF documents exist in apps/learn/uploads/resources/
  ensureSamplePdfsExist();

  // Clean up legacy broken/placeholder resources
  await db
    .delete(learningResources)
    .where(
      or(
        like(learningResources.url, "%example.com%"),
        like(learningResources.url, "%28848418%"),
        like(learningResources.title, "%Abstract_template%"),
      ),
    );
  await db
    .delete(courseMaterials)
    .where(
      or(
        like(courseMaterials.url, "%example.com%"),
        like(courseMaterials.url, "%28848418%"),
        like(courseMaterials.title, "%Abstract_template%"),
      ),
    );

  // Purge any orphan local file records whose file is missing from disk
  const existingLocalResources = await db
    .select()
    .from(learningResources)
    .where(like(learningResources.url, "/api/files/%"));

  for (const r of existingLocalResources) {
    const relPath = r.url.replace(/^\/api\/files\//, "");
    const fullPath = path.resolve(__dirname, "../../../learn/uploads", relPath);
    if (!fs.existsSync(fullPath)) {
      await db.delete(learningResources).where(eq(learningResources.id, r.id));
      await db.delete(courseMaterials).where(eq(courseMaterials.url, r.url));
      console.log(`🗑️ Removed broken local resource with missing file: ${r.title} (${r.url})`);
    }
  }

  const sampleResources = [
    {
      title: "Scratch: Simulator Robot & Algoritmi",
      description:
        "Simulare algoritmică în Scratch pentru navigarea autonomă a robotului cu senzori ultrasonici.",
      type: "minigame" as const,
      url: "https://scratch.mit.edu/projects/271009701/",
      metadata: {
        maxScore: 100,
        instructions: "Ghidează robotul prin labirint evitând coliziunea cu obstacolele.",
        level: "intermediate",
      },
      courseId: courseRobotics.id,
      sessionNumber: 2,
      orderIndex: 1,
    },
    {
      title: "PhET: Laborator Interactiv de Circuite DC & Senzori",
      description: "Construcție virtuală de circuite electronice cu rezistori, senzori și motoare.",
      type: "minigame" as const,
      url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html",
      metadata: {
        maxScore: 100,
        instructions: "Construiește un circuit în buclă închisă pentru alimentarea robotului.",
        level: "intermediate",
      },
      courseId: courseRobotics.id,
      sessionNumber: 3,
      orderIndex: 1,
    },
    {
      title: "LEGO SPIKE Prime Ghid Didactic & Manual de Laborator",
      description: "Ghid complet pentru construcția și programarea modelelor robotice SPIKE Prime.",
      type: "pdf" as const,
      url: "/api/files/resources/lego-spike-prime-manual.pdf",
      metadata: {
        level: "intermediate",
        guidelines: "De studiat înainte de sesiunea practică de asamblare.",
      },
      courseId: courseRobotics.id,
      sessionNumber: 1,
      orderIndex: 1,
    },
    {
      title: "Video Tutorial: Calibrarea Senzorilor Ultrasonici",
      description: "Demonstrație video pas-cu-pas a calibraților pentru detectarea distanței.",
      type: "video" as const,
      url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      metadata: {
        level: "intermediate",
      },
      courseId: courseRobotics.id,
      sessionNumber: 2,
      orderIndex: 2,
    },
    {
      title: "PhET: Fraction Matcher - Logică Fracții",
      description:
        "Joc interactiv de potrivire a reprezentărilor vizuale ale fracțiilor cu numerele raționale.",
      type: "minigame" as const,
      url: "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_all.html",
      metadata: {
        maxScore: 100,
        instructions: "Potrivește formele fracționare cu valorile lor numerice.",
        level: "intermediate",
      },
      courseId: courseMath.id,
      sessionNumber: 1,
      orderIndex: 1,
    },
    {
      title: "Fișă de Lucru: Probleme de Logică și Algoritmi",
      description: "Exerciții aplicative de gândire computațională și deducție logică.",
      type: "worksheet" as const,
      url: "/api/files/resources/math-logic-worksheet.pdf",
      metadata: {
        maxScore: 50,
        instructions: "Rezolvați exercițiile 1-4 din secțiunea de logică computațională.",
        level: "intermediate",
      },
      courseId: courseMath.id,
      sessionNumber: 2,
      orderIndex: 1,
    },
    {
      title: "English Grammar in Use - Fișă de Exerciții A1-A2",
      description: "Manual de referință și exerciții practice pentru nivelul A1-A2.",
      type: "textbook" as const,
      url: "/api/files/resources/english-grammar-practice.pdf",
      metadata: {
        level: "beginner",
      },
      courseId: courseEnglish.id,
      sessionNumber: 1,
      orderIndex: 1,
    },
    {
      title: "Video Listening: Daily English Conversation A1",
      description: "Dialoguri și exerciții audio-video de înțelegere orală și conversație.",
      type: "video" as const,
      url: "https://www.youtube.com/watch?v=jW0_t2K0qYQ",
      metadata: {
        level: "beginner",
      },
      courseId: courseEnglish.id,
      sessionNumber: 2,
      orderIndex: 1,
    },
  ];

  for (const resItem of sampleResources) {
    const { courseId, sessionNumber, orderIndex, ...resData } = resItem;

    let [res] = await db
      .select()
      .from(learningResources)
      .where(
        and(eq(learningResources.schoolId, school.id), eq(learningResources.title, resData.title)),
      )
      .limit(1);

    if (!res) {
      [res] = await db
        .insert(learningResources)
        .values({
          ...resData,
          schoolId: school.id,
        })
        .returning();
      console.log(`✅ Created Learning Resource: ${res.title} (${res.type})`);
    } else {
      [res] = await db
        .update(learningResources)
        .set({
          url: resData.url,
          type: resData.type,
          description: resData.description,
          metadata: resData.metadata,
        })
        .where(eq(learningResources.id, res.id))
        .returning();
      console.log(`🔄 Updated Learning Resource: ${res.title} (${res.type})`);
    }

    // Link to Course Learning Resources junction table
    const [junction] = await db
      .select()
      .from(courseLearningResources)
      .where(
        and(
          eq(courseLearningResources.courseId, courseId),
          eq(courseLearningResources.resourceId, res.id),
        ),
      )
      .limit(1);

    if (!junction) {
      await db.insert(courseLearningResources).values({
        courseId,
        resourceId: res.id,
        sessionNumber,
        orderIndex,
        settings: {
          maxScore: resData.metadata?.maxScore,
          instructions: resData.metadata?.instructions,
        },
      });
    }

    // Also populate legacy courseMaterials table for backwards compatibility
    const [legacyMat] = await db
      .select()
      .from(courseMaterials)
      .where(and(eq(courseMaterials.courseId, courseId), eq(courseMaterials.title, res.title)))
      .limit(1);

    const legacyType =
      res.type === "textbook"
        ? "textbook"
        : res.type === "pdf" || res.type === "worksheet"
          ? "manual"
          : res.type === "link"
            ? "link"
            : "file";

    if (!legacyMat) {
      await db.insert(courseMaterials).values({
        courseId,
        title: res.title,
        type: legacyType,
        url: res.url,
        orderIndex,
      });
    } else {
      await db
        .update(courseMaterials)
        .set({
          type: legacyType,
          url: res.url,
          orderIndex,
        })
        .where(eq(courseMaterials.id, legacyMat.id));
    }
  }
  console.log("✅ Configured learning resources, curriculum syllabus, and minigames");

  // 11. Student Course Progress (idempotent)
  const sampleProgress = [
    {
      studentId: seededStudents[0].id,
      courseId: courseEnglish.id,
      currentSession: 8,
      completedSessions: 7,
      status: "in_progress" as const,
      notes: "Alex are un progres foarte bun la conversație și gramatică.",
    },
    {
      studentId: seededStudents[1].id,
      courseId: courseMath.id,
      currentSession: 12,
      completedSessions: 11,
      status: "in_progress" as const,
      notes: "Elena rezolvă cu succes problemele de deducție logică.",
    },
    {
      studentId: seededStudents[2].id,
      courseId: courseRobotics.id,
      currentSession: 6,
      completedSessions: 5,
      status: "in_progress" as const,
      notes: "Mihai a asamblat cu succes modulul de senzori ultrasonici.",
    },
    {
      studentId: seededStudents[3].id,
      courseId: courseEnglish.id,
      currentSession: 24,
      completedSessions: 24,
      status: "completed" as const,
      notes: "A promovat examenul final cu nota maximă.",
    },
    {
      studentId: seededStudents[4].id,
      courseId: courseRobotics.id,
      currentSession: 4,
      completedSessions: 3,
      status: "in_progress" as const,
      notes: "Dumitru participă activ la programarea motoarelor pas-cu-pas.",
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
    } else {
      await db
        .update(studentCourseProgress)
        .set(prog)
        .where(eq(studentCourseProgress.id, existing.id));
    }
  }
  console.log("✅ Configured student progress tracking entries");

  console.log("");
  console.log("🎉 Showcase Seed completed successfully!");
  console.log("=================================================");
  console.log("Vibe Academy Showcase Summary:");
  console.log(` • School:      ${school.name}`);
  console.log(` • Courses:     3 (English, Math & Logic, Robotics & STEM)`);
  console.log(` • Groups:      5 active study groups with schedules`);
  console.log(` • Students:    15 students enrolled with Moldovan contacts`);
  console.log(` • Attendance:  Recent sessions marked (present & late)`);
  console.log(` • Invoices:    13 total (6 paid, 2 partial, 3 overdue, 2 draft)`);
  console.log(` • Resources:   Minigames (Scratch & PhET), PDFs, Worksheets`);
  console.log("=================================================");
  console.log("Staff Login Credentials:");
  console.log("  SuperAdmin: admin@brio.md / admin123");
  console.log("  Admin:      admin@vibe.md / admin123");
  console.log("  Teacher:    teacher@vibe.md / teacher123");
  console.log("  Student:    student@vibe.md / teacher123");
  console.log("=================================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
