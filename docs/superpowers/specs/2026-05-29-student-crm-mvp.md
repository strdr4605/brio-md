# Student CRM MVP — Registration + Attendance Spec

## Scope

Zero billing. Registration + attendance only. 4 new tables, 2 altered.

## Alter Existing

**courses** — add `description` text, `active` boolean (default true).

## New Tables

### groups
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| courseId | int FK→courses | |
| schoolId | int FK→schools | |
| name | varchar | "Mon 17:30" |
| teacherId | int FK→users | Default teacher |
| schedulePattern | jsonb | `{ "monday": ["17:30"], "wednesday": ["17:30"] }` |
| active | boolean | |

### enrollments
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| studentId | int FK→students | |
| groupId | int FK→groups | |
| schoolId | int FK→schools | |
| type | enum | course, camp |
| price | int | Cents, per-student (supports discounts) |
| status | enum | active, paused, cancelled, completed |
| startDate | date | |
| notes | text | |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| groupId | int FK→groups | |
| schoolId | int FK→schools | |
| date | date | |
| teacherId | int FK→users | Actual teacher (nullable) |
| notes | text | |

### attendances
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| sessionId | int FK→sessions | |
| studentId | int FK→students | |
| enrollmentId | int FK→enrollments | Auto-resolved from student+session date |
| status | enum | present, absent |
| notes | text | |

## Flows

### Session Generation
Admin defines schedulePattern on group → system generates sessions ahead. Teacher can add/remove dates.

### Enrollment
Admin selects student + group → sets type (course/camp), price, startDate → enrollment created.

### Attendance
Teacher selects group → date → student list → marks present/absent. Editable.

## UI (in.brio.md, mobile-first)

| Page | What |
|------|------|
| Studenți | List (search) + detail (enrollments, attendance history) |
| Cursuri | List + edit name/description, toggle active |
| Grupe | List + detail (enrollments add/remove, sessions, schedule config) |
| Calendar | Month view, group dots, click session → attendance |

### Teacher
- Grupele Mele → attendance → date → mark.

## Out of MVP
Billing, invoices, payments, make-up tracking, pause/cancel, half-month, per-session, camp deposit/remainder, reports, isMakeup, BillingCredit.
