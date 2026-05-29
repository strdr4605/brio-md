# Student CRM, Enrollment & Billing System — Design Spec

## Context

Brio.md is a school management platform with three apps:
- `brio.md` — Landing page
- `in.brio.md` — Staff portal (admin + teachers)
- `learn.brio.md` — Student/teacher learn portal

The current DB schema (`packages/db/src/schema.ts`) has basic entities: schools, courses, users, students. The `educurat.sql` (legacy PHPMyAdmin system) has an `invoices` table and `payment_settings` table that handle basic monthly invoicing.

This spec covers adding a full CRM system per student/course, with:
- Student enrollment management (courses + camps)
- Attendance tracking per session
- Flexible billing (per-session, monthly, half-month, camps)
- Hybrid payment model (upfront block payment, make-up sessions, partial refunds/credits)
- Invoice generation, partial payments, payment reconciliation

## Entities

### Student
Core person record. Parents/students do NOT have portal access — this is an internal staff tool.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| name | varchar | Student name |
| schoolId | int | FK → schools |
| parentName | varchar | Contact name |
| parentPhone | varchar | Contact phone |
| parentEmail | varchar | Contact email |
| info | text | Notes |
| active | boolean | Active vs. archived |
| createdAt | timestamp | |

### Course
The product — what students enroll in.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| schoolId | int | FK → schools |
| name | varchar | e.g., "LEGO Robotics", "English" |
| description | text | |
| active | boolean | Available for enrollment |
| createdAt | timestamp | |

### CoursePricing
Pricing rules per course. Multiple pricing tiers per course.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| courseId | int | FK → courses |
| type | enum | `per_session`, `monthly`, `half_month`, `camp` |
| sessionsCount | int | Number of sessions (4-8 for monthly, 2-4 for half-month, 10 for camp) |
| price | int | Price in smallest currency unit (cents) |
| label | varchar | Display name, e.g., "Monthly (4-8 sessions)" |

### Group
A time slot for a course. A course can have multiple groups.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| courseId | int | FK → courses |
| name | varchar | e.g., "Mon 17:30", "Fri 17:30" |
| teacherId | int | FK → users (optional) |
| active | boolean | |
| createdAt | timestamp | |

### Enrollment
Links a student to a course/group, with billing period and status.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| studentId | int | FK → students |
| groupId | int | FK → groups |
| type | enum | `course` (subscription) or `camp` (one-time) |
| status | enum | `active`, `paused`, `cancelled`, `completed` |
| startDate | date | Contract/enrollment start |
| endDate | date | Contract/enrollment end |
| billingPeriodStart | date | For courses: when current billing period started |
| pausedAt | date | When status changed to paused |
| cancelledAt | date | |
| createdAt | timestamp | |

### Session
A single calendar date for a group.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| groupId | int | FK → groups |
| date | date | |
| notes | text | Topic covered, etc. |
| createdAt | timestamp | |

### Attendance
Student's presence record for a session.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| enrollmentId | int | FK → enrollments |
| sessionId | int | FK → sessions |
| status | enum | `present`, `absent`, `paused` |
| isMakeup | boolean | This was a make-up session for a prior absence |
| makeupForAttendanceId | int | FK → attendance (optional) — links to the absence this is making up |
| notes | text | |
| createdAt | timestamp | |

### Invoice
Generated per enrollment per billing period. Auto-created at billing period start as a quote/estimate, reconcilable at period end.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| enrollmentId | int | FK → enrollments |
| title | varchar | e.g., "June 2026", "Summer Camp 2026" |
| totalAmount | int | Amount due (cents) |
| paidAmount | int | Amount paid so far (cents) |
| status | enum | `quote` (unpaid estimate), `partial`, `paid`, `overdue`, `credited` |
| dueDate | date | |
| periodStart | date | Billing period start |
| periodEnd | date | Billing period end |
| notes | text | |
| createdAt | timestamp | |
| updatedAt | timestamp | Payment date when fully paid |

### InvoiceLineItem
Line items on an invoice.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| invoiceId | int | FK → invoices |
| description | varchar | e.g., "Monthly - 4 sessions" |
| quantity | int | Number of sessions |
| unitPrice | int | Price per session (cents) |
| total | int | quantity * unitPrice |

### Payment
A payment against an invoice.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| invoiceId | int | FK → invoices |
| amount | int | Payment amount (cents) |
| method | enum | `cash`, `card`, `transfer`, `other` |
| reference | varchar | Transaction ID, receipt number, etc. |
| paidAt | timestamp | |
| createdAt | timestamp | |

### BillingCredit
Tracks unused sessions, make-up credits, and refunds per student.

| Field | Type | Notes |
|-------|------|-------|
| id | serial | PK |
| studentId | int | FK → students |
| type | enum | `makeup_earned` (absent session earned credit), `makeup_used`, `refund`, `camp_credit` |
| amount | int | Session count (for make-up) or cents (for refund) |
| enrollmentId | int | FK → enrollments (optional) — which enrollment this credit relates to |
| usedAt | timestamp | When credit was consumed |
| notes | text | |
| createdAt | timestamp | |

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
        └── BillingCredit (1:M) — credits earned/used by this enrollment

Group
  └── Session (1:M)
        └── Attendance (M:1 via Enrollment)
```

## Key Flows

### 1. Enrollment Creation
1. Admin selects student + course + group
2. Sets enrollment type (`course` or `camp`)
3. For `course`: sets billing period (monthly/half-month), start date
4. For `camp`: sets camp date range, lump-sum pricing
5. System creates enrollment, auto-generates first invoice

### 2. Invoice Generation
1. **At billing period start**: Invoice created with status `quote`
   - Line items from course pricing
   - Total = expected amount
2. Admin can also manually create invoices
3. Payment received → invoice status → `partial` or `paid`
4. Month-end reconciliation: compare expected sessions vs actual attendance
   - If attended < expected → generate credit
   - If attended > expected (make-ups used) → no additional charge

### 3. Attendance Tracking
**Admin view** — calendar view:
- See all sessions for all groups
- Color-coded: has attendance taken? any absences?

**Teacher view**:
1. Select course → group → date
2. See student list for that group
3. Mark present/absent/paused per student
4. Optionally flag as make-up (links to prior absence)

**Paused students**:
- Still appear on attendance list, marked `paused`
- Not billed while paused

### 4. Make-up Sessions
1. Student absent → attendance marked `absent`, no make-up flag
2. Admin/teacher schedules make-up session for that student
3. Student attends make-up → attendance marked `present`, `isMakeup = true`, links to original absence
4. BillingCredit created: `makeup_earned` for the original absence (unused session credit)
5. Make-up session deducts from credit balance

### 5. Credits and Refunds
- **Unused sessions at month end** → `BillingCredit.makeup_earned` created for the enrollment
- **Parent requests refund** → admin creates `BillingCredit.refund`, issues payment
- **Credits can offset future invoices** — system applies credits before charging payment method

### 6. Pause/Resume
1. Admin changes enrollment status to `paused`
2. `pausedAt` date recorded
3. Student hidden from new attendance lists
4. No invoices generated while paused
5. On resume: `billingPeriodStart` reset to resume date, new invoice generated

## Reports

### Profit by Type
```sql
SELECT e.type, SUM(i.totalAmount)
FROM invoices i
JOIN enrollments e ON i.enrollmentId = e.id
WHERE i.status = 'paid'
GROUP BY e.type
```

### Outstanding Balances
```sql
SELECT s.name, s.parentName, SUM(i.totalAmount - i.paidAmount) as balance
FROM invoices i
JOIN enrollments e ON i.enrollmentId = e.id
JOIN students s ON e.studentId = s.id
WHERE i.status IN ('partial', 'overdue')
GROUP BY s.id
```

### Attendance Rate
```sql
SELECT s.name, c.name, COUNT(a.id) as total,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as attended
FROM attendances a
JOIN enrollments e ON a.enrollmentId = e.id
JOIN students s ON e.studentId = s.id
JOIN groups g ON e.groupId = g.id
JOIN courses c ON g.courseId = c.id
GROUP BY s.id, c.id
```

## Portal UI Structure (in.brio.md)

### Admin
- **Dashboard** — overview stats, outstanding balances, today's sessions
- **Students** — list, detail view (enrollments, attendance history, invoices, credits)
- **Courses** — list, pricing rules
- **Groups** — list, assigned teachers, schedule
- **Calendar** — all sessions, filterable by course/group
- **Invoices** — list, create, mark paid, view payments
- **Reports** — profit by course/camp, attendance rates, outstanding balances

### Teacher
- **My Groups** — assigned groups
- **Attendance** — select group → date → mark attendance
- **Calendar** — view schedule for assigned groups

## Extensibility

- `BillingCredit.type` enum can be extended with new types as needed
- `CoursePricing.type` enum can accommodate new pricing models
- Portal UI separates admin vs teacher concerns via role-based access

## Out of Scope

- Parent/student portal (future consideration)
- Online payment processing (Stripe/PayPal integration — existing `payment_settings` table can be used)
- SMS notifications
- Automatic make-up session scheduling
