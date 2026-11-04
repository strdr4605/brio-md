/**
 * Utility and DDL generator for Schema-per-Tenant isolation.
 * Every school or tutor account operates on its own dedicated PostgreSQL schema.
 */

export function sanitizeTenantSchemaName(raw: string | number): string {
  if (typeof raw === "number") {
    return `tenant_${raw}`;
  }
  const clean = raw
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);

  return clean.startsWith("tenant_") ? clean : `tenant_${clean || "default"}`;
}

export function getTenantSchemaDDL(schemaName: string): string[] {
  // Safe identifier quoting
  const schema = schemaName.replace(/"/g, '""');

  return [
    `CREATE SCHEMA IF NOT EXISTS "${schema}";`,

    // 1. Students in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."students" (
      "id" serial PRIMARY KEY,
      "name" varchar(255) NOT NULL,
      "phone" varchar(50) NOT NULL,
      "email" varchar(255),
      "parent_name" varchar(255),
      "parent_phone" varchar(50),
      "birth_date" date,
      "age" integer,
      "status" varchar(50) DEFAULT 'active',
      "created_at" timestamp DEFAULT now()
    );`,

    // 2. Courses in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."courses" (
      "id" serial PRIMARY KEY,
      "name" varchar(255) NOT NULL,
      "description" text,
      "monthly_fee" numeric(10, 2) DEFAULT 0,
      "created_at" timestamp DEFAULT now()
    );`,

    // 3. Groups in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."groups" (
      "id" serial PRIMARY KEY,
      "course_id" integer REFERENCES "${schema}"."courses"("id") ON DELETE CASCADE,
      "name" varchar(255) NOT NULL,
      "day_of_week" integer,
      "start_time" varchar(10),
      "end_time" varchar(10),
      "cabinet" varchar(50),
      "monthly_fee" numeric(10, 2) DEFAULT 0,
      "status" varchar(50) DEFAULT 'active',
      "created_at" timestamp DEFAULT now()
    );`,

    // 4. Enrollments in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."student_group_enrollments" (
      "id" serial PRIMARY KEY,
      "student_id" integer REFERENCES "${schema}"."students"("id") ON DELETE CASCADE,
      "group_id" integer REFERENCES "${schema}"."groups"("id") ON DELETE CASCADE,
      "enrollment_date" timestamp DEFAULT now(),
      "status" varchar(50) DEFAULT 'active'
    );`,

    // 5. Invoices & Payments in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."invoices" (
      "id" serial PRIMARY KEY,
      "student_id" integer REFERENCES "${schema}"."students"("id") ON DELETE CASCADE,
      "group_id" integer REFERENCES "${schema}"."groups"("id") ON DELETE SET NULL,
      "amount" numeric(10, 2) NOT NULL,
      "status" varchar(50) DEFAULT 'unpaid',
      "period" varchar(20),
      "due_date" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "${schema}"."payments" (
      "id" serial PRIMARY KEY,
      "invoice_id" integer REFERENCES "${schema}"."invoices"("id") ON DELETE CASCADE,
      "amount" numeric(10, 2) NOT NULL,
      "payment_date" timestamp DEFAULT now(),
      "payment_method" varchar(50) DEFAULT 'cash',
      "created_at" timestamp DEFAULT now()
    );`,

    // 6. Stored files in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."stored_files" (
      "id" serial PRIMARY KEY,
      "filename" varchar(255) NOT NULL,
      "mime_type" varchar(100) NOT NULL,
      "size_bytes" integer NOT NULL,
      "data_base64" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,

    // 7. Attendance in this tenant
    `CREATE TABLE IF NOT EXISTS "${schema}"."attendance_sessions" (
      "id" serial PRIMARY KEY,
      "group_id" integer REFERENCES "${schema}"."groups"("id") ON DELETE CASCADE,
      "lesson_date" date NOT NULL,
      "topic" varchar(255),
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "${schema}"."attendance_records" (
      "id" serial PRIMARY KEY,
      "session_id" integer REFERENCES "${schema}"."attendance_sessions"("id") ON DELETE CASCADE,
      "student_id" integer REFERENCES "${schema}"."students"("id") ON DELETE CASCADE,
      "status" varchar(20) DEFAULT 'present',
      "created_at" timestamp DEFAULT now()
    );`
  ];
}

export async function provisionTenantSchema(sql: any, schemaName: string): Promise<void> {
  const ddlStatements = getTenantSchemaDDL(schemaName);
  for (const statement of ddlStatements) {
    await sql.unsafe(statement);
  }
}
