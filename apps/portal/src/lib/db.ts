import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, schools, courses, courseMaterials, sessions, permissionDefinitions } from "@/db/schema";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 1 },
);
export const db = drizzle(sql, {
  schema: { users, schools, courses, courseMaterials, sessions, permissionDefinitions },
});
