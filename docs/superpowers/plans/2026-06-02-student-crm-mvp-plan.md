# Student CRM MVP — Registration + Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add registration (students, courses, groups, enrollments) and attendance tracking (sessions, attendance marking) for summer camps and courses.

**Architecture:** Drizzle ORM schema extended with 4 new tables. tRPC routers for CRUD operations. Mobile-first React pages in the portal app. All tables scoped by `schoolId`. Enrollments link students to groups. Sessions are generated from group schedule patterns. Attendance auto-resolves enrollmentId.

**Tech Stack:** Next.js 16, React 19, Tailwind 3, tRPC v11, Auth.js v5, Drizzle ORM, PostgreSQL 16, Zod validation.

**Important naming:** Auth.js exports a `sessions` table. Our new learning session table is named `class_sessions` in the DB to avoid collision.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/src/schema.ts` | Modify | Add 4 tables + alter courses |
| `apps/portal/src/lib/db.ts` | Modify | Bind new tables to db instance |
| `apps/portal/src/server/routers/student.ts` | Create | Student CRUD router |
| `apps/portal/src/server/routers/course.ts` | Create | Course CRUD router |
| `apps/portal/src/server/routers/group.ts` | Create | Group CRUD router |
| `apps/portal/src/server/routers/enrollment.ts` | Create | Enrollment CRUD router |
| `apps/portal/src/server/routers/session.ts` | Create | Session CRUD router |
| `apps/portal/src/server/routers/attendance.ts` | Create | Attendance marking router |
| `apps/portal/src/server/routers/_app.ts` | Modify | Register new routers |
| `apps/portal/src/components/dashboard/Nav.tsx` | Modify | Add nav items |
| `apps/portal/src/app/dashboard/students/page.tsx` | Replace | Student list + detail |
| `apps/portal/src/app/dashboard/courses/page.tsx` | Create | Course list + form |
| `apps/portal/src/app/dashboard/groups/page.tsx` | Create | Group list + form + enrollments |
| `apps/portal/src/app/dashboard/calendar/page.tsx` | Create | Calendar + session gen + attendance |
| `apps/portal/src/components/dashboard/StudentForm.tsx` | Create | Student create/edit drawer |
| `apps/portal/src/components/dashboard/CourseForm.tsx` | Create | Course create/edit drawer |
| `apps/portal/src/components/dashboard/GroupForm.tsx` | Create | Group create/edit drawer |
| `apps/portal/src/scripts/seed.ts` | Modify | Add MVP sample data |

---

### Task 1: Schema — Add new tables and alter courses

**Files:**
- Modify: `packages/db/src/schema.ts:1-86`
- Modify: `apps/portal/src/lib/db.ts:1-10`

- [ ] **Step 1: Add new tables and alter courses in schema.ts**

Replace the entire file content. Keep existing tables. Add `description` and `active` to `courses`. Add 4 new tables.

```ts
import { pgTable, serial, varchar, text, boolean, timestamp, integer, date, jsonb } from "drizzle-orm/pg-core";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table (Auth.js compatible + PBAC)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("teacher"),
  permissions: text("permissions").array().default([]),
  courseIds: integer("course_ids").array().default([]),
  schoolId: integer("school_id").references(() => schools.id),
  phone: varchar("phone", { length: 50 }),
  info: text("info"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  parentName: varchar("parent_name", { length: 255 }),
  parentPhone: varchar("parent_phone", { length: 50 }),
  info: text("info"),
  classId: integer("class_id"),
  active: boolean("active").default(true),
  lastChangedAt: timestamp("last_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auth.js adapter tables
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
});

// === NEW TABLES ===

// Groups — time slot for a course
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  schoolId: integer("school_id").references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  schedulePattern: jsonb("schedule_pattern"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enrollments — student subscription to a group
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  groupId: integer("group_id").references(() => groups.id),
  schoolId: integer("school_id").references(() => schools.id),
  type: varchar("type", { length: 50 }).notNull(), // "course" | "camp"
  price: integer("price").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, paused, cancelled, completed
  startDate: date("start_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Class sessions — individual calendar occurrence of a group (named class_sessions to avoid collision with Auth.js sessions)
export const classSessions = pgTable("class_sessions", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  schoolId: integer("school_id").references(() => schools.id),
  date: date("date").notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendances — student presence per session
export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => classSessions.id),
  studentId: integer("student_id").references(() => students.id),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  status: varchar("status", { length: 50 }).notNull(), // "present" | "absent"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type School = typeof schools.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
```

- [ ] **Step 2: Update lib/db.ts schema binding**

Replace `apps/portal/src/lib/db.ts`:

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, schools, courses, sessions, groups, enrollments, classSessions, attendances } from "@/db/schema";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 1 },
);
export const db = drizzle(sql, {
  schema: { users, schools, courses, sessions, groups, enrollments, classSessions, attendances },
});
```

- [ ] **Step 3: Push schema to database**

```bash
cd /Users/strdr4605/P/vibe2/brio-md/apps/portal && npx drizzle-kit push
```

Expected: "No changes to push" or "Schema pushed successfully". New tables created.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/schema.ts apps/portal/src/lib/db.ts
git commit -m "feat: add groups, enrollments, class_sessions, attendances tables"
```

---

### Task 2: Student tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/student.ts`

- [ ] **Step 1: Create student router**

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { students } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

export const studentRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          active: z.boolean().optional(),
        })
        .optional(),
    )
.query(async ({ ctx, input }) => {
      const user = ctx.user!;
      const conditions = [];

      if (!user.permissions.includes("super")) {
        if (user.schoolId) {
          conditions.push(eq(students.schoolId, user.schoolId));
        } else {
          return [];
        }
      }

      if (input?.search) {
        conditions.push(ilike(students.name, `%${input.search}%`));
      }
      if (input?.active !== undefined) {
        conditions.push(eq(students.active, input.active));
      }

      return db
        .select()
        .from(students)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(students.name);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [result] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        parentName: z.string().optional(),
        parentPhone: z.string().optional(),
        info: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user!.schoolId;
      if (!schoolId) throw new TRPCError({ code: "BAD_REQUEST", message: "No school assigned" });

      const [result] = await db
        .insert(students)
        .values({ ...input, schoolId, active: true })
        .returning();
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        parentName: z.string().optional(),
        parentPhone: z.string().optional(),
        info: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await db
        .update(students)
        .set({ ...updates, lastChangedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      return result;
    }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/student.ts
git commit -m "feat: add student tRPC router"
```

---

### Task 3: Course tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/course.ts`

- [ ] **Step 1: Create course router**

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, and } from "drizzle-orm";
import { courses } from "@/db/schema";
import { db } from "@/lib/db";

export const courseRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user!;
    const conditions = [];

    if (!user.permissions.includes("super")) {
      if (user.schoolId) {
        conditions.push(eq(courses.schoolId, user.schoolId));
      } else {
        return [];
      }
    }

    return db
      .select()
      .from(courses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(courses.name);
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user!.schoolId;
      const [result] = await db
        .insert(courses)
        .values({ ...input, schoolId, active: true })
        .returning();
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await db
        .update(courses)
        .set(updates)
        .where(eq(courses.id, id))
        .returning();
      return result;
    }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/course.ts
git commit -m "feat: add course tRPC router"
```

---

### Task 4: Group tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/group.ts`

- [ ] **Step 1: Create group router**

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, and } from "drizzle-orm";
import { groups } from "@/db/schema";
import { db } from "@/lib/db";

export const groupRouter = router({
  list: protectedProcedure
    .input(z.object({ courseId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      const conditions = [];

      if (!user.permissions.includes("super")) {
        if (user.schoolId) {
          conditions.push(eq(groups.schoolId, user.schoolId));
        } else {
          return [];
        }
      }

      if (input?.courseId) {
        conditions.push(eq(groups.courseId, input.courseId));
      }

      return db
        .select()
        .from(groups)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(groups.name);
    }),

  listByTeacher: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user!;
    const teacherId = parseInt(user.id);
    return db
      .select()
      .from(groups)
      .where(eq(groups.teacherId, teacherId))
      .orderBy(groups.name);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(groups).where(eq(groups.id, input.id)).limit(1);
    }),

  create: adminProcedure
    .input(
      z.object({
        courseId: z.number(),
        name: z.string().min(1),
        teacherId: z.number().optional().nullable(),
        schedulePattern: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user!.schoolId;
      const [result] = await db
        .insert(groups)
        .values({ ...input, schoolId, active: true })
        .returning();
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        teacherId: z.number().optional().nullable(),
        schedulePattern: z.any().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await db
        .update(groups)
        .set(updates)
        .where(eq(groups.id, id))
        .returning();
      return result;
    }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/group.ts
git commit -m "feat: add group tRPC router"
```

---

### Task 5: Enrollment tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/enrollment.ts`

- [ ] **Step 1: Create enrollment router**

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, and } from "drizzle-orm";
import { enrollments, students, groups, courses } from "@/db/schema";
import { db } from "@/lib/db";

export const enrollmentRouter = router({
  listByGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({
          enrollment: enrollments,
          student: { id: students.id, name: students.name },
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(eq(enrollments.groupId, input.groupId))
        .orderBy(students.name);
    }),

  listByStudent: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({
          enrollment: enrollments,
          course: { id: courses.id, name: courses.name },
          group: { id: groups.id, name: groups.name },
        })
        .from(enrollments)
        .innerJoin(groups, eq(enrollments.groupId, groups.id))
        .innerJoin(courses, eq(groups.courseId, courses.id))
        .where(eq(enrollments.studentId, input.studentId))
        .orderBy(enrollments.createdAt);
    }),

  create: adminProcedure
    .input(
      z.object({
        studentId: z.number(),
        groupId: z.number(),
        type: z.enum(["course", "camp"]),
        price: z.number().min(0),
        status: z.enum(["active", "paused", "cancelled", "completed"]).default("active"),
        startDate: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user!.schoolId;
      const [result] = await db
        .insert(enrollments)
        .values({ ...input, schoolId, startDate: input.startDate })
        .returning();
      return result;
    }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/enrollment.ts
git commit -m "feat: add enrollment tRPC router"
```

---

### Task 6: Session tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/session.ts`

- [ ] **Step 1: Create session router**

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, and, gte, lte } from "drizzle-orm";
import { classSessions } from "@/db/schema";
import { db } from "@/lib/db";

export const sessionRouter = router({
  listByGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        month: z.string().optional(), // "2026-06"
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(classSessions.groupId, input.groupId)];

      if (input.month) {
        const [year, month] = input.month.split("-").map(Number);
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const end = `${year}-${String(month).padStart(2, "0")}-31`;
        conditions.push(gte(classSessions.date, start));
        conditions.push(lte(classSessions.date, end));
      }

      return db
        .select()
        .from(classSessions)
        .where(and(...conditions))
        .orderBy(classSessions.date);
    }),

  create: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        date: z.string(),
        teacherId: z.number().optional().nullable(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [group] = await db
        .select({ schoolId: classSessions.schoolId })
        .from(classSessions)
        .where(eq(classSessions.groupId, input.groupId))
        .limit(1);
      const schoolId = group?.schoolId ?? ctx.user!.schoolId;

      const [result] = await db
        .insert(classSessions)
        .values({ ...input, schoolId, date: input.date })
        .returning();
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        date: z.string().optional(),
        teacherId: z.number().optional().nullable(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      if (updates.date) (updates as any).date = updates.date;
      const [result] = await db
        .update(classSessions)
        .set(updates)
        .where(eq(classSessions.id, id))
        .returning();
      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(classSessions).where(eq(classSessions.id, input.id));
      return { success: true };
    }),

  generateForGroup: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        month: z.string(), // "2026-06"
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [group] = await db
        .select()
        .from(classSessions)
        .where(eq(classSessions.groupId, input.groupId))
        .limit(1);
      // Re-query groups table for schedulePattern
      const { groups } = await import("@/db/schema");
      const [grp] = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);
      const schoolId = ctx.user!.schoolId!;

      const pattern = grp?.schedulePattern as Record<string, string[]> | null;
      if (!pattern) return { count: 0 };

      const [year, month] = input.month.split("-").map(Number);
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      };

      const daysInMonth = new Date(year, month, 0).getDate();
      const created: string[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayName = Object.keys(dayMap).find(
          (k) => dayMap[k] === date.getDay(),
        );
        if (dayName && pattern[dayName]) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const [existing] = await db
            .select({ id: classSessions.id })
            .from(classSessions)
            .where(
              and(
                eq(classSessions.groupId, input.groupId),
                eq(classSessions.date, dateStr),
              ),
            )
            .limit(1);

          if (!existing) {
            await db.insert(classSessions).values({
              groupId: input.groupId,
              schoolId,
              date: dateStr,
              teacherId: grp.teacherId,
            });
            created.push(dateStr);
          }
        }
      }

      return { count: created.length, dates: created };
    }),
});
```

Wait — `generateForGroup` queries `groups` but `db` in `lib/db.ts` now has `groups` in the bound schema. The import is circular-ish. Let me use a direct approach.

Actually no — `groups` is already imported in `lib/db.ts`. The `db` instance has the full schema bound via the schema object. But the `generateForGroup` mutation tries to `import()` dynamically which is awkward. Let me fix: import `groups` at the top of the file.

```ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { eq, and, gte, lte } from "drizzle-orm";
import { classSessions, groups } from "@/db/schema";
import { db } from "@/lib/db";

export const sessionRouter = router({
  listByGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        month: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(classSessions.groupId, input.groupId)];

      if (input.month) {
        const [year, month] = input.month.split("-").map(Number);
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const end = `${year}-${String(month).padStart(2, "0")}-31`;
        conditions.push(gte(classSessions.date, start));
        conditions.push(lte(classSessions.date, end));
      }

      return db
        .select()
        .from(classSessions)
        .where(and(...conditions))
        .orderBy(classSessions.date);
    }),

  create: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        date: z.string(),
        teacherId: z.number().optional().nullable(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schoolId = ctx.user!.schoolId;
      const [result] = await db
        .insert(classSessions)
        .values({ ...input, schoolId, date: input.date })
        .returning();
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        date: z.string().optional(),
        teacherId: z.number().optional().nullable(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      if (updates.date) (updates as any).date = updates.date;
      const [result] = await db
        .update(classSessions)
        .set(updates)
        .where(eq(classSessions.id, id))
        .returning();
      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(classSessions).where(eq(classSessions.id, input.id));
      return { success: true };
    }),

  generateForGroup: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        month: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [grp] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, input.groupId))
        .limit(1);
      if (!grp?.schedulePattern) return { count: 0 };

      const schoolId = ctx.user!.schoolId!;
      const pattern = grp.schedulePattern as Record<string, string[]>;
      const [year, month] = input.month.split("-").map(Number);
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      };

      const daysInMonth = new Date(year, month, 0).getDate();
      const created: string[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayName = Object.keys(dayMap).find((k) => dayMap[k] === date.getDay());
        if (dayName && pattern[dayName]) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const [existing] = await db
            .select({ id: classSessions.id })
            .from(classSessions)
            .where(and(eq(classSessions.groupId, input.groupId), eq(classSessions.date, dateStr)))
            .limit(1);

          if (!existing) {
            await db.insert(classSessions).values({
              groupId: input.groupId,
              schoolId,
              date: dateStr,
              teacherId: grp.teacherId,
            });
            created.push(dateStr);
          }
        }
      }

      return { count: created.length, dates: created };
    }),
});
```

That looks correct now.

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/session.ts
git commit -m "feat: add session tRPC router"
```

---

### Task 7: Attendance tRPC router

**Files:**
- Create: `apps/portal/src/server/routers/attendance.ts`

- [ ] **Step 1: Create attendance router**

```ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq, and } from "drizzle-orm";
import { attendances, classSessions, enrollments } from "@/db/schema";
import { db } from "@/lib/db";

export const attendanceRouter = router({
  listBySession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(attendances)
        .where(eq(attendances.sessionId, input.sessionId));
    }),

  mark: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        records: z.array(
          z.object({
            studentId: z.number(),
            status: z.enum(["present", "absent"]),
            notes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { sessionId, records } = input;

      // Get session to resolve group + date
      const [session] = await db
        .select({ groupId: classSessions.groupId, date: classSessions.date })
        .from(classSessions)
        .where(eq(classSessions.id, sessionId))
        .limit(1);
      if (!session) return { success: false };

      const results = [];
      for (const record of records) {
        // Auto-resolve enrollmentId
        const [enrollment] = await db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.studentId, record.studentId),
              eq(enrollments.groupId, session.groupId),
              eq(enrollments.status, "active"),
            ),
          )
          .limit(1);

        // Upsert: check if existing
        const [existing] = await db
          .select({ id: attendances.id })
          .from(attendances)
          .where(
            and(
              eq(attendances.sessionId, sessionId),
              eq(attendances.studentId, record.studentId),
            ),
          )
          .limit(1);

        if (existing) {
          const [updated] = await db
            .update(attendances)
            .set({
              status: record.status,
              enrollmentId: enrollment?.id ?? existing.id,
              notes: record.notes,
            })
            .where(eq(attendances.id, existing.id))
            .returning();
          results.push(updated);
        } else {
          const [created] = await db
            .insert(attendances)
            .values({
              sessionId,
              studentId: record.studentId,
              enrollmentId: enrollment?.id,
              status: record.status,
              notes: record.notes,
            })
            .returning();
          results.push(created);
        }
      }

      return { success: true, count: results.length };
    }),

  listByStudent: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        groupId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(attendances.studentId, input.studentId)];
      return db
        .select({
          attendance: attendances,
          date: classSessions.date,
          groupId: classSessions.groupId,
        })
        .from(attendances)
        .innerJoin(classSessions, eq(attendances.sessionId, classSessions.id))
        .where(and(...conditions))
        .orderBy(classSessions.date);
    }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/attendance.ts
git commit -m "feat: add attendance tRPC router"
```

---

### Task 8: Register routers in _app.ts

**Files:**
- Modify: `apps/portal/src/server/routers/_app.ts:1-8`

- [ ] **Step 1: Add new routers to appRouter**

Replace content:

```ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { studentRouter } from "./student";
import { courseRouter } from "./course";
import { groupRouter } from "./group";
import { enrollmentRouter } from "./enrollment";
import { sessionRouter } from "./session";
import { attendanceRouter } from "./attendance";

export const appRouter = router({
  user: userRouter,
  student: studentRouter,
  course: courseRouter,
  group: groupRouter,
  enrollment: enrollmentRouter,
  session: sessionRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/_app.ts
git commit -m "feat: register new tRPC routers"
```

---

### Task 9: Update Nav component

**Files:**
- Modify: `apps/portal/src/components/dashboard/Nav.tsx:7-12`

- [ ] **Step 1: Add new nav items**

Replace the `navItems` array (lines 7-12):

```tsx
const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/students", icon: "👨‍🎓", label: "Studenţi" },
  { href: "/dashboard/courses", icon: "📚", label: "Cursuri" },
  { href: "/dashboard/groups", icon: "👥", label: "Grupe" },
  { href: "/dashboard/calendar", icon: "📅", label: "Calendar" },
  { href: "/dashboard/users", icon: "⚙️", label: "Utilizatori" },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/Nav.tsx
git commit -m "feat: add courses, groups, calendar to nav"
```

---

### Task 10: StudentForm drawer component

**Files:**
- Create: `apps/portal/src/components/dashboard/StudentForm.tsx`

- [ ] **Step 1: Create StudentForm component**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function StudentFormDrawer({
  student,
  onClose,
}: {
  student: any | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(student?.name ?? "");
  const [parentName, setParentName] = useState(student?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone ?? "");
  const [info, setInfo] = useState(student?.info ?? "");
  const [active, setActive] = useState(student?.active ?? true);

  const createMutation = trpc.student.create.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      onClose();
    },
  });

  const updateMutation = trpc.student.update.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (student) {
      updateMutation.mutate({ id: student.id, name, parentName, parentPhone, info, active });
    } else {
      createMutation.mutate({ name, parentName, parentPhone, info });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {student ? "Editează Student" : "Adaugă Student"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nume *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nume Părinte</label>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Telefon Părinte</label>
              <input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
              <textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            {student && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  id="student-active"
                />
                <label htmlFor="student-active" className="text-sm text-neutral-700">Activ</label>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {student ? "Salvează" : "Adaugă"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/StudentForm.tsx
git commit -m "feat: add StudentForm drawer component"
```

---

### Task 11: Students page

**Files:**
- Replace: `apps/portal/src/app/dashboard/students/page.tsx`

- [ ] **Step 1: Replace students page stub**

```tsx
"use client";

import { StudentFormDrawer } from "@/components/dashboard/StudentForm";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students = [], isLoading } = trpc.student.list.useQuery({
    search: search || undefined,
    active: activeFilter,
  });
  const { data: enrollments = [] } = trpc.enrollment.listByStudent.useQuery(
    { studentId: selectedStudent?.id ?? 0 },
    { enabled: !!selectedStudent },
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Studenţi</h1>
        <button
          onClick={() => { setEditingStudent(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă Student
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută..."
          className="px-3 py-2 border rounded-lg flex-1"
        />
        <select
          value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
          onChange={(e) => {
            const val = e.target.value;
            setActiveFilter(val === "all" ? undefined : val === "active");
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Toți</option>
          <option value="active">Activ</option>
          <option value="inactive">Inactiv</option>
        </select>
      </div>

      {selectedStudent ? (
        <div>
          <button onClick={() => setSelectedStudent(null)} className="text-blue-600 mb-4 block">
            ← Înapoi la listă
          </button>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{selectedStudent.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-500">Părinte:</span> {selectedStudent.parentName || "-"}</div>
              <div><span className="text-neutral-500">Telefon:</span> {selectedStudent.parentPhone || "-"}</div>
              <div><span className="text-neutral-500">Note:</span> {selectedStudent.info || "-"}</div>
              <div>
                <span className="text-neutral-500">Status:</span>{" "}
                {selectedStudent.active ? <span className="text-green-600">Activ</span> : <span className="text-red-600">Inactiv</span>}
              </div>
            </div>
            <button
              onClick={() => { setEditingStudent(selectedStudent); setShowForm(true); }}
              className="mt-4 px-3 py-1 text-sm border rounded hover:bg-neutral-100"
            >
              Editează
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-3">Înscrieri</h3>
          {enrollments.length === 0 ? (
            <p className="text-neutral-500">Nicio înscriere.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e: any) => (
                <div key={e.enrollment.id} className="bg-white rounded-lg shadow p-4">
                  <div className="font-medium">{e.course.name} — {e.group.name}</div>
                  <div className="text-sm text-neutral-500">
                    {e.enrollment.type} · {e.enrollment.price / 100} lei · {e.enrollment.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {isLoading ? (
            <p>Se încarcă...</p>
          ) : students.length === 0 ? (
            <p className="text-neutral-600">Nu există studenţi.</p>
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {students.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="w-full bg-white rounded-lg shadow p-4 text-left"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-neutral-500">{s.parentName || "Fără părinte"}</div>
                  </button>
                ))}
              </div>
              <div className="hidden md:block bg-white rounded-lg shadow">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Nume</th>
                      <th className="px-4 py-3 text-left">Părinte</th>
                      <th className="px-4 py-3 text-left">Telefon</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: any) => (
                      <tr key={s.id} className="border-t hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">{s.parentName || "-"}</td>
                        <td className="px-4 py-3">{s.parentPhone || "-"}</td>
                        <td className="px-4 py-3">
                          {s.active ? <span className="text-green-600">Activ</span> : <span className="text-red-600">Inactiv</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedStudent(s)} className="text-blue-600 hover:underline">Detalii</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {showForm && (
        <StudentFormDrawer
          student={editingStudent}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/app/dashboard/students/page.tsx
git commit -m "feat: implement students page with list and detail"
```

---

### Task 12: CourseForm drawer component

**Files:**
- Create: `apps/portal/src/components/dashboard/CourseForm.tsx`

- [ ] **Step 1: Create CourseForm component**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function CourseFormDrawer({
  course,
  onClose,
}: {
  course: any | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [active, setActive] = useState(course?.active ?? true);

  const createMutation = trpc.course.create.useMutation({
    onSuccess: () => { utils.course.list.invalidate(); onClose(); },
  });
  const updateMutation = trpc.course.update.useMutation({
    onSuccess: () => { utils.course.list.invalidate(); onClose(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (course) {
      updateMutation.mutate({ id: course.id, name, description, active });
    } else {
      createMutation.mutate({ name, description });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {course ? "Editează Curs" : "Adaugă Curs"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nume *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Descriere</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            {course && (
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} id="course-active" />
                <label htmlFor="course-active" className="text-sm text-neutral-700">Activ</label>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {course ? "Salvează" : "Adaugă"}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-neutral-100">
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/CourseForm.tsx
git commit -m "feat: add CourseForm drawer component"
```

---

### Task 13: Courses page

**Files:**
- Create: `apps/portal/src/app/dashboard/courses/page.tsx`
- Create: `apps/portal/src/app/dashboard/courses/` directory

- [ ] **Step 1: Create courses page**

```tsx
"use client";

import { CourseFormDrawer } from "@/components/dashboard/CourseForm";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function CoursesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const { data: courses = [], isLoading } = trpc.course.list.useQuery();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cursuri</h1>
        <button
          onClick={() => { setEditingCourse(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă Curs
        </button>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : courses.length === 0 ? (
        <p className="text-neutral-600">Nu există cursuri.</p>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            {courses.map((c: any) => (
              <div key={c.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-neutral-500">{c.description || ""}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${c.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {c.active ? "Activ" : "Inactiv"}
                  </span>
                </div>
                <button
                  onClick={() => { setEditingCourse(c); setShowForm(true); }}
                  className="mt-2 text-blue-600 text-sm"
                >
                  Editează
                </button>
              </div>
            ))}
          </div>
          <div className="hidden md:block bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Nume</th>
                  <th className="px-4 py-3 text-left">Descriere</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.description || "-"}</td>
                    <td className="px-4 py-3">
                      {c.active ? <span className="text-green-600">Activ</span> : <span className="text-red-600">Inactiv</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditingCourse(c); setShowForm(true); }}
                        className="text-blue-600 hover:underline"
                      >
                        Editează
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <CourseFormDrawer course={editingCourse} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p apps/portal/src/app/dashboard/courses
git add apps/portal/src/app/dashboard/courses/page.tsx
git commit -m "feat: implement courses page"
```

---

### Task 14: GroupForm drawer component

**Files:**
- Create: `apps/portal/src/components/dashboard/GroupForm.tsx`

- [ ] **Step 1: Create GroupForm component**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

const DAYS = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function GroupFormDrawer({
  group,
  onClose,
}: {
  group: any | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(group?.name ?? "");
  const [courseId, setCourseId] = useState<number | "">(group?.courseId ?? "");
  const [teacherId, setTeacherId] = useState<number | "">(group?.teacherId ?? "");
  const [active, setActive] = useState(group?.active ?? true);

  const existingPattern = (group?.schedulePattern as Record<string, string[]>) ?? {};
  const defaultTimes = existingPattern[Object.keys(existingPattern)[0]]?.[0] ?? "17:00";

  const [selectedDays, setSelectedDays] = useState<string[]>(
    Object.keys(existingPattern).filter((k) => existingPattern[k]?.length > 0),
  );
  const [time, setTime] = useState(defaultTimes);

  const { data: courses = [] } = trpc.course.list.useQuery();
  const { data: users = [] } = trpc.user.list.useQuery({ role: "teacher", limit: 100 });

  const createMutation = trpc.group.create.useMutation({
    onSuccess: () => { utils.group.list.invalidate(); onClose(); },
  });
  const updateMutation = trpc.group.update.useMutation({
    onSuccess: () => { utils.group.list.invalidate(); onClose(); },
  });

  const toggleDay = (dayKey: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey],
    );
  };

  const buildSchedulePattern = () => {
    const pattern: Record<string, string[]> = {};
    selectedDays.forEach((d) => { pattern[d] = [time]; });
    return pattern;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || courseId === "") return;

    const schedulePattern = selectedDays.length > 0 ? buildSchedulePattern() : undefined;

    if (group) {
      updateMutation.mutate({
        id: group.id,
        name,
        teacherId: teacherId === "" ? null : teacherId,
        schedulePattern,
        active,
      });
    } else {
      createMutation.mutate({
        courseId: courseId as number,
        name,
        teacherId: teacherId === "" ? null : teacherId,
        schedulePattern,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {group ? "Editează Grupa" : "Adaugă Grupa"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nume *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Luni 17:30"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Curs *</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Selectează cursul</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Profesor</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Niciunul</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Orar (zile)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DAY_KEYS.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      selectedDays.includes(key)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-neutral-300 hover:border-blue-400"
                    }`}
                  >
                    {DAYS[i]}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">Ora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
            {group && (
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} id="group-active" />
                <label htmlFor="group-active" className="text-sm text-neutral-700">Activ</label>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {group ? "Salvează" : "Adaugă"}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-neutral-100">
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/GroupForm.tsx
git commit -m "feat: add GroupForm drawer component"
```

---

### Task 15: Groups page with enrollment management

**Files:**
- Create: `apps/portal/src/app/dashboard/groups/page.tsx`
- Create: `apps/portal/src/app/dashboard/groups/` directory

- [ ] **Step 1: Create groups page**

```tsx
"use client";

import { GroupFormDrawer } from "@/components/dashboard/GroupForm";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function GroupsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [filterCourseId, setFilterCourseId] = useState<number | undefined>();

  const { data: groups = [], isLoading } = trpc.group.list.useQuery(
    filterCourseId ? { courseId: filterCourseId } : undefined,
  );
  const { data: courses = [] } = trpc.course.list.useQuery();
  const { data: groupEnrollments = [], refetch: refetchEnrollments } = trpc.enrollment.listByGroup.useQuery(
    { groupId: selectedGroup?.id ?? 0 },
    { enabled: !!selectedGroup },
  );
  const { data: students = [] } = trpc.student.list.useQuery();

  // Enrollment form state
  const [addStudentId, setAddStudentId] = useState<number | "">("");
  const [enrollType, setEnrollType] = useState<"course" | "camp">("course");
  const [enrollPrice, setEnrollPrice] = useState("");
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().split("T")[0]);
  const [enrollNotes, setEnrollNotes] = useState("");

  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      refetchEnrollments();
      setAddStudentId("");
      setEnrollPrice("");
      setEnrollNotes("");
    },
  });

  const handleAddEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (addStudentId === "" || !selectedGroup || enrollPrice === "") return;
    createEnrollment.mutate({
      studentId: addStudentId as number,
      groupId: selectedGroup.id,
      type: enrollType,
      price: Math.round(parseFloat(enrollPrice) * 100),
      startDate: enrollDate,
      notes: enrollNotes || undefined,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grupe</h1>
        <button
          onClick={() => { setEditingGroup(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă Grupa
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterCourseId ?? "all"}
          onChange={(e) => setFilterCourseId(e.target.value === "all" ? undefined : Number(e.target.value))}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Toate cursurile</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedGroup ? (
        <div>
          <button onClick={() => setSelectedGroup(null)} className="text-blue-600 mb-4 block">
            ← Înapoi la grupe
          </button>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                <p className="text-neutral-500">
                  {courses.find((c: any) => c.id === selectedGroup.courseId)?.name ?? ""}
                </p>
              </div>
              <button
                onClick={() => { setEditingGroup(selectedGroup); setShowForm(true); }}
                className="px-3 py-1 text-sm border rounded hover:bg-neutral-100"
              >
                Editează
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Studenți înscriși</h3>
          {groupEnrollments.length === 0 ? (
            <p className="text-neutral-500 mb-4">Niciun student înscris.</p>
          ) : (
            <div className="space-y-2 mb-6">
              {groupEnrollments.map((e: any) => (
                <div key={e.enrollment.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{e.student.name}</span>
                    <span className="text-sm text-neutral-500 ml-2">
                      {e.enrollment.type} · {e.enrollment.price / 100} lei
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${e.enrollment.status === "active" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>
                    {e.enrollment.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3">Adaugă student</h3>
          <form onSubmit={handleAddEnrollment} className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Student *</label>
                <select
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selectează</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Tip *</label>
                <select value={enrollType} onChange={(e) => setEnrollType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="course">Curs</option>
                  <option value="camp">Tabără</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Preț (lei) *</label>
                <input
                  type="number"
                  value={enrollPrice}
                  onChange={(e) => setEnrollPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Data start</label>
                <input type="date" value={enrollDate} onChange={(e) => setEnrollDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Note</label>
              <input value={enrollNotes} onChange={(e) => setEnrollNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Adaugă
            </button>
          </form>
        </div>
      ) : (
        <>
          {isLoading ? (
            <p>Se încarcă...</p>
          ) : groups.length === 0 ? (
            <p className="text-neutral-600">Nu există grupe.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((g: any) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-neutral-50"
                >
                  <div className="font-medium">{g.name}</div>
                  <div className="text-sm text-neutral-500">
                    {courses.find((c: any) => c.id === g.courseId)?.name ?? ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <GroupFormDrawer group={editingGroup} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p apps/portal/src/app/dashboard/groups
git add apps/portal/src/app/dashboard/groups/page.tsx
git commit -m "feat: implement groups page with enrollment management"
```

---

### Task 16: Calendar + Attendance page

**Files:**
- Create: `apps/portal/src/app/dashboard/calendar/page.tsx`
- Create: `apps/portal/src/app/dashboard/calendar/` directory

- [ ] **Step 1: Create calendar + attendance page**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
const DAY_NAMES = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const monthKey = getMonthKey(currentMonth);

  const { data: groups = [] } = trpc.group.list.useQuery();
  const { data: sessions = [], refetch: refetchSessions } = trpc.session.listByGroup.useQuery(
    { groupId: selectedGroupId as number, month: monthKey },
    { enabled: selectedGroupId !== "" },
  );
  const { data: attendances = [], refetch: refetchAttendances } = trpc.attendance.listBySession.useQuery(
    { sessionId: selectedSession?.id ?? 0 },
    { enabled: !!selectedSession },
  );
  const { data: enrollments = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: selectedGroupId as number },
    { enabled: selectedGroupId !== "" },
  );

  const generateForMonth = trpc.session.generateForGroup.useMutation({
    onSuccess: () => refetchSessions(),
  });

  const markAttendance = trpc.attendance.mark.useMutation({
    onSuccess: () => refetchAttendances(),
  });

  // Build month grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday-start

  const sessionDates = new Set(sessions.map((s: any) => s.date));

  const handleMarkAttendance = (studentId: number, currentStatus: string | null) => {
    if (!selectedSession) return;
    const newStatus = currentStatus === "present" ? "absent" : "present";
    markAttendance.mutate({
      sessionId: selectedSession.id,
      records: [{ studentId, status: newStatus }],
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>

      <div className="mb-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Grupa</label>
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value === "" ? "" : Number(e.target.value));
              setSelectedSession(null);
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Selectează grupa</option>
            {groups.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {selectedGroupId !== "" && (
          <button
            onClick={() => generateForMonth.mutate({ groupId: selectedGroupId as number, month: monthKey })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generează sesiuni
          </button>
        )}
      </div>

      {selectedGroupId !== "" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-neutral-200 rounded">←</button>
            <span className="font-semibold">{MONTHS[month]} {year}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-neutral-200 rounded">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-6">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-neutral-500 py-1">{d}</div>
            ))}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasSession = sessionDates.has(dateStr);
              const session = sessions.find((s: any) => s.date === dateStr);

              return (
                <button
                  key={day}
                  onClick={() => hasSession && setSelectedSession(session)}
                  className={`p-2 rounded-lg text-center text-sm ${
                    hasSession
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                      : "text-neutral-400"
                  } ${dateStr === today.toISOString().split("T")[0] ? "ring-2 ring-blue-400" : ""}`}
                  disabled={!hasSession}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {selectedSession && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Prezență — {selectedSession.date}</h2>
                <button onClick={() => setSelectedSession(null)} className="text-neutral-500 hover:text-neutral-700">✕</button>
              </div>

              {enrollments.length === 0 ? (
                <p className="text-neutral-500">Niciun student înscris în această grupă.</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map((e: any) => {
                    const att = attendances.find((a: any) => a.studentId === e.student.id);
                    const isPresent = att?.status === "present";
                    return (
                      <div key={e.enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{e.student.name}</span>
                        <button
                          onClick={() => handleMarkAttendance(e.student.id, att?.status ?? null)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                            isPresent
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isPresent ? "Prezent" : "Absent"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p apps/portal/src/app/dashboard/calendar
git add apps/portal/src/app/dashboard/calendar/page.tsx
git commit -m "feat: implement calendar + attendance page"
```

---

### Task 17: Update seed script

**Files:**
- Modify: `apps/portal/src/scripts/seed.ts:1-91`

- [ ] **Step 1: Add MVP seed data**

Append after the existing teacher creation (after line 75, before the console.log block at line 77):

```ts
  // Create sample courses
  const [roboticsCourse] = await db
    .insert(courses)
    .values({ name: "Robotică Distractivă", schoolId: school.id, description: "Curs de robotică pentru începători", active: true })
    .returning();
  console.log("✅ Created course:", roboticsCourse.name);

  const [englishCourse] = await db
    .insert(courses)
    .values({ name: "Limba Engleză", schoolId: school.id, description: "Engleză pentru clasele 1-4", active: true })
    .returning();
  console.log("✅ Created course:", englishCourse.name);

  // Create groups
  const { groups } = await import("@brio-md/db"); // delayed import since we added tables
```

Wait — `groups` is now exported from `@brio-md/db`. But the seed script imports modules at the top. Let me rewrite the seed script with proper imports. Actually the import at top already imports from `@brio-md/db` which now exports `groups`, `enrollments`, `classSessions`, `attendances`. Let me just add them to the import.

Actually looking at the seed script again line 4:
```ts
import { schools, users, courses } from "@brio-md/db";
```

I need to add `groups, enrollments, students, classSessions, attendances` to this import.

Let me write the full updated seed:

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hash } from "bcryptjs";
import { schools, users, courses, students, groups, enrollments } from "@brio-md/db";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create school
  const [school] = await db
    .insert(schools)
    .values({ name: "Vibe Academy" })
    .returning();
  console.log("✅ Created school:", school.name);

  // Create courses
  const [roboticsCourse] = await db
    .insert(courses)
    .values({ name: "Robotică Distractivă", schoolId: school.id, description: "Curs de robotică pentru începători", active: true })
    .returning();
  console.log("✅ Created course:", roboticsCourse.name);

  const [englishCourse] = await db
    .insert(courses)
    .values({ name: "Limba Engleză", schoolId: school.id, description: "Engleză pentru clasele 1-4", active: true })
    .returning();
  console.log("✅ Created course:", englishCourse.name);

  const [campCourse] = await db
    .insert(courses)
    .values({ name: "Tabăra de Vară 2026", schoolId: school.id, description: "Tabără full-day, 1-2 săptămâni", active: true })
    .returning();
  console.log("✅ Created course:", campCourse.name);

  // Create SuperAdmin
  const superadminHash = await hash("admin123", 12);
  const [superadmin] = await db
    .insert(users)
    .values({ email: "admin@brio.md", passwordHash: superadminHash, name: "Super Admin", role: "superadmin", permissions: ["super"], schoolId: null })
    .returning();
  console.log("✅ Created SuperAdmin:", superadmin.email);

  // Create Admin
  const adminHash = await hash("admin123", 12);
  const [admin] = await db
    .insert(users)
    .values({ email: "admin@vibe.md", passwordHash: adminHash, name: "School Admin", role: "admin", permissions: ["admin"], schoolId: school.id })
    .returning();
  console.log("✅ Created Admin:", admin.email);

  // Create Teacher
  const teacherHash = await hash("teacher123", 12);
  const [teacher] = await db
    .insert(users)
    .values({ email: "teacher@vibe.md", passwordHash: teacherHash, name: "John Teacher", role: "teacher", permissions: ["teach"], courseIds: [roboticsCourse.id], schoolId: school.id })
    .returning();
  console.log("✅ Created Teacher:", teacher.email);

  // Create students
  const [student1] = await db
    .insert(students)
    .values({ name: "Alex Popescu", schoolId: school.id, parentName: "Maria Popescu", parentPhone: "0799123456", active: true })
    .returning();
  const [student2] = await db
    .insert(students)
    .values({ name: "Elena Ionescu", schoolId: school.id, parentName: "Andrei Ionescu", parentPhone: "0799654321", active: true })
    .returning();
  console.log("✅ Created students");

  // Create groups
  const [group1] = await db
    .insert(groups)
    .values({ courseId: roboticsCourse.id, schoolId: school.id, name: "Luni 17:30", teacherId: teacher.id, schedulePattern: { monday: ["17:30"] }, active: true })
    .returning();
  const [group2] = await db
    .insert(groups)
    .values({ courseId: englishCourse.id, schoolId: school.id, name: "Miercuri 16:00", teacherId: null, schedulePattern: { wednesday: ["16:00"] }, active: true })
    .returning();
  const [group3] = await db
    .insert(groups)
    .values({ courseId: campCourse.id, schoolId: school.id, name: "Tabăra Iulie", teacherId: teacher.id, active: true })
    .returning();
  console.log("✅ Created groups");

  // Create enrollments
  await db.insert(enrollments).values({ studentId: student1.id, groupId: group1.id, schoolId: school.id, type: "course", price: 67500, status: "active", startDate: "2026-06-01" });
  await db.insert(enrollments).values({ studentId: student2.id, groupId: group1.id, schoolId: school.id, type: "course", price: 67500, status: "active", startDate: "2026-06-01" });
  await db.insert(enrollments).values({ studentId: student1.id, groupId: group3.id, schoolId: school.id, type: "camp", price: 120000, status: "active", startDate: "2026-07-07" });
  console.log("✅ Created enrollments");

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
```

Actually wait — the drizzle instance in the seed script doesn't bind the schema. It uses `const db = drizzle(sql)` without schema binding. That means we need to pass table references directly to each query. Looking at the existing seed:

```ts
const db = drizzle(sql);
const [school] = await db.insert(schools).values({...}).returning();
```

This works because `schools` is imported and passed directly. The `drizzle(sql)` creates an untyped instance. Good, this pattern works for new tables too — just import and use them directly in queries. No need to `await import()` since they're now exported from `@brio-md/db`.

Let me fix: I was going to use `await import("@brio-md/db")` but actually at the top import I should just add `groups, students, enrollments`.

Let me use the simpler import approach. The updated seed file imports these at the top:

```ts
import { schools, users, courses, students, groups, enrollments } from "@brio-md/db";
```

Then everything works with direct usage. Good.

One more thing: `courseIds: [roboticsCourse.id]` — but `roboticsCourse` is defined after the `teacher` block. I moved course creation before user creation, which is correct. The flow is: schools → courses → users → students → groups → enrollments. 

- [ ] **Step 1: Rewrite seed.ts with MVP data**

Full file content (replace existing):

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hash } from "bcryptjs";
import { schools, users, courses, students, groups, enrollments } from "@brio-md/db";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding database...");

  const [school] = await db
    .insert(schools)
    .values({ name: "Vibe Academy" })
    .returning();
  console.log("✅ Created school:", school.name);

  // Courses
  const [roboticsCourse] = await db
    .insert(courses)
    .values({ name: "Robotică Distractivă", schoolId: school.id, description: "Curs de robotică pentru începători", active: true })
    .returning();
  console.log("✅ Created course:", roboticsCourse.name);

  const [englishCourse] = await db
    .insert(courses)
    .values({ name: "Limba Engleză", schoolId: school.id, description: "Engleză pentru clasele 1-4", active: true })
    .returning();
  console.log("✅ Created course:", englishCourse.name);

  const [campCourse] = await db
    .insert(courses)
    .values({ name: "Tabăra de Vară 2026", schoolId: school.id, description: "Tabără full-day, 1-2 săptămâni", active: true })
    .returning();
  console.log("✅ Created course:", campCourse.name);

  // Users
  const superadminHash = await hash("admin123", 12);
  const [superadmin] = await db
    .insert(users)
    .values({ email: "admin@brio.md", passwordHash: superadminHash, name: "Super Admin", role: "superadmin", permissions: ["super"], schoolId: null })
    .returning();
  console.log("✅ Created SuperAdmin:", superadmin.email);

  const adminHash = await hash("admin123", 12);
  const [admin] = await db
    .insert(users)
    .values({ email: "admin@vibe.md", passwordHash: adminHash, name: "School Admin", role: "admin", permissions: ["admin"], schoolId: school.id })
    .returning();
  console.log("✅ Created Admin:", admin.email);

  const teacherHash = await hash("teacher123", 12);
  const [teacher] = await db
    .insert(users)
    .values({ email: "teacher@vibe.md", passwordHash: teacherHash, name: "John Teacher", role: "teacher", permissions: ["teach"], courseIds: [roboticsCourse.id], schoolId: school.id })
    .returning();
  console.log("✅ Created Teacher:", teacher.email);

  // Students
  const [student1] = await db
    .insert(students)
    .values({ name: "Alex Popescu", schoolId: school.id, parentName: "Maria Popescu", parentPhone: "0799123456", active: true })
    .returning();
  const [student2] = await db
    .insert(students)
    .values({ name: "Elena Ionescu", schoolId: school.id, parentName: "Andrei Ionescu", parentPhone: "0799654321", active: true })
    .returning();
  console.log("✅ Created students");

  // Groups
  const [group1] = await db
    .insert(groups)
    .values({ courseId: roboticsCourse.id, schoolId: school.id, name: "Luni 17:30", teacherId: teacher.id, schedulePattern: { monday: ["17:30"] }, active: true })
    .returning();
  const [group2] = await db
    .insert(groups)
    .values({ courseId: englishCourse.id, schoolId: school.id, name: "Miercuri 16:00", teacherId: null, schedulePattern: { wednesday: ["16:00"] }, active: true })
    .returning();
  const [group3] = await db
    .insert(groups)
    .values({ courseId: campCourse.id, schoolId: school.id, name: "Tabăra Iulie", teacherId: teacher.id, active: true })
    .returning();
  console.log("✅ Created groups");

  // Enrollments
  await db.insert(enrollments).values({ studentId: student1.id, groupId: group1.id, schoolId: school.id, type: "course", price: 67500, status: "active", startDate: "2026-06-01" });
  await db.insert(enrollments).values({ studentId: student2.id, groupId: group1.id, schoolId: school.id, type: "course", price: 67500, status: "active", startDate: "2026-06-01" });
  await db.insert(enrollments).values({ studentId: student1.id, groupId: group3.id, schoolId: school.id, type: "camp", price: 120000, status: "active", startDate: "2026-07-07" });
  await db.insert(enrollments).values({ studentId: student2.id, groupId: group2.id, schoolId: school.id, type: "course", price: 80000, status: "active", startDate: "2026-06-01" });
  console.log("✅ Created enrollments");

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
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/scripts/seed.ts
git commit -m "feat: add MVP seed data for courses, students, groups, enrollments"
```

---

### Task 18: DB push + verification

**Files:** None (schema push)

- [ ] **Step 1: Push schema to database**

```bash
cd /Users/strdr4605/P/vibe2/brio-md/apps/portal && npx drizzle-kit push
```

Expected: Tables created successfully.

- [ ] **Step 2: Format code**

```bash
cd /Users/strdr4605/P/vibe2/brio-md && npm run format
```

- [ ] **Step 3: Lint**

```bash
cd /Users/strdr4605/P/vibe2/brio-md && npm run lint
```

Fix any errors.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: db push and format after MVP schema"
```
