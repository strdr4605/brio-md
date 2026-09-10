import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, schools, courses, sessions, permissionDefinitions } from "@/db/schema";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 10 },
);
export const db = drizzle(sql, {
  schema: { users, schools, courses, sessions, permissionDefinitions },
});
