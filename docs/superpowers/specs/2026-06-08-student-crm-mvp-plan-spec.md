# Student CRM MVP — Implementation Plan Spec

## Context

Two related specs exist:

- `2026-05-29-student-crm-mvp.md` — thin MVP (registration + attendance only).
- `2026-05-29-student-crm-enrollment-billing-design.md` — full design including billing.

This spec is the **striped build** of the MVP only. Billing, invoices, payments, make-up tracking, and pause/cancel UI are explicitly deferred to a follow-up spec (the full design above, with a future date). Scope: registration + attendance, 4 new tables, 2 altered.

Repository state: monorepo (`apps/landing`, `apps/portal`, `apps/learn`, `packages/db`, `packages/auth`, `packages/ui`). Portal uses tRPC v11 + Drizzle + Auth.js v5 + Tailwind 3. AGENTS.md mandates Drizzle migrations (`drizzle-kit generate`) for any schema change, overriding the current `drizzle-kit push` dev practice.

Naming note: Auth.js owns a `sessions` table. The CRM "session" (a single class meeting) is renamed to `groupSession` in DB and `groupSession` in code to avoid collision.

## Decisions

| Decision            | Value                                                        |
| ------------------- | ------------------------------------------------------------ |
| Build order         | Bottom-up: schema → routers → UI                             |
| Schema              | Drizzle, generate migration, commit SQL                      |
| No schedule pattern | Teacher creates each session manually per lesson             |
| Group model         | Minimal: courseId, name, teacherId, active                   |
| Session table       | `groupSessions` (rename for Auth.js collision)               |
| Attendance resolve  | Latest active enrollment for (student, group, session.date)  |
| Billing             | Deferred to follow-up spec                                    |
| Tests               | Vitest unit tests for routers; page smoke tests               |
| UI convention       | Right-side `*FormDrawer` overlay (existing user pattern)     |
| Calendar            | Per-group month grid, admin/superadmin only                   |

## Schema

### Alter existing

**courses** — add `description text`, `active boolean NOT NULL DEFAULT true`.

### New tables

All tables include `createdAt timestamp DEFAULT now()`. All FKs to `schools` and other tables are `integer NOT NULL REFERENCES ...` unless marked nullable.

#### groups

A time slot + teacher for a course. Display name like "Mon 17:30".

| Column    | Type                  | Notes                          |
| --------- | --------------------- | ------------------------------ |
| id        | serial PK             |                                |
| courseId  | int NOT NULL FK→courses |                              |
| schoolId  | int NOT NULL FK→schools  |                              |
| name      | varchar(255) NOT NULL |                                |
| teacherId | int NOT NULL FK→users    | Default teacher              |
| active    | boolean NOT NULL DEFAULT true |                         |

#### enrollments

A student's subscription to a group. One student may have multiple enrollments in the same group over time (transfers, re-enrolls); the "current" one is resolved by date.

| Column    | Type                       | Notes                                  |
| --------- | -------------------------- | -------------------------------------- |
| id        | serial PK                  |                                        |
| studentId | int NOT NULL FK→students   |                                        |
| groupId   | int NOT NULL FK→groups     |                                        |
| schoolId  | int NOT NULL FK→schools    |                                        |
| type      | enum NOT NULL              | `course` \| `camp`                     |
| price     | int NOT NULL               | Cents; per-student, supports discounts |
| status    | enum NOT NULL              | `active` \| `paused` \| `cancelled` \| `completed` |
| startDate | date NOT NULL              |                                        |
| endDate   | date NULL                  | Nullable; set on completion/cancel     |
| notes     | text                       |                                        |

#### groupSessions

A single class meeting. Created by teacher (or admin) per lesson.

| Column    | Type                    | Notes                                      |
| --------- | ----------------------- | ------------------------------------------ |
| id        | serial PK               |                                            |
| groupId   | int NOT NULL FK→groups  |                                            |
| schoolId  | int NOT NULL FK→schools |                                            |
| date      | date NOT NULL           |                                            |
| teacherId | int NULL FK→users       | Override; null = use `groups.teacherId`    |
| notes     | text                    |                                            |

Unique: `(groupId, date)` — one session per group per day.

#### attendances

Per-student per-session presence record.

| Column         | Type                       | Notes                                              |
| -------------- | -------------------------- | -------------------------------------------------- |
| id             | serial PK                  |                                                    |
| groupSessionId | int NOT NULL FK→groupSessions |                                                |
| studentId      | int NOT NULL FK→students   |                                                    |
| enrollmentId   | int NOT NULL FK→enrollments | Resolved at write time by `attendanceRouter`     |
| status         | enum NOT NULL              | `present` \| `absent`                              |
| notes          | text                       |                                                    |

Unique: `(groupSessionId, studentId)` — one row per student per session.

## Relationships

```
Student ──1:N──► Enrollment ──M:1──► Group ──M:1──► Course
                                            │
                                            └──1:N──► GroupSession ──1:N──► Attendance
                                                                          │
                                                                          └──M:1──► Student
                                                                          └──M:1──► Enrollment (resolved)
```

Teacher assignment:

- `users.courseIds` (existing): can teach this course.
- `groups.teacherId`: default teacher.
- `groupSessions.teacherId`: actual teacher (nullable override for substitutes).

## tRPC Routers

All procedures: `protectedProcedure`. School scoping: every read/write filters by `ctx.schoolId` (single-school app; `ctx.schoolId` already exists in auth). Teacher scoping: see Permissions.

- **courseRouter**: `list`, `get`, `create`, `update` (name/description/active), `setActive`.
- **groupRouter**: `list` (filter by courseId/active), `get`, `create`, `update`, `setActive`, `listMine` (teacher — only groups I teach).
- **enrollmentRouter**: `listByStudent`, `listByGroup`, `get`, `create`, `update`, `remove`.
- **groupSessionRouter**: `listByGroup`, `listByMonth(groupId, year, month)`, `get`, `create`, `update` (notes/teacher override), `remove` (rejects if any attendance exists).
- **attendanceRouter**: `listBySession`, `bulkSave({ groupSessionId, rows: [{studentId, status, notes}] })`. Internally:
  - Loads session for date + group.
  - For each row, resolves `enrollmentId` via `resolveEnrollment(studentId, groupId, session.date)`. If none, the row is rejected with the student name; other rows still save.
  - Upserts on `(groupSessionId, studentId)`.
- **studentRouter** (extend existing): `getWithHistory(id)` — returns student + active enrollments + last 30 attendance rows.

## Permissions

Reuse existing `users.permissions` array and `users.courseIds`.

- **superadmin / admin**: full CRUD on courses, groups, enrollments, groupSessions, attendance. Sees all groups.
- **teacher**:
  - Read groups where `groups.teacherId = me` OR `users.courseIds` includes `groups.courseId`.
  - Create `groupSessions` for those groups.
  - Read/write `attendances` for own groupSessions.
  - No access to courses CRUD, no access to other teachers' groups.
  - No calendar access.
- Enforced in procedures (queries filtered by `teacherId = ctx.userId OR courseId IN ctx.courseIds` for teacher role) and at the page level (server component redirects if unauthorized).
- Page-level access check follows existing `users/page.tsx` pattern: read session, check permissions array, render "Nu ai permisiunea..." or redirect.

## UI (apps/portal/src/app/dashboard/, mobile-first, Romanian)

Drawer convention: `components/dashboard/*FormDrawer.tsx` (right-side overlay), matching `UserFormDrawer`. Lists use the same mobile-card + desktop-table split as `users/page.tsx`.

### Sidebar nav additions

Add to existing nav: **Cursuri**, **Grupe**. Studenți already exists. Calendar lives per-group (no top-level entry). Teacher landing lives at `/dashboard/teacher`.

### Admin pages

- `/dashboard/courses` — list (filter active) + `CourseFormDrawer` for create/edit (name, description, active).
- `/dashboard/courses/[id]` — course detail: info + its groups list. Groups have inline "Editează" → `GroupFormDrawer` (or jump to `/dashboard/groups/[id]`).
- `/dashboard/groups` — list (filter by course).
- `/dashboard/groups/[id]` — group detail: info card, **Enrollments** table with "Adaugă elev" → `EnrollmentFormDrawer` (student picker, type, price, startDate, notes), each row removable. **Sessions** table listing past sessions with attendance count.
- `/dashboard/groups/[id]/calendar` — **admin only**. Month grid scoped to this group; each day with a session is a clickable dot; click → day drawer listing sessions → click session → attendance page. Server-rendered for current month; client nav for prev/next.
- `/dashboard/groups/[id]/sessions/new` — `SessionFormDrawer` triggered from group detail (date picker, optional teacher override, notes).
- `/dashboard/students/[id]` — extend existing: tabs **Enrollments** (active + history with status) and **Attendance** (chronological list, last 90 days).

### Teacher pages (`/dashboard/teacher/*`)

- `/dashboard/teacher` — landing: "Creează lecție nouă" form. Course select (filtered to `courseIds`), then Group select (filtered to my groups for that course), then "Începe lecția" button. On submit: create `groupSession` for today (or chosen date) and redirect to its attendance page.
- `/dashboard/teacher/sessions/[id]/attendance` — student list with present/absent toggle per row, optional notes per row, "Salvează" button. Reachable by admin too via group detail.

### Attendance page (shared, full page or large modal)

Since the list of students can be long, use a full page route (not a drawer) for attendance. Teacher and admin both land here. After save, show toast "Prezență salvată".

## Error Handling

| Scenario                              | Handling                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| Attendance for student with no active enrollment | Row rejected; toast lists rejected students; other rows save  |
| Create session with duplicate (group, date) | Reject with "Există deja o lecție în această dată"         |
| Delete session with existing attendance | Reject with "Șterge mai întâi prezențele (N)"               |
| Delete group with enrollments/sessions | Reject with counts                                            |
| Teacher creates session for other teacher's group | 403 from procedure; UI hides the action                  |
| tRPC error on save                    | Toast in Romanian with the server message                    |

## Testing

Vitest (already configured for `tasmota.test.ts` pattern). Per AGENTS.md, TDD for non-trivial logic.

- `attendanceRouter.bulkSave` — happy path; missing enrollment rejected per row; paused enrollment rejected; re-save updates existing rows.
- `enrollmentRouter.create` — active enrollment created; multiple allowed; status defaults to `active`.
- `groupSessionRouter.create` — duplicate (group, date) rejected; teacher can only create for groups they teach.
- `groupSessionRouter.remove` — rejects when attendance exists; allows when none.
- Page smoke tests: render `/dashboard/teacher/sessions/[id]/attendance` with mock tRPC data; assert student rows + save button.

## Out of Scope (deferred to follow-up spec)

Billing, invoices, payments, make-up tracking, pause/cancel UI, half-month pricing, per-session billing, camp deposit/remainder, reports, `isMakeup`/`makeupForAttendanceId` on attendances, `BillingCredit`, parent/student portal, online payment, SMS/WhatsApp, email invoices, audit trail, RLS, auto-cron session generation, batch attendance, multi-school admin, CoursePricing table, InvoiceLineItem table, Payment table.

## Build Order (steps)

Each step is shippable + testable independently. TDD where logic is non-trivial.

1. **Schema + migration** — add 4 tables, alter `courses`, generate Drizzle migration, review SQL, commit.
2. **tRPC routers** — all 5 routers + extend `studentRouter`. Unit tests for `bulkSave`, `groupSession.create` (duplicate), `groupSession.remove` (with attendance). Register in `_app.ts`.
3. **Admin: Courses UI** — `/dashboard/courses` + `CourseFormDrawer` (right-slide).
4. **Admin: Groups UI** — `/dashboard/groups` + group detail with inline `GroupFormDrawer` + `EnrollmentFormDrawer`.
5. **Admin: Sessions UI** — `SessionFormDrawer` from group detail.
6. **Admin: Attendance UI** — full-page attendance route, shared with teacher.
7. **Admin: Group calendar** — `/dashboard/groups/[id]/calendar` month grid (admin/superadmin only).
8. **Admin: Student detail** — extend `/dashboard/students/[id]` with Enrollments + Attendance tabs.
9. **Teacher UI** — `/dashboard/teacher` landing (course+group picker), session create, redirect to attendance.
10. **Permissions + page smoke tests** — server-side guards, Vitest page renders.
11. **Pre-commit pass** — `npm run format`, `npm run lint`, typecheck, manual QA. Per AGENTS.md.
