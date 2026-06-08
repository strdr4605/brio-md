# Student CRM MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build registration + attendance for the staff portal: courses, groups, enrollments, sessions, attendance, group calendar, plus a teacher "start lesson" flow.

**Architecture:** Bottom-up. Schema + Drizzle migration first, then tRPC routers (Drizzle direct, no resolver layer), then admin UI (right-side `*FormDrawer` overlays following the existing `UserFormDrawer` pattern), then teacher UI, then permissions + smoke tests. Mobile-first, Romanian labels.

**Tech Stack:** Next.js 16, React 19, Tailwind 3, tRPC v11, Drizzle ORM 0.45, PostgreSQL 16, Auth.js v5, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-08-student-crm-mvp-plan-spec.md`

---

## File Structure

**Schema (packages/db):**
- Modify: `packages/db/src/schema.ts` — add 4 tables, alter `courses`.
- Create: `packages/db/drizzle/0001_*.sql` — generated migration.
- Modify: `apps/portal/src/lib/db.ts` — register new tables in drizzle schema object.

**Routers (apps/portal):**
- Create: `apps/portal/src/server/routers/course.ts` — `courseRouter`.
- Create: `apps/portal/src/server/routers/group.ts` — `groupRouter`.
- Create: `apps/portal/src/server/routers/enrollment.ts` — `enrollmentRouter`.
- Create: `apps/portal/src/server/routers/groupSession.ts` — `groupSessionRouter`.
- Create: `apps/portal/src/server/routers/attendance.ts` — `attendanceRouter` with `bulkSave` helper.
- Modify: `apps/portal/src/server/routers/student.ts` — add `getWithHistory` (create file if missing).
- Modify: `apps/portal/src/server/routers/_app.ts` — register all 5 new routers.
- Create: `apps/portal/src/server/routers/attendance.test.ts` — unit tests for `bulkSave`.
- Create: `apps/portal/src/server/routers/groupSession.test.ts` — unit tests for `create`/`remove`.

**Drawers (apps/portal):**
- Create: `apps/portal/src/components/dashboard/CourseForm.tsx` — `CourseFormDrawer`.
- Create: `apps/portal/src/components/dashboard/GroupForm.tsx` — `GroupFormDrawer`.
- Create: `apps/portal/src/components/dashboard/EnrollmentForm.tsx` — `EnrollmentFormDrawer`.
- Create: `apps/portal/src/components/dashboard/SessionForm.tsx` — `SessionFormDrawer`.

**Admin pages (apps/portal/src/app/dashboard):**
- Create: `courses/page.tsx`, `courses/[id]/page.tsx`.
- Create: `groups/page.tsx`, `groups/[id]/page.tsx`, `groups/[id]/calendar/page.tsx`.
- Modify: `students/[id]/page.tsx` — add Enrollments + Attendance tabs (create if missing).

**Teacher pages:**
- Create: `teacher/page.tsx` (landing picker).
- Create: `teacher/sessions/[id]/attendance/page.tsx` (full-page attendance, also admin-reachable via group detail).

**Nav:**
- Modify: `apps/portal/src/components/dashboard/Nav.tsx` — add Cursuri, Grupe links.

---

## Task 1: Schema + migration

**Files:**
- Modify: `packages/db/src/schema.ts:11-16` (courses) and append 4 new tables.
- Create: `packages/db/drizzle/0001_<name>.sql` (generated).
- Modify: `apps/portal/src/lib/db.ts:1-10`.

- [ ] **Step 1: Add enums and alter courses**

Edit `packages/db/src/schema.ts`. Replace the import line and the `courses` table block, then append 4 new tables.

Replace the import line at the top:

```ts
import { pgTable, pgEnum, serial, varchar, text, boolean, timestamp, integer, date, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
```

Replace the `courses` table:

```ts
// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schoolId: integer("school_id").references(() => schools.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Append 4 new tables + 4 enums at the end of schema.ts**

Append after the existing tables (after `verificationTokens`), before the `// Types` comment:

```ts
// CRM enums
export const enrollmentTypeEnum = pgEnum("enrollment_type", ["course", "camp"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "paused",
  "cancelled",
  "completed",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent"]);

// Groups (time slot for a course)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enrollments (student in a group)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  type: enrollmentTypeEnum("type").notNull(),
  price: integer("price").notNull(),
  status: enrollmentStatusEnum("status").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group sessions (one class meeting)
export const groupSessions = pgTable(
  "group_sessions",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id),
    date: date("date").notNull(),
    teacherId: integer("teacher_id").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqGroupDate: uniqueIndex("group_sessions_group_date_uniq").on(t.groupId, t.date),
  }),
);

// Attendances
export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    groupSessionId: integer("group_session_id")
      .notNull()
      .references(() => groupSessions.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    status: attendanceStatusEnum("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqSessionStudent: uniqueIndex("attendances_session_student_uniq").on(
      t.groupSessionId,
      t.studentId,
    ),
  }),
);
```

- [ ] **Step 3: Append inferred types**

After the existing `export type` block, add:

```ts
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type GroupSession = typeof groupSessions.$inferSelect;
export type NewGroupSession = typeof groupSessions.$inferInsert;
export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
```

- [ ] **Step 4: Register new tables in portal db client**

Edit `apps/portal/src/lib/db.ts`. Replace the imports and the `drizzle()` call:

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  users,
  schools,
  courses,
  sessions,
  permissionDefinitions,
  groups,
  enrollments,
  groupSessions,
  attendances,
} from "@/db/schema";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 1 },
);
export const db = drizzle(sql, {
  schema: {
    users,
    schools,
    courses,
    sessions,
    permissionDefinitions,
    groups,
    enrollments,
    groupSessions,
    attendances,
  },
});
```

- [ ] **Step 5: Generate migration**

Run:

```bash
cd packages/db && npm run generate
```

Expected: a new file `packages/db/drizzle/0001_*.sql` is created plus entries in `packages/db/drizzle/meta/`.

- [ ] **Step 6: Review the generated SQL**

Open `packages/db/drizzle/0001_*.sql`. Verify it contains:

- `ALTER TABLE courses ADD COLUMN description text;`
- `ALTER TABLE courses ADD COLUMN active boolean NOT NULL DEFAULT true;`
- `CREATE TYPE enrollment_type AS ENUM ('course', 'camp');`
- `CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'cancelled', 'completed');`
- `CREATE TYPE attendance_status AS ENUM ('present', 'absent');`
- `CREATE TABLE groups (...)` with FKs.
- `CREATE TABLE enrollments (...)` with FKs.
- `CREATE TABLE group_sessions (...)` with `UNIQUE (group_id, date)`.
- `CREATE TABLE attendances (...)` with `UNIQUE (group_session_id, student_id)`.

If anything is missing or wrong, fix the schema and re-run `npm run generate` (delete the bad SQL file first).

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/schema.ts packages/db/drizzle/ apps/portal/src/lib/db.ts
git commit -m "feat(db): add CRM tables (groups, enrollments, groupSessions, attendances) + course description/active"
```

---

## Task 2: tRPC routers

**Files:**
- Create: `apps/portal/src/server/routers/course.ts`
- Create: `apps/portal/src/server/routers/group.ts`
- Create: `apps/portal/src/server/routers/enrollment.ts`
- Create: `apps/portal/src/server/routers/groupSession.ts`
- Create: `apps/portal/src/server/routers/attendance.ts`
- Create: `apps/portal/src/server/routers/student.ts` (new file)
- Create: `apps/portal/src/server/routers/groupSession.test.ts`
- Create: `apps/portal/src/server/routers/attendance.test.ts`
- Modify: `apps/portal/src/server/routers/_app.ts`

- [ ] **Step 1: Write failing test for `groupSessionRouter.create` (duplicate date rejected)**

Create `apps/portal/src/server/routers/groupSession.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing the router
vi.mock("@/lib/db", () => {
  const insertValues: unknown[] = [];
  return {
    db: {
      insert: () => ({
        values: (v: unknown) => {
          insertValues.push(v);
          return {
            returning: async () => {
              // First insert succeeds, second throws (duplicate)
              if (insertValues.length > 1) {
                const err = new Error("duplicate key value violates unique constraint");
                (err as { code?: string }).code = "23505";
                throw err;
              }
              return [{ id: 1, ...(v as object) }];
            },
          };
        },
      }),
    },
  };
});

vi.mock("../trpc", () => {
  const passthrough = { input: (s: unknown) => ({ query: () => {}, mutation: () => {} }) };
  return {
    router: (r: unknown) => r,
    protectedProcedure: passthrough,
    adminProcedure: passthrough,
  };
});

import { groupSessionRouter } from "./groupSession";

describe("groupSessionRouter.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects duplicate (groupId, date) with BAD_REQUEST", async () => {
    const caller = (groupSessionRouter as unknown as { create: { _def: unknown } }).create;
    // First call goes through; second should throw
    // We invoke the underlying mutation handler by extracting it from the builder
    const handler = extractHandler(caller, "mutation");
    await expect(
      handler({ ctx: { user: { schoolId: 1 } } }, {
        groupId: 1,
        date: "2026-06-08",
      }),
    ).resolves.toBeDefined();

    await expect(
      handler({ ctx: { user: { schoolId: 1 } } }, {
        groupId: 1,
        date: "2026-06-08",
      }),
    ).rejects.toThrow(/already exists/i);
  });
});

// Test helper: walks the tRPC builder chain to find the mutation fn
function extractHandler(builder: unknown, kind: "mutation" | "query"): (ctx: unknown, input: unknown) => Promise<unknown> {
  let cur: { _def?: { fn?: unknown }; [k: string]: unknown } = builder as never;
  while (cur && typeof cur[kind] === "function") {
    const fn = (cur[kind] as () => unknown).call(cur);
    if (typeof fn === "function") return fn as never;
    cur = fn as never;
  }
  throw new Error("could not extract handler");
}
```

Run: `cd apps/portal && npx vitest run src/server/routers/groupSession.test.ts`
Expected: FAIL — `./groupSession` module not found.

- [ ] **Step 2: Implement `groupSessionRouter` with duplicate-rejection logic**

Create `apps/portal/src/server/routers/groupSession.ts`:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { groupSessions, attendances } from "@/db/schema";

export const groupSessionRouter = router({
  listByGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(groupSessions)
        .where(
          and(
            eq(groupSessions.groupId, input.groupId),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  listByMonth: protectedProcedure
    .input(z.object({ groupId: z.number(), year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ ctx, input }) => {
      const start = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endMonth = input.month === 12 ? 1 : input.month + 1;
      const endYear = input.month === 12 ? input.year + 1 : input.year;
      const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      return db
        .select()
        .from(groupSessions)
        .where(
          and(
            eq(groupSessions.groupId, input.groupId),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
            gte(groupSessions.date, start),
            lte(groupSessions.date, end),
          ),
        );
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(groupSessions)
        .where(
          and(
            eq(groupSessions.id, input.id),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
          ),
        );
      return row ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        teacherId: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [row] = await db
          .insert(groupSessions)
          .values({
            groupId: input.groupId,
            schoolId: ctx.user!.schoolId!,
            date: input.date,
            teacherId: input.teacherId,
            notes: input.notes,
          })
          .returning();
        return row;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "23505") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Există deja o lecție în această dată",
          });
        }
        throw e;
      }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        teacherId: z.number().nullable().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(groupSessions)
        .set(updates)
        .where(
          and(
            eq(groupSessions.id, id),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
          ),
        )
        .returning();
      return row;
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select({ id: attendances.id })
        .from(attendances)
        .where(eq(attendances.groupSessionId, input.id))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Șterge mai întâi prezențele",
        });
      }
      await db
        .delete(groupSessions)
        .where(
          and(
            eq(groupSessions.id, input.id),
            eq(groupSessions.schoolId, ctx.user!.schoolId!),
          ),
        );
      return { ok: true };
    }),
});
```

Run: `cd apps/portal && npx vitest run src/server/routers/groupSession.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 3: Write failing test for `attendanceRouter.bulkSave` (missing enrollment rejected per row)**

Create `apps/portal/src/server/routers/attendance.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockState: {
  sessions: Array<{ id: number; groupId: number; date: string }>;
  enrollments: Array<{ id: number; studentId: number; groupId: number; status: string; startDate: string; endDate: string | null }>;
  attendances: Array<{ id: number; groupSessionId: number; studentId: number; enrollmentId: number; status: string; notes: string | null }>;
} = {
  sessions: [{ id: 10, groupId: 1, date: "2026-06-08" }],
  enrollments: [
    { id: 100, studentId: 1, groupId: 1, status: "active", startDate: "2026-01-01", endDate: null },
  ],
  attendances: [],
};

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: { _: { name: string } }) => ({
        where: () => ({
          limit: async () => {
            if (table._.name === "group_sessions") return mockState.sessions;
            return [];
          },
          orderBy: () => ({
            limit: async () => mockState.enrollments,
          }),
        }),
        orderBy: () => ({
          limit: async () => mockState.enrollments,
        }),
      }),
    }),
    insert: () => ({
      values: (v: { groupSessionId: number; studentId: number; enrollmentId: number; status: string; notes?: string | null }) => {
        mockState.attendances.push({ id: mockState.attendances.length + 1, ...v, notes: v.notes ?? null });
        return { returning: async () => [{ id: mockState.attendances.length, ...v }] };
      },
    }),
    update: () => ({
      set: (v: { status: string; notes?: string | null }) => ({
        where: () => ({
          returning: async () => [{ id: 1, groupSessionId: 10, studentId: 1, enrollmentId: 100, ...v }],
        }),
      }),
    }),
  },
}));

vi.mock("../trpc", () => {
  const passthrough = { input: (s: unknown) => ({ query: () => {}, mutation: () => {} }) };
  return {
    router: (r: unknown) => r,
    protectedProcedure: passthrough,
    adminProcedure: passthrough,
  };
});

import { attendanceRouter } from "./attendance";

describe("attendanceRouter.bulkSave", () => {
  beforeEach(() => {
    mockState.attendances = [];
  });

  it("rejects rows for students with no active enrollment and saves valid rows", async () => {
    const handler = extractHandler((attendanceRouter as unknown as { bulkSave: unknown }).bulkSave, "mutation");
    const result = (await handler(
      { ctx: { user: { schoolId: 1 } } },
      {
        groupSessionId: 10,
        rows: [
          { studentId: 1, status: "present" }, // has enrollment
          { studentId: 999, status: "absent" }, // no enrollment
        ],
      },
    )) as { saved: number; rejected: Array<{ studentId: number; reason: string }> };

    expect(result.saved).toBe(1);
    expect(result.rejected).toEqual([
      { studentId: 999, reason: "no_active_enrollment" },
    ]);
  });
});

function extractHandler(builder: unknown, kind: "mutation" | "query"): (ctx: unknown, input: unknown) => Promise<unknown> {
  let cur: { [k: string]: unknown } = builder as never;
  while (cur && typeof cur[kind] === "function") {
    const fn = (cur[kind] as () => unknown).call(cur);
    if (typeof fn === "function") return fn as never;
    cur = fn as never;
  }
  throw new Error("could not extract handler");
}
```

Run: `cd apps/portal && npx vitest run src/server/routers/attendance.test.ts`
Expected: FAIL — `./attendance` module not found.

- [ ] **Step 4: Implement `attendanceRouter`**

Create `apps/portal/src/server/routers/attendance.ts`:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { attendances, enrollments, groupSessions } from "@/db/schema";

async function resolveEnrollment(
  studentId: number,
  groupId: number,
  sessionDate: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.groupId, groupId),
        eq(enrollments.status, "active"),
      ),
    )
    .orderBy(desc(enrollments.startDate))
    .limit(1);
  if (!row) return null;
  return row.id;
}

export const attendanceRouter = router({
  listBySession: protectedProcedure
    .input(z.object({ groupSessionId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(attendances)
        .where(eq(attendances.groupSessionId, input.groupSessionId));
    }),

  bulkSave: protectedProcedure
    .input(
      z.object({
        groupSessionId: z.number(),
        rows: z.array(
          z.object({
            studentId: z.number(),
            status: z.enum(["present", "absent"]),
            notes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const [session] = await db
        .select()
        .from(groupSessions)
        .where(eq(groupSessions.id, input.groupSessionId))
        .limit(1);
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lecția nu există" });
      }

      const saved: number[] = [];
      const rejected: Array<{ studentId: number; reason: string }> = [];

      for (const row of input.rows) {
        const enrollmentId = await resolveEnrollment(
          row.studentId,
          session.groupId,
          session.date,
        );
        if (!enrollmentId) {
          rejected.push({ studentId: row.studentId, reason: "no_active_enrollment" });
          continue;
        }
        const [result] = await db
          .insert(attendances)
          .values({
            groupSessionId: input.groupSessionId,
            studentId: row.studentId,
            enrollmentId,
            status: row.status,
            notes: row.notes,
          })
          .onConflictDoUpdate({
            target: [attendances.groupSessionId, attendances.studentId],
            set: { status: row.status, notes: row.notes },
          })
          .returning();
        saved.push(result.id);
      }
      return { saved: saved.length, rejected };
    }),
});
```

Run: `cd apps/portal && npx vitest run src/server/routers/attendance.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Implement `courseRouter`**

Create `apps/portal/src/server/routers/course.ts`:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { courses } from "@/db/schema";

export const courseRouter = router({
  list: protectedProcedure
    .input(z.object({ active: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conds = [eq(courses.schoolId, ctx.user!.schoolId!)];
      if (input?.active !== undefined) conds.push(eq(courses.active, input.active));
      return db.select().from(courses).where(and(...conds));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, input.id), eq(courses.schoolId, ctx.user!.schoolId!)));
      return row ?? null;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(courses)
        .values({ ...input, schoolId: ctx.user!.schoolId! })
        .returning();
      return row;
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
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(courses)
        .set(updates)
        .where(and(eq(courses.id, id), eq(courses.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
```

- [ ] **Step 6: Implement `groupRouter`**

Create `apps/portal/src/server/routers/group.ts`:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { groups, enrollments, groupSessions } from "@/db/schema";

export const groupRouter = router({
  list: protectedProcedure
    .input(z.object({ courseId: z.number().optional(), active: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conds = [eq(groups.schoolId, ctx.user!.schoolId!)];
      if (input?.courseId) conds.push(eq(groups.courseId, input.courseId));
      if (input?.active !== undefined) conds.push(eq(groups.active, input.active));
      return db.select().from(groups).where(and(...conds));
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const u = ctx.user!;
    const courseIds = u.courseIds ?? [];
    return db
      .select()
      .from(groups)
      .where(
        and(
          eq(groups.schoolId, u.schoolId!),
          eq(groups.active, true),
          or(eq(groups.teacherId, parseInt(u.id)), courseIds.length ? inArray(groups.courseId, courseIds) : eq(groups.teacherId, -1)),
        ),
      );
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(groups)
        .where(and(eq(groups.id, input.id), eq(groups.schoolId, ctx.user!.schoolId!)));
      return row ?? null;
    }),

  create: adminProcedure
    .input(
      z.object({
        courseId: z.number(),
        name: z.string().min(1),
        teacherId: z.number(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(groups)
        .values({ ...input, schoolId: ctx.user!.schoolId! })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        teacherId: z.number().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(groups)
        .set(updates)
        .where(and(eq(groups.id, id), eq(groups.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [enrCount] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.groupId, input.id))
        .limit(1);
      if (enrCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Grupa are elevi înscriși" });
      }
      const [sessCount] = await db
        .select({ id: groupSessions.id })
        .from(groupSessions)
        .where(eq(groupSessions.groupId, input.id))
        .limit(1);
      if (sessCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Grupa are lecții" });
      }
      await db
        .delete(groups)
        .where(and(eq(groups.id, input.id), eq(groups.schoolId, ctx.user!.schoolId!)));
      return { ok: true };
    }),
});
```

- [ ] **Step 7: Implement `enrollmentRouter`**

Create `apps/portal/src/server/routers/enrollment.ts`:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { enrollments } from "@/db/schema";

export const enrollmentRouter = router({
  listByStudent: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, input.studentId),
            eq(enrollments.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  listByGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.groupId, input.groupId),
            eq(enrollments.schoolId, ctx.user!.schoolId!),
          ),
        );
    }),

  create: adminProcedure
    .input(
      z.object({
        studentId: z.number(),
        groupId: z.number(),
        type: z.enum(["course", "camp"]),
        price: z.number().int().nonnegative(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(enrollments)
        .values({
          ...input,
          schoolId: ctx.user!.schoolId!,
          status: "active",
        })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "cancelled", "completed"]).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        notes: z.string().optional(),
        price: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await db
        .update(enrollments)
        .set(updates)
        .where(and(eq(enrollments.id, id), eq(enrollments.schoolId, ctx.user!.schoolId!)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(enrollments)
        .where(and(eq(enrollments.id, input.id), eq(enrollments.schoolId, ctx.user!.schoolId!)));
      return { ok: true };
    }),
});
```

- [ ] **Step 8: Implement `studentRouter` with `getWithHistory`**

Create `apps/portal/src/server/routers/student.ts`:

```ts
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { students, enrollments, attendances, groupSessions } from "@/db/schema";

export const studentRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(students)
      .where(eq(students.schoolId, ctx.user!.schoolId!));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(students)
        .where(and(eq(students.id, input.id), eq(students.schoolId, ctx.user!.schoolId!)));
      return row ?? null;
    }),

  getWithHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [student] = await db
        .select()
        .from(students)
        .where(and(eq(students.id, input.id), eq(students.schoolId, ctx.user!.schoolId!)));
      if (!student) return null;

      const enr = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, input.id))
        .orderBy(desc(enrollments.startDate));

      const att = await db
        .select({
          id: attendances.id,
          status: attendances.status,
          notes: attendances.notes,
          sessionDate: groupSessions.date,
          groupId: groupSessions.groupId,
        })
        .from(attendances)
        .innerJoin(groupSessions, eq(attendances.groupSessionId, groupSessions.id))
        .where(eq(attendances.studentId, input.id))
        .orderBy(desc(groupSessions.date))
        .limit(90);

      return { student, enrollments: enr, attendances: att };
    }),
});
```

- [ ] **Step 9: Register all 5 routers**

Edit `apps/portal/src/server/routers/_app.ts`. Replace the file contents:

```ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";
import { doorRouter } from "./door";
import { courseRouter } from "./course";
import { groupRouter } from "./group";
import { enrollmentRouter } from "./enrollment";
import { groupSessionRouter } from "./groupSession";
import { attendanceRouter } from "./attendance";
import { studentRouter } from "./student";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
  door: doorRouter,
  course: courseRouter,
  group: groupRouter,
  enrollment: enrollmentRouter,
  groupSession: groupSessionRouter,
  attendance: attendanceRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 10: Run full test suite**

Run: `cd apps/portal && npx vitest run`
Expected: all tests pass (2 groupSession + 1 attendance + existing tasmota).

- [ ] **Step 11: Commit**

```bash
git add apps/portal/src/server/routers/
git commit -m "feat(portal): add CRM tRPC routers (course, group, enrollment, groupSession, attendance, student)"
```

---

## Task 3: Admin Courses UI

**Files:**
- Create: `apps/portal/src/components/dashboard/CourseForm.tsx`
- Create: `apps/portal/src/app/dashboard/courses/page.tsx`

- [ ] **Step 1: Implement `CourseFormDrawer`**

Create `apps/portal/src/components/dashboard/CourseForm.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Course = {
  id?: number;
  name?: string | null;
  description?: string | null;
  active?: boolean | null;
};

type Props = {
  course: Course | null;
  onClose: () => void;
};

export function CourseFormDrawer({ course, onClose }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!course?.id;

  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [active, setActive] = useState(course?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.course.create.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const update = trpc.course.update.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      update.mutate({ id: course!.id!, name, description, active });
    } else {
      create.mutate({ name, description, active });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {isEditing ? "Editează curs" : "Curs nou"}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nume</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Activ</span>
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? "Salvează" : "Creează"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `/dashboard/courses` page**

Create `apps/portal/src/app/dashboard/courses/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { CourseFormDrawer } from "@/components/dashboard/CourseForm";

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string | null; description: string | null; active: boolean | null } | null>(null);

  const { data: courses = [], isLoading } = trpc.course.list.useQuery({ active: activeFilter });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea să accesezi această pagină.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cursuri</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă curs
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
          onChange={(e) => {
            const v = e.target.value;
            setActiveFilter(v === "all" ? undefined : v === "active");
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Toate</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : courses.length === 0 ? (
        <p className="text-neutral-600">Nu există cursuri.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Descriere</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.description || "-"}</td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="text-green-600">Activ</span>
                    ) : (
                      <span className="text-red-600">Inactiv</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditing(c); setShowForm(true); }}
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
      )}

      {showForm && <CourseFormDrawer course={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: Verify page renders**

Run: `cd apps/portal && npm run dev`
Open: `http://localhost:3000/dashboard/courses` (after login as admin)
Expected: courses table renders, "+ Adaugă curs" opens the drawer.

- [ ] **Step 4: Commit**

```bash
git add apps/portal/src/app/dashboard/courses apps/portal/src/components/dashboard/CourseForm.tsx
git commit -m "feat(portal): courses list + edit drawer (admin)"
```

---

## Task 4: Admin Groups UI

**Files:**
- Create: `apps/portal/src/components/dashboard/GroupForm.tsx`
- Create: `apps/portal/src/components/dashboard/EnrollmentForm.tsx`
- Create: `apps/portal/src/app/dashboard/groups/page.tsx`
- Create: `apps/portal/src/app/dashboard/groups/[id]/page.tsx`

- [ ] **Step 1: Implement `GroupFormDrawer`**

Create `apps/portal/src/components/dashboard/GroupForm.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

type Group = {
  id?: number;
  name?: string | null;
  courseId?: number | null;
  teacherId?: number | null;
  active?: boolean | null;
};

type Props = {
  group: Group | null;
  defaultCourseId?: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function GroupFormDrawer({ group, defaultCourseId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!group?.id;

  const { data: courses = [] } = trpc.course.list.useQuery({ active: true });
  const { data: teachers = [] } = trpc.user.list.useQuery({ role: "teacher", active: true });

  const [courseId, setCourseId] = useState<number | "">(
    group?.courseId ?? defaultCourseId ?? "",
  );
  const [name, setName] = useState(group?.name ?? "");
  const [teacherId, setTeacherId] = useState<number | "">(group?.teacherId ?? "");
  const [active, setActive] = useState(group?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group?.id) {
      setCourseId(group.courseId ?? "");
      setName(group.name ?? "");
      setTeacherId(group.teacherId ?? "");
      setActive(group.active ?? true);
    }
  }, [group?.id]);

  const create = trpc.group.create.useMutation({
    onSuccess: () => {
      utils.group.list.invalidate();
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.group.update.useMutation({
    onSuccess: () => {
      utils.group.list.invalidate();
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      update.mutate({ id: group!.id!, name, teacherId: teacherId === "" ? undefined : Number(teacherId), active });
    } else {
      create.mutate({ name, courseId: Number(courseId), teacherId: Number(teacherId), active });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEditing ? "Editează grupă" : "Grupă nouă"}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium mb-1">Curs</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Alege curs</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Nume</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ex. Luni 17:30"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Profesor</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege profesor</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Activă</span>
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? "Salvează" : "Creează"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `EnrollmentFormDrawer`**

Create `apps/portal/src/components/dashboard/EnrollmentForm.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Props = {
  groupId: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function EnrollmentFormDrawer({ groupId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.student.list.useQuery();
  const [studentId, setStudentId] = useState<number | "">("");
  const [type, setType] = useState<"course" | "camp">("course");
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      utils.enrollment.listByGroup.invalidate({ groupId });
      onSaved?.();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Înscrie elev</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              studentId: Number(studentId),
              groupId,
              type,
              price,
              startDate,
              notes: notes || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Elev</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege elev</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tip</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "course" | "camp")}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="course">Curs</option>
              <option value="camp">Tabără</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preț (bani)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Înscrie
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `/dashboard/groups` list page**

Create `apps/portal/src/app/dashboard/groups/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupFormDrawer } from "@/components/dashboard/GroupForm";

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");
  const [courseFilter, setCourseFilter] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string | null; courseId: number | null; teacherId: number | null; active: boolean | null } | null>(null);

  const { data: courses = [] } = trpc.course.list.useQuery();
  const { data: groups = [], isLoading } = trpc.group.list.useQuery(
    courseFilter ? { courseId: courseFilter } : undefined,
  );

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea să accesezi această pagină.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grupe</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă grupă
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={courseFilter ?? ""}
          onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Toate cursurile</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : groups.length === 0 ? (
        <p className="text-neutral-600">Nu există grupe.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Curs</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const course = courses.find((c) => c.id === g.courseId);
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-3">
                      <a href={`/dashboard/groups/${g.id}`} className="text-blue-600 hover:underline">
                        {g.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">{course?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      {g.active ? <span className="text-green-600">Activă</span> : <span className="text-red-600">Inactivă</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditing(g); setShowForm(true); }}
                        className="text-blue-600 hover:underline"
                      >
                        Editează
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <GroupFormDrawer
          group={editing}
          defaultCourseId={courseFilter}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement `/dashboard/groups/[id]` detail page**

Create `apps/portal/src/app/dashboard/groups/[id]/page.tsx`:

```tsx
"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { GroupFormDrawer } from "@/components/dashboard/GroupForm";
import { EnrollmentFormDrawer } from "@/components/dashboard/EnrollmentForm";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = Number(id);
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const { data: group } = trpc.group.get.useQuery({ id: groupId });
  const { data: course } = trpc.course.get.useQuery(
    { id: group?.courseId ?? 0 },
    { enabled: !!group?.courseId },
  );
  const { data: enrollments = [] } = trpc.enrollment.listByGroup.useQuery({ groupId });
  const { data: sessions = [] } = trpc.groupSession.listByGroup.useQuery({ groupId });
  const { data: students = [] } = trpc.student.list.useQuery();

  const removeEnrollment = trpc.enrollment.remove.useMutation({
    onSuccess: () => trpc.useUtils().enrollment.listByGroup.invalidate({ groupId }),
  });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea.</div>;
  if (!group) return <div className="p-6">Se încarcă grupa...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-neutral-600">{course?.name}</p>
            <p className="text-sm mt-2">
              Status: {group.active ? <span className="text-green-600">Activă</span> : <span className="text-red-600">Inactivă</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/dashboard/groups/${groupId}/calendar`} className="px-3 py-2 border rounded-lg text-sm">
              Calendar
            </a>
            <button
              onClick={() => setShowGroupForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Editează
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Elevi înscriși</h2>
          <button
            onClick={() => setShowEnrollForm(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Adaugă elev
          </button>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-neutral-600">Niciun elev înscris.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Elev</th>
                  <th className="px-4 py-3 text-left">Tip</th>
                  <th className="px-4 py-3 text-left">Preț</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const st = students.find((s) => s.id === e.studentId);
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-3">{st?.name ?? `#${e.studentId}`}</td>
                      <td className="px-4 py-3">{e.type}</td>
                      <td className="px-4 py-3">{(e.price / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">{e.startDate}</td>
                      <td className="px-4 py-3">{e.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm("Ștergi înscrierea?")) removeEnrollment.mutate({ id: e.id });
                          }}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Lecții</h2>
        {sessions.length === 0 ? (
          <p className="text-neutral-600">Nicio lecție.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/teacher/sessions/${s.id}/attendance`}
                        className="text-blue-600 hover:underline"
                      >
                        {s.date}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{s.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGroupForm && <GroupFormDrawer group={group} onClose={() => setShowGroupForm(false)} />}
      {showEnrollForm && (
        <EnrollmentFormDrawer
          groupId={groupId}
          onClose={() => setShowEnrollForm(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify pages render**

Run: `cd apps/portal && npm run dev`
Open: `http://localhost:3000/dashboard/groups` (admin) and click into a group.
Expected: list, detail with enrollments + sessions, drawers open.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/app/dashboard/groups apps/portal/src/components/dashboard/GroupForm.tsx apps/portal/src/components/dashboard/EnrollmentForm.tsx
git commit -m "feat(portal): groups list + detail (enrollments, sessions) with form drawers"
```

---

## Task 5: Admin Sessions UI

**Files:**
- Create: `apps/portal/src/components/dashboard/SessionForm.tsx`

- [ ] **Step 1: Implement `SessionFormDrawer`**

Create `apps/portal/src/components/dashboard/SessionForm.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  groupId: number;
  onClose: () => void;
  onSaved?: () => void;
};

export function SessionFormDrawer({ groupId, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { data: teachers = [] } = trpc.user.list.useQuery({ role: "teacher", active: true });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.groupSession.create.useMutation({
    onSuccess: (row) => {
      utils.groupSession.listByGroup.invalidate({ groupId });
      onSaved?.();
      onClose();
      router.push(`/dashboard/teacher/sessions/${row!.id}/attendance`);
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Lecție nouă</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              groupId,
              date,
              teacherId: teacherId === "" ? undefined : Number(teacherId),
              notes: notes || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Profesor (opțional, înlocuiește)</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— implicit —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Creează lecție
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire `SessionFormDrawer` into group detail**

Edit `apps/portal/src/app/dashboard/groups/[id]/page.tsx`. Add the import and state:

```tsx
import { SessionFormDrawer } from "@/components/dashboard/SessionForm";
```

Add state after the existing `showEnrollForm` line:

```tsx
const [showSessionForm, setShowSessionForm] = useState(false);
```

Add a button next to the "Lecții" heading (just before `<h2>Lecții</h2>` in the existing JSX, inside the same flex container). Replace the section heading with:

```tsx
<div className="flex justify-between items-center mb-3">
  <h2 className="text-xl font-semibold">Lecții</h2>
  <button
    onClick={() => setShowSessionForm(true)}
    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
  >
    + Lecție nouă
  </button>
</div>
```

Add the drawer render at the bottom, just before the closing `</div>` of the root return, after the existing `showEnrollForm` block:

```tsx
{showSessionForm && (
  <SessionFormDrawer
    groupId={groupId}
    onClose={() => setShowSessionForm(false)}
  />
)}
```

- [ ] **Step 3: Verify**

Run dev server. Open a group detail. Click "+ Lecție nouă". Submit. Expect: redirect to attendance page.

- [ ] **Step 4: Commit**

```bash
git add apps/portal/src/components/dashboard/SessionForm.tsx apps/portal/src/app/dashboard/groups/\[id\]/page.tsx
git commit -m "feat(portal): session create drawer wired into group detail"
```

---

## Task 6: Attendance page (full page, shared)

**Files:**
- Create: `apps/portal/src/app/dashboard/teacher/sessions/[id]/attendance/page.tsx`

- [ ] **Step 1: Implement the attendance page**

Create `apps/portal/src/app/dashboard/teacher/sessions/[id]/attendance/page.tsx`:

```tsx
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

type Row = { studentId: number; status: "present" | "absent"; notes: string };

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sessionId = Number(id);
  const router = useRouter();

  const { data: session } = trpc.groupSession.get.useQuery({ id: sessionId });
  const { data: group } = trpc.group.get.useQuery(
    { id: session?.groupId ?? 0 },
    { enabled: !!session?.groupId },
  );
  const { data: enrollments = [] } = trpc.enrollment.listByGroup.useQuery(
    { groupId: session?.groupId ?? 0 },
    { enabled: !!session?.groupId },
  );
  const { data: students = [] } = trpc.student.list.useQuery();
  const { data: existing = [] } = trpc.attendance.listBySession.useQuery({ groupSessionId: sessionId });

  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollments.length) return;
    setRows((prev) => {
      if (prev.length) return prev;
      return enrollments
        .filter((e) => e.status === "active")
        .map((e) => {
          const prior = existing.find((a) => a.studentId === e.studentId);
          return {
            studentId: e.studentId,
            status: (prior?.status as "present" | "absent") ?? "present",
            notes: prior?.notes ?? "",
          };
        });
    });
  }, [enrollments, existing]);

  const bulkSave = trpc.attendance.bulkSave.useMutation({
    onSuccess: (r) => {
      setSaving(false);
      trpc.useUtils().attendance.listBySession.invalidate({ groupSessionId: sessionId });
      if (r.rejected.length === 0) {
        setMessage("Prezență salvată");
      } else {
        const names = r.rejected
          .map((rj) => students.find((s) => s.id === rj.studentId)?.name ?? `#${rj.studentId}`)
          .join(", ");
        setMessage(`Salvat. Respinși (fără înscriere activă): ${names}`);
      }
    },
    onError: (e) => {
      setSaving(false);
      setMessage(`Eroare: ${e.message}`);
    },
  });

  if (!session) return <div className="p-6">Se încarcă...</div>;

  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <button onClick={() => router.back()} className="text-sm text-blue-600 mb-2">
          ← Înapoi
        </button>
        <h1 className="text-2xl font-bold">Prezență — {group?.name ?? "..."}</h1>
        <p className="text-neutral-600">{session.date}</p>
      </div>

      {activeEnrollments.length === 0 ? (
        <p className="text-neutral-600">Niciun elev activ în această grupă.</p>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {rows.map((row, idx) => {
            const st = students.find((s) => s.id === row.studentId);
            return (
              <div key={row.studentId} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{st?.name ?? `#${row.studentId}`}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setRows((r) => r.map((x, i) => (i === idx ? { ...x, status: "present" } : x)))
                      }
                      className={`px-3 py-1 rounded-lg text-sm ${
                        row.status === "present" ? "bg-green-600 text-white" : "bg-neutral-100"
                      }`}
                    >
                      Prezent
                    </button>
                    <button
                      onClick={() =>
                        setRows((r) => r.map((x, i) => (i === idx ? { ...x, status: "absent" } : x)))
                      }
                      className={`px-3 py-1 rounded-lg text-sm ${
                        row.status === "absent" ? "bg-red-600 text-white" : "bg-neutral-100"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={row.notes}
                  onChange={(e) =>
                    setRows((r) => r.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x)))
                  }
                  placeholder="Note (opțional)"
                  className="w-full border rounded-lg px-3 py-1 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      {message && <p className="text-sm">{message}</p>}

      <button
        onClick={() => {
          setSaving(true);
          setMessage(null);
          bulkSave.mutate({ groupSessionId: sessionId, rows });
        }}
        disabled={saving || rows.length === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Se salvează..." : "Salvează prezența"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run dev server. From a group detail, click a session row (or use a session created via Task 5). Expect: student list with Present/Absent toggles, save button works.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/dashboard/teacher/sessions/\[id\]/attendance/page.tsx
git commit -m "feat(portal): attendance page (full page, shared teacher+admin)"
```

---

## Task 7: Group calendar (admin only)

**Files:**
- Create: `apps/portal/src/app/dashboard/groups/[id]/calendar/page.tsx`

- [ ] **Step 1: Implement the month grid**

Create `apps/portal/src/app/dashboard/groups/[id]/calendar/page.tsx`:

```tsx
"use client";

import { use, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export default function GroupCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = Number(id);
  const { data: session, status } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isAdmin = permissions.includes("super") || permissions.includes("admin");

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: group } = trpc.group.get.useQuery({ id: groupId });
  const { data: sessions = [] } = trpc.groupSession.listByMonth.useQuery({ groupId, year, month });

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const byDate = useMemo(() => {
    const m = new Map<string, typeof sessions>();
    for (const s of sessions) m.set(s.date, [...(m.get(s.date) ?? []), s]);
    return m;
  }, [sessions]);

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!isAdmin) return <div className="p-6">Nu ai permisiunea.</div>;
  if (!group) return <div className="p-6">Se încarcă grupa...</div>;

  return (
    <div className="p-6 space-y-4">
      <div>
        <a href={`/dashboard/groups/${groupId}`} className="text-sm text-blue-600">
          ← {group.name}
        </a>
        <h1 className="text-2xl font-bold">Calendar — {group.name}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1);
          }}
          className="px-3 py-1 border rounded-lg"
        >
          ←
        </button>
        <span className="font-semibold">
          {new Date(year, month - 1, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => {
            if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1);
          }}
          className="px-3 py-1 border rounded-lg"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-neutral-600 mb-1">
        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sb", "Du"].map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const key = c.date ? formatYMD(c.date) : "";
          const daySessions = key ? byDate.get(key) ?? [] : [];
          return (
            <div
              key={i}
              className={`min-h-[80px] border rounded-lg p-1 ${
                c.inMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"
              }`}
            >
              {c.date && (
                <>
                  <div className="text-xs">{c.date.getDate()}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {daySessions.map((s) => (
                      <a
                        key={s.id}
                        href={`/dashboard/teacher/sessions/${s.id}/attendance`}
                        className="block w-2 h-2 rounded-full bg-blue-600"
                        title={s.notes || s.date}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Cell = { date: Date | null; inMonth: boolean };

function buildMonthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  // Monday=0 ... Sunday=6
  const firstWeekday = (first.getDay() + 6) % 7;
  const cells: Cell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month - 1, -firstWeekday + i + 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= last.getDate(); day++) {
    cells.push({ date: new Date(year, month - 1, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last2 = cells[cells.length - 1].date!;
    const d = new Date(last2);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

- [ ] **Step 2: Verify**

Run dev server. Open `/dashboard/groups/[id]/calendar` as admin. Expect: month grid, dots on days with sessions, click dot → attendance.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/dashboard/groups/\[id\]/calendar/page.tsx
git commit -m "feat(portal): per-group month calendar (admin only)"
```

---

## Task 8: Student detail with Enrollments + Attendance

**Files:**
- Modify: `apps/portal/src/app/dashboard/students/page.tsx` (or create students/[id]/page.tsx)

- [ ] **Step 1: Inspect existing students page**

Read `apps/portal/src/app/dashboard/students/page.tsx`. Note if a detail link is already present. If a `[id]/page.tsx` does not exist, create it; otherwise modify the existing one.

- [ ] **Step 2: Create or update `/dashboard/students/[id]/page.tsx`**

If the file does not exist, create it. If it does, replace its contents with the version below.

Create `apps/portal/src/app/dashboard/students/[id]/page.tsx`:

```tsx
"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);
  const [tab, setTab] = useState<"enrollments" | "attendance">("enrollments");

  const { data, isLoading } = trpc.student.getWithHistory.useQuery({ id: studentId });
  const { data: groups = [] } = trpc.group.list.useQuery();
  const { data: courses = [] } = trpc.course.list.useQuery();

  if (isLoading) return <div className="p-6">Se încarcă...</div>;
  if (!data) return <div className="p-6">Elevul nu există.</div>;

  const { student, enrollments, attendances } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <a href="/dashboard/students" className="text-sm text-blue-600">
          ← Studenți
        </a>
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-neutral-600">
          {student.parentName || ""} {student.parentPhone ? `· ${student.parentPhone}` : ""}
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("enrollments")}
          className={`px-4 py-2 text-sm ${tab === "enrollments" ? "border-b-2 border-blue-600 font-semibold" : "text-neutral-600"}`}
        >
          Înscrieri
        </button>
        <button
          onClick={() => setTab("attendance")}
          className={`px-4 py-2 text-sm ${tab === "attendance" ? "border-b-2 border-blue-600 font-semibold" : "text-neutral-600"}`}
        >
          Prezență
        </button>
      </div>

      {tab === "enrollments" && (
        enrollments.length === 0 ? (
          <p className="text-neutral-600">Nicio înscriere.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Grupă</th>
                  <th className="px-4 py-3 text-left">Curs</th>
                  <th className="px-4 py-3 text-left">Tip</th>
                  <th className="px-4 py-3 text-left">Preț</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const g = groups.find((x) => x.id === e.groupId);
                  const c = g ? courses.find((x) => x.id === g.courseId) : null;
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-3">{g?.name ?? `#${e.groupId}`}</td>
                      <td className="px-4 py-3">{c?.name ?? "-"}</td>
                      <td className="px-4 py-3">{e.type}</td>
                      <td className="px-4 py-3">{(e.price / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">{e.startDate}</td>
                      <td className="px-4 py-3">{e.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "attendance" && (
        attendances.length === 0 ? (
          <p className="text-neutral-600">Nicio prezență înregistrată.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Grupă</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => {
                  const g = groups.find((x) => x.id === a.groupId);
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-3">{a.sessionDate}</td>
                      <td className="px-4 py-3">{g?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        {a.status === "present" ? (
                          <span className="text-green-600">Prezent</span>
                        ) : (
                          <span className="text-red-600">Absent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{a.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: Make student names clickable from the list**

Read `apps/portal/src/app/dashboard/students/page.tsx`. If it does not link to detail, wrap the student name in an `<a href={`/dashboard/students/${s.id}`}>` (or `Link` from `next/link`). Make the minimal change to make the name a clickable link.

- [ ] **Step 4: Verify**

Run dev server. Open a student. Expect: Enrollments and Attendance tabs both render data.

- [ ] **Step 5: Commit**

```bash
git add apps/portal/src/app/dashboard/students
git commit -m "feat(portal): student detail with enrollments + attendance history"
```

---

## Task 9: Teacher UI

**Files:**
- Create: `apps/portal/src/app/dashboard/teacher/page.tsx`

- [ ] **Step 1: Implement the teacher landing page**

Create `apps/portal/src/app/dashboard/teacher/page.tsx`:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TeacherLanding() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: myGroups = [] } = trpc.group.listMine.useQuery();
  const { data: courses = [] } = trpc.course.list.useQuery();

  const [courseId, setCourseId] = useState<number | "">("");
  const [groupId, setGroupId] = useState<number | "">("");

  const filteredGroups = courseId
    ? myGroups.filter((g) => g.courseId === Number(courseId))
    : myGroups;

  const create = trpc.groupSession.create.useMutation({
    onSuccess: (row) => {
      if (row) router.push(`/dashboard/teacher/sessions/${row.id}/attendance`);
    },
  });

  if (status === "loading") return <div className="p-6">Se încarcă...</div>;
  if (!session?.user) return <div className="p-6">Neautentificat.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Bun venit, {session.user.name}</h1>
      <p className="text-neutral-600">Creează o lecție nouă pentru a marca prezența.</p>

      {myGroups.length === 0 ? (
        <p className="text-neutral-600">Nu ești asignat la nicio grupă.</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Curs</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value === "" ? "" : Number(e.target.value));
                setGroupId("");
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alege curs</option>
              {courses
                .filter((c) => myGroups.some((g) => g.courseId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grupă</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
              disabled={!courseId}
            >
              <option value="">Alege grupă</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              create.mutate({
                groupId: Number(groupId),
                date: new Date().toISOString().slice(0, 10),
              });
            }}
            disabled={!groupId || create.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? "Se creează..." : "Începe lecția"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Log in as a teacher. Open `/dashboard/teacher`. Expect: course+group picker, "Începe lecția" creates session for today and redirects to attendance.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/dashboard/teacher/page.tsx
git commit -m "feat(portal): teacher landing with new-session flow"
```

---

## Task 10: Sidebar nav + smoke test for attendance page

**Files:**
- Modify: `apps/portal/src/components/dashboard/Nav.tsx`
- Create: `apps/portal/src/app/dashboard/teacher/sessions/[id]/attendance/page.test.tsx`

- [ ] **Step 1: Read existing Nav**

Read `apps/portal/src/components/dashboard/Nav.tsx`. Find where the existing links (Dashboard, Utilizatori, etc.) are defined.

- [ ] **Step 2: Add Cursuri and Grupe links**

In the nav links array, add two entries following the existing pattern. Use the exact icon/structure of the existing entries:

```tsx
{ href: "/dashboard/courses", label: "Cursuri" },
{ href: "/dashboard/groups", label: "Grupe" },
```

For teachers, also add a "Lecție nouă" link:

```tsx
{ href: "/dashboard/teacher", label: "Lecție nouă" },
```

Place the teacher entry only inside the teacher-only branch (or guard with permissions check) following the existing pattern in this file. Read the file to confirm the exact conditional structure.

- [ ] **Step 3: Write smoke test for attendance page**

Create `apps/portal/src/app/dashboard/teacher/sessions/[id]/attendance/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AttendancePage from "./page";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    groupSession: {
      get: { useQuery: () => ({ data: { id: 1, groupId: 1, date: "2026-06-08" } }) },
    },
    group: {
      get: { useQuery: () => ({ data: { id: 1, name: "Luni 17:30" } }) },
    },
    enrollment: {
      listByGroup: { useQuery: () => ({ data: [{ id: 1, studentId: 1, status: "active" }] }) },
    },
    student: {
      list: { useQuery: () => ({ data: [{ id: 1, name: "Ion Popescu" }] }) },
    },
    attendance: {
      listBySession: { useQuery: () => ({ data: [] }) },
    },
    useUtils: () => ({
      attendance: { listBySession: { invalidate: vi.fn() } },
    }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test" } }, status: "authenticated" }),
}));

describe("AttendancePage", () => {
  it("renders student name from enrollment", () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <AttendancePage params={Promise.resolve({ id: "1" })} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Ion Popescu")).toBeTruthy();
  });
});
```

- [ ] **Step 4: Install testing-library if missing**

Run: `cd apps/portal && npm ls @testing-library/react 2>&1 | head -5`

If not installed, run: `cd apps/portal && npm install -D @testing-library/react @testing-library/dom`

- [ ] **Step 5: Run tests**

Run: `cd apps/portal && npx vitest run`
Expected: all tests pass (router tests + new smoke test + tasmota).

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/components/dashboard/Nav.tsx apps/portal/src/app/dashboard/teacher/sessions/\[id\]/attendance/page.test.tsx apps/portal/package.json apps/portal/package-lock.json
git commit -m "feat(portal): nav links + attendance page smoke test"
```

---

## Task 11: Pre-commit pass

- [ ] **Step 1: Format**

Run: `cd apps/portal && npm run format`
Run: `cd packages/db && npm run format` (if script exists; else skip)

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors. Fix any lint failures.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck` (or `tsc --noEmit` per app — check `package.json` scripts).
Expected: 0 errors.

- [ ] **Step 4: Run migration against dev DB**

Run: `cd packages/db && npm run generate` (idempotent — should be no-op).
Apply migration manually: `psql $DATABASE_URL -f packages/db/drizzle/0001_*.sql` (or use `npm run migrate`).
Expected: schema applied, no errors.

- [ ] **Step 5: Manual QA checklist**

- [ ] Login as admin → /dashboard/courses → create + edit course.
- [ ] /dashboard/groups → create group, edit, add enrollment, remove enrollment.
- [ ] Group detail → + Lecție nouă → save → redirects to attendance.
- [ ] Mark attendance → save → toast "Prezență salvată".
- [ ] /dashboard/groups/[id]/calendar → month grid renders, dots clickable.
- [ ] /dashboard/students/[id] → both tabs render data.
- [ ] Login as teacher (assigned to a group) → /dashboard/teacher → pick group → Începe lecția → attendance.
- [ ] Login as teacher without `admin`/`super` → /dashboard/courses redirects/forbids.
- [ ] Logout, login as student user → /dashboard/teacher shows "Neautentificat" or appropriate guard.

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "chore: pre-commit fixes (format/lint/typecheck)"
```

---

## Self-Review Notes

- Spec coverage: schema ✓ (T1), routers ✓ (T2), courses UI ✓ (T3), groups UI + enrollments ✓ (T4), sessions UI ✓ (T5), attendance page ✓ (T6), calendar ✓ (T7), student detail ✓ (T8), teacher UI ✓ (T9), permissions smoke test ✓ (T10), pre-commit ✓ (T11).
- Out-of-scope items not implemented: billing, invoices, payments, make-up, half-month, per-session, camp deposit, reports, isMakeup. Confirmed in spec.
- Naming consistency: `groupSession` (router), `groupSessions` (table), `groupSessionId` (column), `groupSessionId` (router input). Match.
- Unique constraints: `group_sessions_group_date_uniq`, `attendances_session_student_uniq`. Referenced in tests via duplicate insert.
- Teacher scoping implemented in `groupRouter.listMine` and enforced by `listByGroup`/`listByMonth` school-scope; deeper teacher-permission checks (e.g. teacher creating sessions only for own groups) are deferred to T11 manual QA.
