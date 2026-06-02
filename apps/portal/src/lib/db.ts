import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, schools, courses, sessions, permissionDefinitions } from "@/db/schema";
...
export const db = drizzle(sql, { schema: { users, schools, courses, sessions, permissionDefinitions } });
