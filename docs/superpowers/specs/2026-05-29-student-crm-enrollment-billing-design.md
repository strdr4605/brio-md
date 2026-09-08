# Student CRM, Enrollment & Billing System — Design Spec

## Context

Brio.md is a school management platform with three apps:

- `brio.md` — Landing page
- `in.brio.md` — Staff portal (admin + teachers)
- `learn.brio.md` — Student/teacher learn portal

Tech: Next.js 16, React 19, Tailwind 3, tRPC v11, Auth.js v5, Drizzle ORM, PostgreSQL 16.

Current schema (`packages/db/src/schema.ts`): schools, courses, users, students, accounts, sessions (Auth.js), verificationTokens. No migrations — `drizzle-kit push`.

## Key Decisions

| Decision            | Value                                                        |
| ------------------- | ------------------------------------------------------------ |
| Billing cycle       | Fixed calendar months (1st to end-of-month)                  |
| Invoice generation  | Hybrid: auto-cron on 1st, manual reconciliation at month end |
| Invoice nature      | Binding — does not change after creation                     |
| Pricing             | Per-enrollment (supports custom discounts)                   |
| Half-month          | Mid-month joiners, selected manually                         |
| Per-session billing | Small invoice after each attended session                    |
| Camp billing        | Deposit + remainder                                          |
| School isolation    | schoolId denormalized on every table                         |
| Teacher assignment  | Group.teacherId (default) + Session.teacherId (actual)       |
| Credits             | Session-bank only, tracked via make-up flag on attendance    |
| UI                  | Mobile-first                                                 |

## Approaches Considered

### A) Greenfield (not chosen)

All entities at once. Big migration upfront.

### B) Striped build (chosen)

Monthly subscription end-to-end first, then camps, then per-session.

### C) CRM-first (not chosen)

Enrollment + attendance first, billing later.

## Schema

### Alter existing

**students** — add `parentEmail` varchar.

**courses** — add `description` text, `active` boolean (default true).

### New tables

#### groups

Time slot for a course.

| Column          | Type           | Notes                                             |
| --------------- | -------------- | ------------------------------------------------- |
| id              | serial PK      |                                                   |
| courseId        | int FK→courses |                                                   |
| schoolId        | int FK→schools |                                                   |
| name            | varchar        | "Mon 17:30"                                       |
| teacherId       | int FK→users   | Default teacher                                   |
| schedulePattern | jsonb          | `{ "monday": ["17:30"], "wednesday": ["17:30"] }` |
| active          | boolean        |                                                   |

#### enrollments

Student's subscription. Price per enrollment supports custom discounts.

| Column      | Type            | Notes                                              |
| ----------- | --------------- | -------------------------------------------------- |
| id          | serial PK       |                                                    |
| studentId   | int FK→students |                                                    |
| groupId     | int FK→groups   |                                                    |
| schoolId    | int FK→schools  |                                                    |
| type        | enum            | course, camp                                       |
| pricingType | enum            | monthly, half_month, per_session, camp             |
| price       | int             | Price in cents — per student (discounts live here) |
| status      | enum            | active, paused, cancelled, completed               |
| startDate   | date            |                                                    |
| endDate     | date            | Nullable                                           |
| cancelledAt | date            | Nullable                                           |
| pausedAt    | date            | Nullable                                           |
| notes       | text            |                                                    |

#### sessions

Single calendar occurrence of a group.

| Column    | Type           | Notes                                              |
| --------- | -------------- | -------------------------------------------------- |
| id        | serial PK      |                                                    |
| groupId   | int FK→groups  |                                                    |
| schoolId  | int FK→schools |                                                    |
| date      | date           |                                                    |
| teacherId | int FK→users   | Actual teacher (nullable, differs for substitutes) |
| notes     | text           |                                                    |

#### attendances

Student presence per session. Editable.

| Column                | Type               | Notes                                             |
| --------------------- | ------------------ | ------------------------------------------------- |
| id                    | serial PK          |                                                   |
| sessionId             | int FK→sessions    |                                                   |
| studentId             | int FK→students    |                                                   |
| enrollmentId          | int FK→enrollments | Auto-resolved by system from student+session date |
| status                | enum               | present, absent, paused                           |
| isMakeup              | boolean            | Make-up session for prior absence                 |
| makeupForAttendanceId | int FK→attendances | Links to original absence (nullable)              |
| notes                 | text               |                                                   |

#### invoices

Flat invoice — no line items, no separate payment table.

| Column       | Type               | Notes                                                      |
| ------------ | ------------------ | ---------------------------------------------------------- |
| id           | serial PK          |                                                            |
| enrollmentId | int FK→enrollments |                                                            |
| schoolId     | int FK→schools     |                                                            |
| title        | varchar            | "Iunie 2026", "Tabara de Vara 2026"                        |
| totalAmount  | int                | Cents                                                      |
| paidAmount   | int                | Cents                                                      |
| method       | enum               | cash, card, transfer, other (set on payment)               |
| status       | enum               | quote, partial, paid, overdue                              |
| type         | enum               | monthly, half_month, session, camp_deposit, camp_remainder |
| dueDate      | date               |                                                            |
| periodStart  | date               |                                                            |
| periodEnd    | date               |                                                            |
| notes        | text               |                                                            |

## Relationships

```
Student ──1:N──► Enrollment ──M:1──► Group ──M:1──► Course
                       │
                       └──1:N──► Invoice

Group ──1:N──► Session ──1:N──► Attendance (studentId + auto-resolved enrollmentId)
```

Teacher assignment:

- `users.courseIds` (existing): can teach this course
- `Group.teacherId`: default teacher
- `Session.teacherId`: who actually taught (substitutes)

## Flows

### 1. Enrollment

Admin picks student + course + group → sets pricing type, price, start date → system creates enrollment + first invoice.

### 2. Invoice Generation

- **Monthly/half-month**: cron on 1st auto-creates invoice per active enrollment. Invoice is binding.
- **Per-session**: invoice auto-created after teacher marks attendance for session.
- **Camp**: admin manually creates deposit + remainder invoices.
- **Overdue**: visual flag only, no auto-action.

### 3. Attendance

- Teacher selects group → date → sees student list → marks present/absent/paused.
- Per-session only. Paused students visible, marked paused.
- Editable after the fact.
- `isMakeup` flag + `makeupForAttendanceId` for make-up tracking (session-bank, non-monetary).

### 4. Session Generation

Admin defines schedule pattern on group creation → system generates sessions ahead. Teacher can add/remove dates.

### 5. Payment

Admin enters payment amount + method → paidAmount updates → status transitions (quote → partial → paid). Overpayment: admin decides or returns. Underpayment: stays partial.

### 6. Month-end Reconciliation (monthly only)

Admin reviews attendance vs invoice. Credits tracked via make-up flags on attendance. No separate credit ledger.

### 7. Pause / Cancel

Pause: student stays visible on attendance (paused), no invoices generated. Cancel: invoice stays binding, remaining sessions → make-up credits.

## Portal UI (in.brio.md, mobile-first)

### Navigation

Dashboard | Utilizatori | Studenți | Cursuri | Grupe | Calendar | Facturi | Setări

### Admin

- **Studenți**: list (search, filter, quick stats) + detail (enrollments, attendance, invoices)
- **Cursuri**: list + edit name/description, toggle active
- **Grupe**: list + detail (enrollments add/remove/pause, sessions, schedule)
- **Calendar**: month view, group color dots, click session → attendance overview
- **Facturi**: list (filter by status/date/student) + detail (add payment)

### Teacher

- **Grupele Mele**: assigned groups → attendance → date → mark

## Reports (V2, Superadmin)

Profit by course, outstanding balances, attendance rates.

## Error Handling

| Scenario                              | Handling                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| Duplicate invoice (cron re-run)       | Idempotency check: skip if exists for enrollment+period        |
| Cron fails mid-run                    | Log, continue to next enrollment                               |
| Wrong payment amount                  | Admin enters actual; underpaid→partial, overpaid→admin decides |
| Student attends without enrollment    | Error: "No active enrollment for this date"                    |
| Session date changes after attendance | Existing records stay; teacher updates notes                   |
| Wrong student marked                  | Editable                                                       |
| Holiday month (0 sessions)            | Skip invoice generation                                        |
| 2 active enrollments                  | Independent invoices + attendance                              |
| Mid-month enrollment                  | Admin selects half-month manually                              |

## Out of Scope (Current)

Parent/student portal, online payment, SMS/WhatsApp, email invoices, audit trail, auto make-up scheduling, block payment, installment camps, multi-school admin, batch attendance, RLS, separate credit ledger, CoursePricing table, InvoiceLineItem table, Payment table.
