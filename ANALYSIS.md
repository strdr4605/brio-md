# Brio.md - Educurat Analysis & New Plan

## TL;DR

**Educurat** = Generic school management system. Doesn't fit Vibe Academy's model.

**Brio.md** = New system built for Vibe Academy's specific needs.

**Decision:** Rebuild from scratch. Don't use Educurat tables.

---

## What Educurat Is

**Ekattor School Management System** (Codecanyon PHP script) - a generic school management system, heavily customized for Vibe Academy.

### Current Stack
- PHP (CodeIgniter framework)
- MariaDB
- ~60 tables (most you don't need)

### What Educurat Does Well
- ✅ User management (admin, teacher, student, parent)
- ✅ Basic class/program management
- ✅ Simple attendance (by class + section)
- ✅ Manual invoice creation
- ✅ Teacher permissions (access control)

### What Educurat Doesn't Support

| Feature | Vibe Academy Needs | Educurat Has |
|---------|-------------------|--------------|
| Yearly contracts | ✅ | ❌ |
| 4-8 classes/month requirement | ✅ | ❌ |
| Teacher pay per class taught | ✅ | ❌ |
| Schedule-based attendance | ✅ | ❌ (by section only) |
| Summer tours (1-2 weeks, full day) | ✅ | ❌ |
| Payment method (card/cash/transfer) | ✅ | ❌ (basic only) |
| Monthly billing automation | ✅ | ❌ (manual) |

---

## How Educurat Works (Current)

### Data Flow

```
users (everyone - admin, teacher, student, parent)
    │
    ├──► students (extra info)
    │        │
    │        └──► enrols (enrollment)
    │                 │
    │                 ├──► classes (programs: "Robotică", "English")
    │                 │
    │                 └──► sections (time slots: "Monday 6pm")
    │
    ├──► parents (extra info)
    │
    └──► teachers (extra info + permissions)
             │
             └──► teacher_permissions (what they CAN access)

invoices (payments)
daily_attendances (attendance)
```

### Key Tables Explained

| Table | Purpose | Problem |
|-------|---------|---------|
| `users` | All people (role = admin/teacher/student/parent) | Passwords SHA1, not bcrypt |
| `students` | Links to users, stores parent_id | Not a real entity |
| `classes` | Programs like "Robotică Distractivă" | Name OK |
| `sections` | Time slots like "Monday 6pm" | Just a text name, not structured |
| `enrols` | Links student → class → section + price | No contract info |
| `invoices` | Payments (total, paid, status) | Manual, no method tracking |
| `daily_attendances` | By class_id + section_id + date | Wrong granularity |
| `teacher_permissions` | Who can access what | Access only, not teaching history |

---

## Problems in Educurat

### 1. Attendance is Wrong

**Current (wrong):**
```sql
WHERE class_id = 54 AND section_id = 131 AND date = '2025-01-18'
```
All students in "Saturday 10am" group get same attendance on all Saturdays.

**Should be:**
```sql
WHERE class_id = 54 AND section_id = 131 AND date = '2025-01-18'
```
Wait, this is the same... Let me clarify:

**Problem:** `daily_attendances` stores by section, but a section like "Saturday 10am" might happen 4 times in January. There's no link to which *specific schedule slot* was taught.

### 2. No Teacher Salary Tracking

`teacher_permissions` shows:
- "Teacher Maria can access class Robotică"

But nothing shows:
- "Teacher Maria taught Robotică on Monday, January 20, 2025"

### 3. No Contracts

`enrols` has: student_id, class_id, section_id, price

Missing: contract terms, classes_per_month, start_date, end_date

### 4. Invoices are Manual

Admin must create each invoice manually. No automatic monthly billing.

---

## Vibe Academy's Real Model

### Business Logic

```
PARENT signs YEARLY CONTRACT (Sept → June)
    │
    ├──► Kid enrolled in class
    ├──► Parent pays MONTHLY (regardless of absences)
    ├──► Kid needs 4-8 classes/month (contract term)
    └──► If kid misses → comes another day (no refund)

TEACHER gets paid PER CLASS TAUGHT
    │
    └──► Track each class session

SUMMER TOURS
    │
    ├──► Like classes but full day, 1-2 weeks
    └──► Daily attendance tracking
```

### What Matters Most

1. **Payments:** Did parents pay? How much? Card/Cash? Per month?
2. **Attendance:** Did kid show up?
3. **Teacher Salary:** How many classes did teacher teach this month?
4. **Schedule:** When do classes happen?
5. **Tours:** Summer camps with daily attendance

---

## Recommended: Brio.md Fresh Schema

### Simplest Version (8 Tables)

```sql
-- 1. PEOPLE (same as Educurat, cleaner)
users (
  id, name, email, phone, password_hash, role, active
)

-- 2. CONTRACTS (NEW - yearly agreements)
contracts (
  id,
  student_name, student_birthday,
  parent_name, parent_email, parent_phone,
  program_id,
  classes_per_month,  -- 4, 6, or 8
  monthly_price,
  start_date, end_date,
  status,
  notes
)

-- 3. PROGRAMS (classes & tours)
programs (
  id, name, type,  -- 'class' or 'tour'
  base_price,
  duration_minutes,  -- 60, 90, 120
  active
)

-- 4. SCHEDULES (weekly recurring - for classes only)
schedules (
  id, program_id,
  day_of_week,  -- 0=Sunday, 1=Monday...
  start_time, end_time,
  classroom, active
)

-- 5. CLASSES (each session taught - for teacher salary)
classes (
  id, schedule_id, teacher_id,
  date, status  -- 'taught' | 'cancelled'
)

-- 6. ATTENDANCE
attendance (
  id, contract_id, class_id,
  status  -- 'present' | 'absent' | 'late' | 'excused'
)

-- 7. PAYMENTS
payments (
  id, contract_id, month,  -- '2025-01'
  amount_due, amount_paid,
  status,  -- 'paid' | 'partial' | 'unpaid'
  method,  -- 'card' | 'cash' | 'transfer'
  paid_at, notes
)

-- 8. TEACHER SALARY
salaries (
  id, teacher_id, month,
  classes_count, rate_per_class, total,
  status, paid_at
)
```

### Tours Extension (if needed)

```sql
tours (
  id, program_id,
  start_date, end_date,
  daily_schedule,  -- "09:00-17:00"
  max_students
)

tour_enrollments (
  id, contract_id, tour_id,
  price, status
)

tour_attendance (
  id, contract_id, tour_id,
  date, status, notes
)
```

---

## Comparison

| Aspect | Educurat | Brio.md |
|--------|----------|---------|
| Tables | ~60 | 8 |
| Schema complexity | High | Low |
| Contracts | ❌ | ✅ |
| Teacher salary | ❌ | ✅ |
| Payment methods | ❌ | ✅ |
| Tours | ❌ | ✅ |
| Your understanding | ❌ | ✅ |
| Migrate data from Educurat | Later | Later |

---

## Migration Plan

Don't migrate now. Do it later when you understand the data.

```
Now:     Build Brio.md with fresh schema
Later:   Export from Educurat, transform, import to Brio.md
```

---

## Next Steps

1. [ ] Create PostgreSQL schema
2. [ ] Build basic CRUD for programs
3. [ ] Build CRUD for schedules
4. [ ] Build CRUD for contracts
5. [ ] Build attendance tracking
6. [ ] Build payment tracking
7. [ ] Build teacher salary tracking
8. [ ] Add tours (optional)

---

## Appendix: Educurat Tables (What to Ignore)

These Educurat tables are NOT needed for Brio.md:

| Table | Reason |
|-------|--------|
| `addons` | CodeIgniter plugin system |
| `assignments` | Homework (not needed) |
| `assignment_answers` | Homework submissions |
| `assignment_questions` | Homework questions |
| `assignment_remarks` | Homework feedback |
| `assign_students` | Transport (not needed) |
| `books` | Library (not needed) |
| `book_issues` | Library (not needed) |
| `departments` | Not used |
| `drivers` | Transport (not needed) |
| `event_calendars` | Events (maybe later) |
| `exams` | Tests (not needed) |
| `expense_categories` | Expenses (not needed) |
| `expenses` | Expenses (not needed) |
| `frontend_*` | Website (not needed) |
| `grades` | Grade system (not needed) |
| `lesson` | LMS (not needed) |
| `live_classes` | Zoom/Meet (maybe later) |
| `marks` | Student marks (not needed) |
| `menus` | CMS (not needed) |
| `notifications` | In-app messages (maybe later) |
| `question` | Quiz system (not needed) |
| `routines` | Class schedule (replaced by schedules) |
| `sessions` | Academic years (simplify) |
| `settings` | Config (simplify) |
| `sms_settings` | SMS (not needed) |
| `smtp_settings` | Email config |
| `syllabuses` | Course content (not needed) |
| `teacher_permissions` | Access control (simplify) |
| `trips` | Transport (not needed) |
| `vehicles` | Transport (not needed) |

---

## Tables to Potentially Import

Only if you need historical data later:

| Table | Import? |
|-------|---------|
| `users` | Maybe (parents, teachers) |
| `students` | Maybe (existing students) |
| `classes` | Yes (programs) |
| `sections` | Maybe (schedule templates) |
| `enrols` | Maybe (enrollment history) |
| `invoices` | Maybe (payment history) |
| `daily_attendances` | Maybe (attendance history) |

---

## Questions to Answer Later

1. Do you need historical data from Educurat?
2. Are there other schools (multi-school)?
3. Do teachers need their own login/portal?
4. Do parents need their own portal?
5. What reports do you need most?

---

*Document created: 2025-05-18*
*Analysis by: Claude Code*
