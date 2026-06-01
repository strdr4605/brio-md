# Student CRM, Enrollment & Billing System — Design Spec

## Context

Brio.md is a school management platform with three apps:
- `brio.md` — Landing page
- `in.brio.md` — Staff portal (admin + teachers)
- `learn.brio.md` — Student/teacher learn portal

Tech stack: Next.js 16, React 19, Tailwind 3, tRPC v11, Auth.js v5, Drizzle ORM, PostgreSQL 16. No migrations exist — `drizzle-kit push` is used.

Current DB schema (`packages/db/src/schema.ts`) has: schools, courses, users, students, accounts, sessions (Auth.js), verificationTokens.

The legacy `educurat.sql` (PHP/CodeIgniter) had `invoices` and `payment_settings` tables — not to be migrated.

This spec covers adding a full CRM system per student/course, with enrollment management, attendance tracking, flexible billing, and payment reconciliation.

## Key Design Decisions

| Decision | Value |
|----------|-------|
| Billing cycle | Fixed calendar months (1st to end-of-month) |
| Invoice generation | Hybrid: auto-cron on 1st, manual reconciliation month-end |
| Invoice nature | Binding — total does not change after creation |
| Credits | Session-bank only (non-monetary), no rollover |
| Half-month pricing | Mid-month joiners, manually selected by admin |
| Per-session billing | Pay-as-you-go: small invoice after each attended session |
| Camp billing | Deposit + remainder |
| School isolation | schoolId denormalized on every table |
| Attendance link | Auto-resolved enrollmentId from student+session+date |
| Teacher assignment | Group.teacherId (default) + Session.teacherId (actual, can differ) |
| Permissions | One school per admin account |
| UI | Mobile-first |
| Reports | V2, superadmin only |
| Block payment | Out of scope |

## Approaches Considered

### A) Greenfield leader (not chosen)
Add all 9 entities to schema at once, then build flows vertically. Upside: no rework. Downside: big initial migration, all entities at once.

### B) Striped build (chosen — Phase 1)
Build monthly subscription end-to-end first, then add camps, then per-session. Smaller risk, test billing early with real data.

### C) CRM-first, billing later (not chosen)
Enrollment + attendance first, billing as separate module. Clean boundary but bills deferred.

## Entities

### Schema Changes (alter existing tables)

**students** — add column:
| Column | Type | Notes |
|---------|------|-------|
| parentEmail | varchar | Add to existing table |

**courses** — add columns:
| Column | Type | Notes |
|---------|------|-------|
| description | text | |
| active | boolean | Default true, available for enrollment |

### New Tables

#### CoursePricing
Pricing tiers per course.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| courseId | int | FK → courses |
| schoolId | int | FK → schools (denormalized) |
| type | enum | per_session, monthly, half_month, camp |
| sessionsCount | int | 4-8 monthly, 2-4 half-month, 10 camp |
| price | int | Cents |
| label | varchar | "Monthly (4-8 sessions)" |

#### Group
Time slot for a course.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| courseId | int | FK → courses |
| schoolId | int | FK → schools |
| name | varchar | "Mon 17:30" |
| teacherId | int | FK → users (nullable), default teacher |
| schedulePattern | jsonb | { "monday": ["17:30"], "wednesday": ["17:30"] } |
| active | boolean | |

#### Enrollment
Student's subscription to a course/group.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| studentId | int | FK → students |
| groupId | int | FK → groups |
| schoolId | int | FK → schools |
| type | enum | course (subscription), camp (one-time) |
| pricingType | enum | monthly, half_month, per_session, camp |
| status | enum | active, paused, cancelled, completed |
| startDate | date | |
| endDate | date | |
| cancelledAt | date | nullable |
| pausedAt | date | nullable |

#### Session
Single calendar occurrence of a group.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| groupId | int | FK → groups |
| schoolId | int | FK → schools |
| date | date | |
| teacherId | int | FK → users (nullable), actual teacher who taught |
| notes | text | |

#### Attendance
Student presence per session.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| sessionId | int | FK → sessions |
| studentId | int | FK → students |
| enrollmentId | int | FK → enrollments (auto-resolved by system from student+date) |
| status | enum | present, absent, paused |
| isMakeup | boolean | |
| makeupForAttendanceId | int | FK → attendances (nullable), links to original absence |
| notes | text | |

Auto-resolve: on save, system finds active enrollment for this student at this date. Teacher picks student + session only.

#### Invoice
Binding invoice per enrollment per billing period.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| enrollmentId | int | FK → enrollments |
| schoolId | int | FK → schools |
| title | varchar | "Iunie 2026", "Tabara de Vara 2026" |
| totalAmount | int | Cents |
| paidAmount | int | Cents |
| status | enum | quote, partial, paid, overdue, credited |
| type | enum | monthly, half_month, session, camp_deposit, camp_remainder |
| dueDate | date | |
| periodStart | date | |
| periodEnd | date | |
| notes | text | |

#### InvoiceLineItem
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| invoiceId | int | FK → invoices |
| description | varchar | |
| quantity | int | |
| unitPrice | int | Cents |
| total | int | quantity × unitPrice |

#### Payment
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| invoiceId | int | FK → invoices |
| amount | int | Cents |
| method | enum | cash, card, transfer, other |
| reference | varchar | Transaction/receipt ID |
| paidAt | timestamp | |

#### BillingCredit
Session-bank (non-monetary). Tracks unused session credits, make-up credits, refunds.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| studentId | int | FK → students |
| schoolId | int | FK → schools |
| enrollmentId | int | FK → enrollments (nullable) |
| type | enum | makeup_earned, makeup_used, refund |
| sessions | int | Number of sessions |
| notes | text | |

## Relationships

```
Student
  └── Enrollment (1:M)
        ├── Group (M:1)
        │     └── Course (M:1)
        │           └── CoursePricing (1:M)
        ├── Invoice (1:M)
        │     ├── InvoiceLineItem (1:M)
        │     └── Payment (1:M)
        └── BillingCredit (1:M)

Group
  └── Session (1:M)
        └── Attendance (1:M, via studentId + auto-resolved enrollmentId)
```

Every table has `schoolId` denormalized for permission scoping.

Teacher assignment:
- `users.courseIds` (existing): "can teach this course" (permission)
- `Group.teacherId`: default teacher for this time slot
- `Session.teacherId`: actual teacher who taught this session (nullable, differs for substitutes)

## Key Flows

### 1. Enrollment Creation

1. Admin selects student + course + group
2. Sets pricing type: monthly, half_month, per_session (for courses) or camp
3. Sets type: course or camp
4. Sets start date (defaults to today)
5. System creates enrollment (status: active)
6. System auto-generates first invoice for current calendar month (monthly/half_month) or camp deposit

### 2. Invoice Generation

#### Monthly / Half-month
1. Cron on 1st of each month: for every active monthly/half-month enrollment, create invoice
2. Invoice total = fixed pricing amount from CoursePricing
3. Status: quote → partial → paid (as payments come in)
4. Invoice is binding — total does not change

#### Per-session
1. After teacher marks attendance for a session → system creates small invoice
2. Invoice total = unitPrice × 1 (single session)
3. No month-end reconciliation needed

#### Camp
1. Admin manually creates deposit invoice (camp_deposit type)
2. Admin creates remainder invoice before camp start (camp_remainder type)

### 3. Attendance Tracking

**Admin calendar view:**
- Month/week grid showing all sessions across groups
- Color-coded: session has attendance? missing? any absences?

**Teacher view:**
1. Select group → date
2. See student list
3. Mark present/absent/paused per student
4. Paused students visible on list but marked paused
5. Per-session only — no batch week/month marking
6. Attendance is editable (correction without audit trail)

### 4. Session Generation (Template-based)

1. Admin defines schedule pattern on group creation (Mon+Wed 17:30)
2. System generates sessions ahead for current month
3. Teacher can add/remove individual session dates
4. Default teacher = Group.teacherId
5. Actual teacher = Session.teacherId (can differ — substitute support)

### 5. Make-up Sessions

1. Student absent → attendance marked absent
2. Teacher/admin schedules make-up session
3. Student attends → attendance marked present, isMakeup=true, links to absence
4. BillingCredit created: makeup_earned for original absence
5. Credits are session-bank only (non-monetary), do not offset invoice amounts

### 6. Month-end Reconciliation (monthly only)

1. Admin reviews attendance count vs invoice
2. If attended < expected: admin manually creates BillingCredit (sessions, non-monetary)
3. If attended > expected (make-ups consumed): no extra charge
4. Credits do not roll over — reconciliation is per-month
5. Overdue handling: just a visual flag, admin chases manually

### 7. Pause/Resume

1. Admin sets enrollment to paused → pausedAt recorded
2. Student stays visible on attendance (marked paused)
3. No invoices generated while paused
4. On resume: invoice generated for remaining days in current month

### 8. Cancellation

1. Admin cancels enrollment → cancelledAt recorded
2. Invoice stays as-is (binding — total unchanged)
3. Remaining sessions become session-bank credits (makeup_earned)

### 9. Payment

1. Admin enters payment: amount, method, reference
2. paidAmount increases, status updates (partial → paid)
3. Overpayment → admin decides: leave as excess paid or return cash
4. Underpayment → stays partial, admin chases

### 10. Credit Handling

- Credits are session-bank only — not monetary offset
- makeup_earned: unused sessions or cancellations
- makeup_used: consumed for make-up attendance
- refund: manual refund record

## Portal UI (in.brio.md, mobile-first)

### Navigation
Dashboard | Utilizatori | Studenți | Cursuri | Grupe | Calendar | Facturi | Setări

### Admin Views

**Studenți** — list + detail
- List: search, filter by course/group, quick stats (active enrollments, outstanding)
- Detail: tabs — contact, enrollments, attendance history, invoices, credits

**Cursuri** — list + detail
- List: name, groups count, pricing tiers
- Detail: edit name/description, manage pricing tiers, toggle active

**Grupe** — list + detail
- List: course, group name, teacher, student count
- Detail: enrollments (add/remove/pause), sessions calendar, schedule config

**Calendar**
- Month view, color dots per group
- Click session → attendance overview

**Facturi**
- List: filter by status, date range, student
- Detail: line items, payment history, add payment
- Manual create for edge cases

### Teacher Views

**Grupele Mele** — assigned groups
- Click group → attendance → date → mark
- Calendar for own groups

## Reports (V2, Superadmin only)

- Profit by course type
- Outstanding balances
- Attendance rates
- Credits outstanding

## Error Handling

| Scenario | Handling |
|----------|----------|
| Duplicate invoice (cron re-run) | Idempotency check: skip if invoice exists for enrollment+period |
| Cron fails mid-run | Log error, continue to next enrollment |
| Wrong payment amount | Admin enters actual amount. Underpaid → partial. Overpaid → admin decides |
| Student attends without enrollment | Error: "No active enrollment for this date", prompt admin |
| Session date changes after attendance | Existing records stay; teacher updates notes |
| Session deleted with attendance | Orphaned attendance → admin must re-link |
| Wrong student marked | Editable — teacher/admin corrects |
| Holiday month (0 sessions) | Skip invoice generation |
| Student has 2 active enrollments | Independent: separate invoices, attendance, billing cycles |
| Mid-month enrollment | Admin selects half-month pricing manually |

## Out of Scope (Current)

- Parent/student portal access
- Online payment processing (Stripe/PayPal)
- SMS/WhatsApp notifications
- Email invoice delivery
- Audit trail for attendance corrections
- Automatic make-up session scheduling
- Upfront block payment
- Monthly installment camp billing
- Multi-school admin accounts
- Week/month batch attendance marking
- RLS (row-level security)
- Monetary credits (session-bank only)
- Credit rollover between months
