# Software Requirements Specification (SRS)
## Brio.md — School Management & Interactive Learning Platform

**Document Version:** 1.1.0 · **Baseline:** Live MVP in Production · **Standards:** IEEE 830 / ISO/IEC/IEEE 29148

---

## 1. Product Scope & Architecture

Brio.md is an educational management operating system (CRM + LMS) structured as an atomic TypeScript monorepo:

| Component | Path | Primary Purpose | Live Port / Host |
|:---|:---|:---|:---|
| **Portal App** | `apps/portal` | Administrative back-office for directors and teachers (CRM, Journal, Billing) | `in.brio.md` (`:3002`) |
| **Learn App** | `apps/learn` | Interactive learning platform for students and instructors (LMS, Homework) | `learn.brio.md` (`:3003`) |
| **Landing App** | `apps/landing` | Public institutional showcase and pilot access request form | `brio.md` (`:3001`) |
| **Database** | `packages/db` | Drizzle ORM schemas, PostgreSQL migrations, schema-per-tenant provisioner | Neon Cloud DB / Docker |
| **Auth** | `packages/auth` | Centralized NextAuth v5 credentials engine, JWT SSO, and RBAC guards | Shared across apps |
| **UI Kit** | `packages/ui` | Monochrome Slate Design System primitives (`docs/DESIGN_SYSTEM.md`) | Shared across apps |

---

## 2. User Roles & Actors

* **`ROLE-SUPER` (Super Administrator):** Global platform administrator (`admin@brio.md`). Manages all school tenants, permissions, and system audits.
* **`ROLE-ADMIN` (School Director):** Manages a single school's students, teachers, study groups, tuition fees, and invoicing.
* **`ROLE-TEACH` (Teacher / Instructor):** Conducts classes, marks attendance in the classroom journal, and reviews student assignments in the LMS.
* **`ROLE-STUDENT` (Student / Learner):** Views course curriculum, accesses presentations and video materials, and submits homework in the LMS.

---

## 3. Functional Requirements (Live Product Baseline)

All requirements carry permanent stable identifiers (`[REQ-<MODULE>-<ID>]`) describing features currently verified in production.

### 3.1 Authentication, Access & Security (AUTH)

* **`[REQ-AUTH-001]` Credentials Authentication:** The system shall authenticate users via email and password using bcrypt hash verification with salt rounds of 10.
* **`[REQ-AUTH-002]` Cross-Application SSO:** The system shall share authenticated user sessions between Portal (`:3002`) and Learn (`:3003`) via encrypted JWT tokens without re-prompting for credentials.
* **`[REQ-AUTH-003]` Role-Based Permissions (RBAC):** The API shall enforce procedural guards based on user privileges (`super`, `admin`, `manage_billing`, `teach`), rejecting unauthorized calls with `HTTP 403 / FORBIDDEN`.
* **`[REQ-AUTH-004]` Dual Pilot Account Access:** The system shall support both institutional logins (e.g. `orizont@brio.md`) and standardized QA demo logins (e.g. `demo01@brio.md` with `BrioPilot2026!`), resolving to the same tenant.
* **`[REQ-AUTH-005]` Account Status Enforcement:** Inactive accounts (`active = false`) shall be blocked at authentication with an immediate `Invalid credentials` error.

### 3.2 Multi-Tenancy & Schema Isolation (TEN)

* **`[REQ-TEN-001]` Schema-per-Tenant Separation:** Each school shall operate in a dedicated PostgreSQL database schema (`tenant_<school_slug>`), physically separating tenant records from `public`.
* **`[REQ-TEN-002]` Dynamic Search-Path Context:** On every authenticated tRPC call, middleware shall resolve the user's `schoolId` and set `search_path = "${safeSchema}", public`, scoping queries automatically.
* **`[REQ-TEN-003]` Automated Tenant Provisioning:** The provisioning engine shall generate schemas and create domain tables (`students`, `courses`, `groups`, `invoices`, `attendance`) on demand via `provisionTenantSchema`.
* **`[REQ-TEN-004]` Zero Cross-Tenant Data Leakage:** Queries executed within Tenant A's context shall never read or modify Tenant B's data at the database level.

### 3.3 Student Information System (STU)

* **`[REQ-STU-001]` Student Demographic Records:** The system shall maintain student profiles with full name, phone, email, parent contact, birthdate, calculated age, and active status.
* **`[REQ-STU-002]` Moldovan Phone Normalization:** The system shall validate and normalize phone numbers to Moldovan format (`+373 XX XXXXXX`), rejecting non-conforming entries.
* **`[REQ-STU-003]` 360° Student Dossier:** The profile view (`/dashboard/students/[id]`) shall consolidate personal data, group enrollments, attendance history, financial ledger, and LMS credentials.
* **`[REQ-STU-004]` Single Sample Student Sandbox:** Each newly provisioned pilot school shall initialize with strictly one (1) sample student (`Alex Popescu`) for clean CSV onboarding.

### 3.4 CSV / Excel Bulk Ingestion (CSV)

* **`[REQ-CSV-001]` Resilient Delimiter Parsing:** The CSV parser shall auto-detect comma (`,`), semicolon (`;`), and tab (`\t`) delimiters, supporting Romanian, Russian, and English column headers.
* **`[REQ-CSV-002]` In-Browser Validation Preview:** The import modal shall display an interactive preview table highlighting missing fields and invalid phone numbers before server submission.
* **`[REQ-CSV-003]` Standard Template Download:** The system shall offer a downloadable sample template (`studenti_template.csv`) matching platform ingestion requirements.
* **`[REQ-CSV-004]` Atomic Batch Ingestion:** Validated student records shall be inserted in a single atomic database batch, preventing duplicate rows based on `(school_id, name, phone)`.

### 3.5 Academic Courses, Groups & Scheduling (CRS)

* **`[REQ-CRS-001]` Course Curriculum Definition:** Administrators shall configure courses with name, description, difficulty level (`beginner`, `intermediate`, `advanced`), session count, duration, and monthly fee.
* **`[REQ-CRS-002]` Study Group Allocation:** Courses shall branch into groups assigned to specific teachers, rooms/cabinets, weekdays, and scheduled time slots.
* **`[REQ-CRS-003]` Multi-Group Enrollment:** Students may be enrolled in multiple groups across different courses with independent statuses (`active`, `withdrawn`, `completed`).
* **`[REQ-CRS-004]` Schedule Conflict Detection:** The system shall identify and flag time overlaps where a teacher or room is double-booked across intersecting slots.

### 3.6 Classroom Journal & Attendance Tracking (ATT)

* **`[REQ-ATT-001]` Physical Journal Matrix View:** The attendance screen (`/dashboard/attendance`) shall render a high-density grid showing students in rows and session dates in columns.
* **`[REQ-ATT-002]` Discrete Attendance States:** Teachers shall record session attendance using 4 states: `present` (green), `absent` (red), `excused` (amber), and `late` (blue).
* **`[REQ-ATT-003]` Absence Annotation & Parent Call:** Marking an absence shall prompt for comments and offer a one-click parent telephone call widget.

### 3.7 Invoicing, Subscriptions & Debt Tracking (BIL)

* **`[REQ-BIL-001]` Automated Monthly Invoicing:** The billing engine shall generate monthly recurring tuition invoices for enrolled students according to group tuition fees.
* **`[REQ-BIL-002]` Invoice Lifecycle & Payments:** Invoices shall transition through `unpaid` -> `partially_paid` -> `paid` (or `overdue`), recording cash, card, and bank transfer payments.
* **`[REQ-BIL-003]` Executive Financial KPIs:** The dashboard shall display live metrics for confirmed collections, total invoiced volume, and active overdue debt.
* **`[REQ-BIL-004]` Subscription Audit Cron:** A background job (`cronSubscriptions.ts`) shall identify unbilled active subscriptions and flag overdue accounts.

### 3.8 Interactive Learning Platform (LMS)

* **`[REQ-LMS-001]` Scoped Student Curriculum:** Students in `apps/learn` shall only access learning resources and tasks for courses in which they have active group enrollments.
* **`[REQ-LMS-002]` Lesson Presentation Delivery:** The curriculum viewer shall deliver uploaded slide presentations (`.pptx`), embed video lessons, and display interactive tasks.
* **`[REQ-LMS-003]` Homework Submissions & Grading:** Students shall submit assignments online, and instructors shall evaluate submissions with numeric marks and feedback.

### 3.9 Physical Door Control & Public Landing (IOT / LND / I18N)

* **`[REQ-IOT-001]` Tasmota Door Controller:** The portal shall interface with Tasmota WiFi relays, sending a 2.5-second pulse to unlock the front door electric strike with automatic relock.
* **`[REQ-IOT-002]` Hardware Network Guard:** IoT HTTP requests shall enforce `AbortSignal.timeout(3000)` and toggle debouncing to protect physical hardware and prevent server thread blocking.
* **`[REQ-LND-001]` Public Showcase & Pilot Form:** `apps/landing` shall showcase programs and provide a modal form (*«Solicită Acces Pilot»*) submitting leads to `/api/lead`.
* **`[REQ-I18N-001]` Bilingual Interface Toggle:** The portal shall provide a reactive language switcher between Romanian (`RO`) and Russian (`RU`), persisting in browser storage.

---

## 4. Non-Functional Requirements (NFR)

* **`[NFR-SEC-001]` Cryptographic Storage:** User passwords must be stored as bcrypt hashes. Plaintext passwords must never be logged or persisted.
* **`[NFR-SEC-002]` Security Headers:** HTTP responses must include `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and a strict `Permissions-Policy`.
* **`[NFR-PERF-001]` Query Latency:** Routine tRPC read queries (`student.list`, `group.list`, `billing.getInvoicesSummary`) must respond in < 150ms under standard pooler load.
* **`[NFR-REL-001]` Code Quality & Tests:** The codebase must maintain 100% passing automated unit and integration tests (343 tests) and 0 linter errors (`oxlint`).
* **`[NFR-UI-001]` Monochrome Enterprise Design:** All interfaces must strictly adhere to `docs/DESIGN_SYSTEM.md` (Slate palette `bg-slate-50`, no rainbow gradients, no glowing orbs).
* **`[NFR-MNT-001]` File Budget:** No source code file shall exceed 350 lines of code.

---

## 5. Requirements Traceability Matrix (RTM)

| Requirement ID | Primary Implementation File(s) | Verification Test Suite | Status |
|:---|:---|:---|:---:|
| `REQ-AUTH-001..005` | `packages/auth/src/index.ts`, `apps/portal/src/server/trpc.ts` | `pilotAccounts.test.ts`, `e2e/sso.spec.ts` | **VERIFIED** |
| `REQ-TEN-001..004` | `packages/db/src/tenantSchema.ts`, `apps/portal/src/server/tenantDb.ts` | `tenantSchema.test.ts`, `tenantDb.test.ts` | **VERIFIED** |
| `REQ-STU-001..004` | `apps/portal/src/server/routers/student.ts`, `apps/portal/src/lib/phone.ts` | `student.test.ts`, `phone.test.ts` | **VERIFIED** |
| `REQ-CSV-001..004` | `apps/portal/src/lib/studentCsvParser.ts`, `studentBulkImportService.ts` | `studentCsvParser.test.ts`, `studentBulkImportService.test.ts` | **VERIFIED** |
| `REQ-CRS-001..004` | `apps/portal/src/server/routers/course.ts`, `group.ts`, `conflictChecker.ts` | `course.test.ts`, `group.test.ts`, `conflictChecker.test.ts` | **VERIFIED** |
| `REQ-ATT-001..003` | `apps/portal/src/server/routers/attendance.ts`, `apps/portal/src/lib/absence.ts` | `attendance.test.ts`, `absence.test.ts` | **VERIFIED** |
| `REQ-BIL-001..004` | `apps/portal/src/server/routers/billing.ts`, `recurringBillingService.ts` | `billing.test.ts`, `subscriptionCronService.test.ts` | **VERIFIED** |
| `REQ-LMS-001..003` | `apps/learn/src/server/routers/course.ts`, `curriculum.ts`, `submission.ts` | `curriculum.test.ts`, `submission.test.ts` | **VERIFIED** |
| `REQ-IOT-001..002` | `apps/portal/src/server/tasmota.ts`, `apps/portal/src/app/api/door/route.ts` | `tasmota.test.ts` | **VERIFIED** |
| `REQ-LND-001` | `apps/landing/src/app/page.tsx`, `apps/landing/src/app/api/lead/route.ts` | Production Edge Build | **VERIFIED** |
| `REQ-I18N-001` | `apps/portal/src/lib/i18n.ts`, `apps/portal/src/lib/autoTranslate.ts` | `i18n.test.ts` | **VERIFIED** |
| `NFR-SEC..MNT` | Monorepo root configuration (`oxlintrc.json`, `vitest.config.ts`) | Full CI Test Run (343 tests passed) | **VERIFIED** |
