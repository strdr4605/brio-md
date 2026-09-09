import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { courses, users, courseMaterials, studentCourseProgress } from "@brio-md/db";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 1 },
);

export const db = drizzle(sql, {
  schema: { courses, users, courseMaterials, studentCourseProgress },
});

