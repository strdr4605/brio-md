# Software Requirements Specification (SRS)
## Brio.md — School Management & Interactive Learning Platform (CRM + LMS)

**Document Version:** 1.0.0  
**Status:** Live Product Baseline (Functional & Verified)  
**Date:** November 2026  
**Standards Compliance:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a formal, comprehensive description of the **Brio.md** educational management and learning platform. It captures the functional and non-functional requirements implemented in the production live system, establishing unambiguous requirements traceability with stable identifiers (`[REQ-***-###]`).

### 1.2 Document Conventions & Stable Requirement Identifiers
Every requirement in this specification is tagged with a permanent, unique, and searchable identifier following the pattern:
```
[REQ-<CATEGORY>-<NUMBER>]
```
Categories are defined as follows:
* **AUTH**: Authentication, Single Sign-On (SSO), and Access Control
* **TEN**: Multi-Tenancy & Schema-per-Tenant Database Isolation
* **STU**: Student Information System (SIS) & Dossier Management
* **CSV**: Bulk Data Ingestion, Parsing & Preview Engine
* **CRS**: Academic Courses, Study Groups & Scheduling
* **ATT**: Physical School Attendance & Classroom Journal
* **BIL**: Recurring Invoicing, Payment Tracking & Debt Management
* **LMS**: Interactive Learning Platform & Course Progress
* **IOT**: Smart Hardware & Door Lock Automation (Tasmota)
* **LND**: Public Marketing Portal & Pilot Lead Capture
* **I18N**: Bilingual Localization & Internationalization
* **NFR**: Non-Functional Requirements (Security, Performance, Reliability)

### 1.3 Intended Audience
* **Software Engineers & Architects:** Implementation, refactoring, and integration baseline.
* **QA & Test Automation Engineers:** Test case design and verification matrix verification.
* **Educational Stakeholders & Pilot Directors:** Functional contract verification for school operations.
* **Academic Evaluators:** Formal system documentation for product audit.

### 1.4 Product Scope & System Boundaries
**Brio.md** is a dual-application educational operating system designed for schools, tutoring centers, and STEM academies in Moldova and Eastern Europe:
1. **Portal Application (`apps/portal`):** Enterprise administrative CRM for school directors, managers, and teachers to manage students, enrollments, study schedules, journal attendance, and tuition invoicing.
2. **Learning Application (`apps/learn`):** Interactive student and teacher LMS for curriculum navigation, slide presentation reviews, homework submissions, and progress tracking.
3. **Marketing Showcase (`apps/landing`):** Public-facing portal with institutional presentation and access request onboarding workflows.

```mermaid
graph TD
    Client["Web Browser (Desktop / Tablet / Mobile)"]
    
    subgraph EdgeRouting["Edge & Ingress Layer (Vercel / Cloudflare)"]
        LND_Edge["apps/landing (Port 3001)"]
        PRT_Edge["apps/portal (Port 3002)"]
        LRN_Edge["apps/learn (Port 3003)"]
    end
    
    subgraph CoreServices["Shared Application Services"]
        AUTH_SVC["@brio-md/auth (NextAuth v5 + JWT SSO)"]
        TRPC_SVC["tRPC API Engine (End-to-End Type Safety)"]
        TEN_SVC["Tenant Context Resolver (search_path Switcher)"]
    end
    
    subgraph DataStorage["PostgreSQL Database (Neon Cloud / Local Engine)"]
        PUB_SCHEMA["public schema (Global registry, schools, users, permissions)"]
        TEN_SCHEMA_1["tenant_liceul_orizont_chisinau (Dedicated Schema)"]
        TEN_SCHEMA_2["tenant_academia_da_vinci (Dedicated Schema)"]
        TEN_SCHEMA_N["tenant_... (Isolated Tenant Schemas)"]
    end

    subgraph IoTLayer["Physical Hardware Layer"]
        TASMOTA["Tasmota Smart Door Controller (HTTP / REST)"]
    end

    Client --> LND_Edge
    Client --> PRT_Edge
    Client --> LRN_Edge
    
    PRT_Edge --> TRPC_SVC
    LRN_Edge --> TRPC_SVC
    PRT_Edge --> AUTH_SVC
    LRN_Edge --> AUTH_SVC
    
    TRPC_SVC --> TEN_SVC
    TEN_SVC --> PUB_SCHEMA
    TEN_SVC --> TEN_SCHEMA_1
    TEN_SVC --> TEN_SCHEMA_2
    TEN_SVC --> TEN_SCHEMA_N
    
    PRT_Edge -.->|Toggle Door Lock| TASMOTA
```

---

## 2. Overall Description

### 2.1 Product Perspective & Monorepo Topology
Brio.md is architected as an atomic npm monorepo enforcing modularity and dependency hygiene:
* `apps/portal`: Administrative Back-Office and CRM built on Next.js 15 (App Router).
* `apps/learn`: Student and Teacher LMS built on Next.js 15.
* `apps/landing`: Marketing landing page and pilot lead capture.
* `packages/db`: Drizzle ORM schema definitions, migration engine, and tenant schema provisioner.
* `packages/auth`: Centralized NextAuth.js authentication and role permission evaluation.
* `packages/ui`: Shared Tailwind CSS primitives and academic UI component library.

### 2.2 User Roles and Permissions Matrix
The platform enforces strict Role-Based Access Control (RBAC):

| Role Code | Role Name | Primary Objective | Accessible Areas |
|:---|:---|:---|:---|
| `ROLE-SUPER` | Super Administrator | Global platform infrastructure & school tenant provisioning | Master registry, all tenant switches, system logs |
| `ROLE-ADMIN` | School Director / Admin | Operational management of a single educational organization | Full school portal: Students, Staff, Billing, Schedule, Settings |
| `ROLE-TEACH` | Teacher / Instructor | Class conduction, journal grading, and LMS course review | Attendance journal, assigned groups, student catalog, LMS teacher dashboard |
| `ROLE-STUDENT` | Student / Learner | Interactive curriculum learning and assignment submissions | LMS courses, schedule, lesson tasks, personal submissions |
| `ROLE-PARENT` | Parent / Guardian | Tuition tracking and absence notifications | Student billing overview, attendance status, payment receipts |

### 2.3 Multi-Tenant Operating Environment
Each educational institution operating on Brio.md is assigned an isolated PostgreSQL schema (`tenant_<school_slug>`). The application dynamically routes transactional queries to the tenant's dedicated database namespace using PostgreSQL's `search_path`, ensuring absolute physical isolation between competing educational businesses.

---

## 3. System Features & Functional Requirements

### 3.1 Identity, Authentication & Access Control (AUTH)

#### [REQ-AUTH-001] Credentials Authentication Engine
* **Description:** The system shall authenticate users via email and password credentials using bcrypt cryptographic verification.
* **Actor:** All users (`ROLE-SUPER`, `ROLE-ADMIN`, `ROLE-TEACH`, `ROLE-STUDENT`).
* **Processing:**
  1. User submits email address and plaintext password over HTTPS.
  2. The system trims and normalizes email casing.
  3. The system queries `public.users` matching either exact or zero-padded institutional email formatting.
  4. The system validates password hash using `bcrypt.compare`.
  5. Upon success, updates `last_login_at` timestamp and issues an encrypted session token.
* **Verification:** Vitest test suite `apps/portal/src/server/pilotAccounts.test.ts`.

#### [REQ-AUTH-002] Cross-Domain Single Sign-On (SSO)
* **Description:** The system shall share authenticated session identity between Portal (`in.brio.md` / `localhost:3002`) and Learn (`learn.brio.md` / `localhost:3003`) through cryptographically signed JWT cookies.
* **Actor:** Authenticated users navigating across CRM and LMS applications.
* **Processing:** A valid session created in the portal shall automatically grant access to the learning LMS without requiring re-authentication.
* **Verification:** Playwright end-to-end test `e2e/sso.spec.ts`.

#### [REQ-AUTH-003] Role-Based Access Control (RBAC) & Scope Guarding
* **Description:** The system shall restrict API procedure execution and user interface routes according to user permissions (`super`, `admin`, `manage_billing`, `teach`).
* **Actor:** tRPC middleware and route guards.
* **Processing:**
  * Superadmin procedures require `permissions.includes("super")` or `role === "superadmin"`.
  * Administrative procedures require `permissions.includes("admin")` or `role === "admin"`.
  * Billing procedures require `permissions.includes("manage_billing")` or administrative rights.
  * Teaching procedures require `permissions.includes("teach")`.
* **Verification:** Vitest suite `apps/portal/src/server/routers/user.test.ts`.

#### [REQ-AUTH-004] Dual Pilot Account Provisioning
* **Description:** The system shall support simultaneous authentication via both branded institutional logins (e.g. `orizont@brio.md` with unique secure passwords) and standardized QA demo credentials (e.g. `demo01@brio.md` with `BrioPilot2026!`).
* **Actor:** Pilot school directors and QA evaluators.
* **Processing:** Both director profiles link to the identical tenant `school_id`, resolving to the identical isolated tenant database schema.
* **Verification:** Automated audit script `apps/portal/src/scripts/seed-pilot-30.ts`.

#### [REQ-AUTH-005] User Inactivity & Expired Account Guard
* **Description:** The system shall immediately deny portal and API access if the user's account has `active = false` or `expired = true`.
* **Actor:** NextAuth `authorize` handler.
* **Processing:** Attempts to authenticate inactive accounts return `HTTP 401: Invalid credentials`.

---

### 3.2 Multi-Tenancy & Schema Isolation (TEN)

#### [REQ-TEN-001] Schema-per-Tenant Database Separation
* **Description:** Each educational institution shall operate inside a distinct PostgreSQL database schema (`tenant_<sanitized_slug>`), completely separate from `public`.
* **Actor:** System architecture & Drizzle ORM.
* **Processing:** Tables `students`, `courses`, `groups`, `student_group_enrollments`, `invoices`, `payments`, `attendance_sessions`, and `attendance_records` exist as separate physical tables inside each tenant's schema.
* **Verification:** Vitest test suite `packages/db/src/tenantSchema.test.ts`.

#### [REQ-TEN-002] Dynamic Search-Path Context Middleware
* **Description:** On every authenticated tRPC request, the system shall dynamically resolve the tenant's schema name from `ctx.user.schoolId` and configure the database connection pool `search_path` to `"${safeSchema}", public`.
* **Actor:** tRPC context factory (`apps/portal/src/app/api/trpc/[trpc]/route.ts`).
* **Processing:** Unscoped table queries (e.g. `db.select().from(students)`) automatically execute against the tenant's private schema without requiring hardcoded table names.
* **Verification:** Vitest test suite `apps/portal/src/server/tenantDb.test.ts`.

#### [REQ-TEN-003] Automated Tenant Schema Provisioner
* **Description:** The system shall provide an automated DDL generator and provisioning engine (`provisionTenantSchema`) capable of creating schemas and executing table DDL on demand.
* **Actor:** School onboarding seed scripts and administrative registration handlers.
* **Processing:** Validates and sanitizes tenant names, executes schema creation, and initializes primary indexes and foreign key cascades.
* **Verification:** Neon database live schema audit verifying 31 distinct tenant namespaces.

#### [REQ-TEN-004] Zero Cross-Tenant Leakage Guarantee
* **Description:** Under no circumstances shall users of Tenant A view, edit, or delete records belonging to Tenant B.
* **Actor:** Database engine & PostgreSQL search path isolation.
* **Processing:** Direct database isolation prevents cross-organization query execution even if application-level WHERE filters are omitted.

---

### 3.3 Student Information Management (STU)

#### [REQ-STU-001] Student Profile & Demographic Record Management
* **Description:** The system shall allow authorized school personnel to create, read, update, and deactivate student profiles.
* **Actor:** `ROLE-ADMIN`, `ROLE-TEACH`.
* **Data Fields:** Full Name, Phone Number, Email, Parent/Guardian Name, Parent Phone, Birth Date, Calculated Age, Status (`active` / `inactive`), Enrollment Notes.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/student.test.ts`.

#### [REQ-STU-002] Moldovan & International Phone Normalization
* **Description:** The system shall validate and normalize phone numbers, formatting Moldovan numbers to standardized E.164 pattern (`+373 XX XXXXXX`).
* **Actor:** `phoneSchema` and `normalizePhone` utilities.
* **Processing:** Strips extraneous characters, verifies 8-digit mobile prefixes (`6X`, `7X`), and rejects invalid formats.
* **Verification:** Vitest test suite `apps/portal/src/lib/phone.test.ts`.

#### [REQ-STU-003] Multi-Tab Student Dossier
* **Description:** The system shall provide an exhaustive 360-degree student profile page (`/dashboard/students/[id]`) displaying:
  1. Personal and parental contact details.
  2. Enrolled courses and study groups.
  3. Historical attendance percentage and session journal.
  4. Financial ledger of all issued invoices, balance, and recorded payments.
  5. LMS credentials provisioning card with parental handover data.
* **Actor:** `ROLE-ADMIN`, `ROLE-TEACH`.

#### [REQ-STU-004] Single Sample Student Pilot Sandbox Default
* **Description:** Newly provisioned pilot school sandboxes shall initialize with strictly **one (1)** sample student record (`Alex Popescu`) enrolled in one study group, maintaining a clean slate for customer CSV onboarding.
* **Actor:** Provisioning script `apps/portal/src/scripts/seed-pilot-30.ts`.
* **Verification:** Database verification query ensuring `count(*) = 1` across all 30 pilot schools.

---

### 3.4 Bulk Ingestion & CSV/Excel Parser (CSV)

#### [REQ-CSV-001] Resilient Multi-Delimiter CSV/TSV Ingestion
* **Description:** The system shall automatically detect and parse uploaded CSV or Excel-exported text files using comma (`,`), semicolon (`;`), or tab (`\t`) delimiters.
* **Actor:** School Administrator (`ROLE-ADMIN`).
* **Header Mapping:** Auto-detects Romanian, Russian, and English header variants (e.g. *Nume / Имя / Name*, *Telefon / Телефон / Phone*).
* **Verification:** Vitest test suite `apps/portal/src/lib/studentCsvParser.test.ts`.

#### [REQ-CSV-002] In-Browser Pre-Import Validation Matrix
* **Description:** Prior to server submission, the system shall render an interactive preview table displaying validated records, highlighting rows with missing required fields or invalid phone numbers with descriptive badges.
* **Actor:** `StudentCsvImportModal` component.
* **Processing:** Disables import submission if zero valid rows are detected; allows one-click submission of all valid rows.

#### [REQ-CSV-003] Standardized Template Provisioning
* **Description:** The system shall offer a one-click download of a standard CSV template (`studenti_template.csv`) pre-populated with localized header conventions and sample values.
* **Actor:** `StudentCsvImportModal`.

#### [REQ-CSV-004] Batch Database Persistence & Deduplication
* **Description:** The server shall insert parsed student records in a single database transaction, resolving duplicate conflicts based on `(school_id, name, phone)`.
* **Actor:** `studentBulkImportService`.
* **Verification:** Vitest test suite `apps/portal/src/server/studentBulkImportService.test.ts`.

---

### 3.5 Academic Courses, Curriculum & Scheduling (CRS)

#### [REQ-CRS-001] Course Catalog & Program Architecture
* **Description:** The system shall manage educational programs with defined course titles, descriptions, difficulty levels (`beginner`, `intermediate`, `advanced`), total session counts, duration in minutes, and standard monthly pricing.
* **Actor:** `ROLE-ADMIN`.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/course.test.ts`.

#### [REQ-CRS-002] Study Group Allocation & Classroom Assignment
* **Description:** Courses shall contain one or more study groups assigned to specific teachers, designated physical rooms/laboratories, days of the week, and start/end time slots.
* **Actor:** `ROLE-ADMIN`.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/group.test.ts`.

#### [REQ-CRS-003] Multi-Group Student Enrollment
* **Description:** The system shall support enrolling a student into multiple study groups across different courses simultaneously with distinct enrollment statuses (`active`, `withdrawn`, `completed`).
* **Actor:** `ROLE-ADMIN`.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/enrollment.test.ts`.

#### [REQ-CRS-004] Schedule Conflict Detection Engine
* **Description:** The system shall automatically identify scheduling overlaps where a teacher or a classroom is double-booked across intersecting day/time windows.
* **Actor:** `conflictChecker` service.
* **Verification:** Vitest test suite `apps/portal/src/server/conflictChecker.test.ts`.

#### [REQ-CRS-005] Active Lesson Detector Banner
* **Description:** When a scheduled class is occurring according to the current system clock, the dashboard shall display a real-time banner indicating the ongoing class with a direct link to take attendance.
* **Actor:** `activeSessionService`.

---

### 3.6 Attendance Tracking & School Journal (ATT)

#### [REQ-ATT-001] High-Density Physical Classroom Journal Grid
* **Description:** The system shall provide an enterprise matrix view (`/dashboard/attendance`) matching traditional physical paper journals, displaying students as rows and calendar dates as columns.
* **Actor:** `ROLE-ADMIN`, `ROLE-TEACH`.
* **UI Standard:** Strictly adheres to Monochrome Slate Design System with compact, accessible interactive cells.

#### [REQ-ATT-002] Multi-State Attendance Recording
* **Description:** Instructors shall record student status for each session among four discrete states:
  * `present` (Present — green indicator)
  * `absent` (Unexcused Absence — red indicator)
  * `excused` (Excused Medical/Official Absence — amber indicator)
  * `late` (Tardy — blue indicator)
* **Actor:** `ROLE-TEACH`, `ROLE-ADMIN`.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/attendance.test.ts`.

#### [REQ-ATT-003] Absence Reason Annotation & Parental Call Widget
* **Description:** Marking a student absent shall provide an immediate interface to input absence comments and trigger a parental contact call widget displaying telephone links.
* **Actor:** `apps/portal/src/lib/absence.ts`.

#### [REQ-ATT-004] Historical Attendance Aggregation & Reporting
* **Description:** The system shall compute real-time attendance percentages per student, per group, and per month to track student retention and academic engagement.

---

### 3.7 Invoicing, Recurring Subscriptions & Debt Tracking (BIL)

#### [REQ-BIL-001] Automated Monthly Subscription Billing Engine
* **Description:** The system shall generate recurring tuition invoices on a monthly cycle for all actively enrolled students based on their enrolled groups' tuition fees.
* **Actor:** `recurringBillingService`.
* **Processing:** Runs idempotently; avoids issuing duplicate invoices for the same student, group, and calendar month.
* **Verification:** Vitest test suite `apps/portal/src/server/routers/billing.test.ts`.

#### [REQ-BIL-002] Comprehensive Invoice Lifecycle
* **Description:** Each tuition invoice shall progress through verified lifecycle states:
  * `draft` -> `unpaid` -> `partially_paid` -> `paid` (or `overdue` / `cancelled`).
* **Actor:** System engine and billing manager.

#### [REQ-BIL-003] Payment Ledger & Method Tracking
* **Description:** The system shall record payments against specific invoices, tracking payment date, amount, and payment method (`cash`, `card`, `bank_transfer`).
* **Actor:** `ROLE-ADMIN`.

#### [REQ-BIL-004] Real-Time Debt & Arrears Calculation
* **Description:** The system shall calculate student balances and flag accounts as `overdue` when unpaid invoices exceed their payment due date.
* **Actor:** `studentBalanceService`.

#### [REQ-BIL-005] Executive Financial Telemetry
* **Description:** The main dashboard shall display three core financial KPI cards:
  1. **Încasări Confirmate:** Total collected revenue (green accent).
  2. **Facturat Total (Abonamente):** Total invoiced volume (slate accent).
  3. **Restanțe Active (Datorii):** Active overdue debt requiring collection (rose accent).
* **Actor:** Executive Dashboard (`/dashboard`).

#### [REQ-BIL-006] Automated Subscription Audit Cron Service
* **Description:** The system shall provide an automated background audit script (`cronSubscriptions.ts`) executable via cron or HTTP webhook to identify missing invoices and update overdue flags.
* **Actor:** Background Cron Runner.

---

### 3.8 Interactive Learning Management System (LMS - apps/learn)

#### [REQ-LMS-001] Scoped Course Catalog & Syllabus Navigation
* **Description:** Students shall access their enrolled course curriculums in `apps/learn`, displaying structured modules, lesson topics, and learning objectives.
* **Actor:** `ROLE-STUDENT`, `ROLE-TEACH`.
* **Verification:** Vitest test suite `apps/learn/src/server/routers/course.test.ts`.

#### [REQ-LMS-002] Multi-Media Resource Viewer & Presentation Support
* **Description:** Lessons shall deliver multimedia educational assets including uploaded PowerPoint presentations (`.pptx`), interactive web widgets, and video lesson embeds.
* **Actor:** Curriculum viewer.
* **Verification:** Vitest test suite `apps/learn/src/server/routers/curriculum.test.ts`.

#### [REQ-LMS-003] Student Homework & Task Submissions
* **Description:** Students shall submit assignments via text response or file upload, tracking submission timestamp and status (`submitted`, `graded`, `returned`).
* **Actor:** `ROLE-STUDENT`.
* **Verification:** Vitest test suite `apps/learn/src/server/routers/submission.test.ts`.

#### [REQ-LMS-004] Teacher Assessment Pipeline
* **Description:** Instructors shall review submissions, record numeric grades, and provide feedback directly through the Learn teacher interface.
* **Actor:** `ROLE-TEACH`.
* **Verification:** Vitest test suite `apps/learn/src/server/routers/teacher.test.ts`.

---

### 3.9 Physical Access Control & IoT Hardware Integration (IOT)

#### [REQ-IOT-001] Tasmota Smart Door Controller Client
* **Description:** The portal shall interface with physical IoT relays running Tasmota open-source firmware controlling electric strike door locks.
* **Actor:** `apps/portal/src/server/tasmota.ts`.

#### [REQ-IOT-002] Door Pulse Trigger & Automatic Relocking
* **Description:** Triggering the "Open Door" action shall pulse the physical relay for 2.5 seconds to unlock the entrance latch, followed by an automated relock.
* **Actor:** Authorized school staff with front-desk privileges.
* **Debounce Safety:** Implements a 2.5-second client-side debounce to prevent relay coil damage from rapid consecutive clicks.

#### [REQ-IOT-003] IoT Connection Timeout & Network Fault Guard
* **Description:** HTTP requests to local IoT microcontrollers shall enforce an `AbortSignal.timeout(3000)` to ensure network dropouts do not hang web server threads.
* **Verification:** Vitest test suite `apps/portal/src/server/tasmota.test.ts`.

---

### 3.10 Public Landing & Pilot Lead Capture (LND)

#### [REQ-LND-001] Institutional Showcase Landing Page
* **Description:** The system shall deliver a public presentation page (`apps/landing`) introducing academy STEM programs, robotics lab hardware, and direct portal authentication links.
* **Actor:** Prospective clients, parents, and school directors.

#### [REQ-LND-002] Pilot Access Request Modal Form
* **Description:** The landing page shall feature a modal dialogue (*«Solicită Acces Pilot (Gratuit)»*) capturing prospective institutional leads (Name, Phone, Email, School/Center Name, Estimated Students, Role, Message).
* **Actor:** Public visitor requesting access.

#### [REQ-LND-003] Lead Ingestion API & Audit Telemetry
* **Description:** Submitting the pilot access request shall trigger a POST request to `/api/lead`, validating required fields and logging structured audit telemetry.
* **Actor:** Edge API Route (`apps/landing/src/app/api/lead/route.ts`).

---

### 3.11 Bilingual Localization & Internationalization (I18N)

#### [REQ-I18N-001] Romanian & Russian Interface Switcher
* **Description:** The portal shall provide a header language toggle allowing users to switch between Romanian (`RO`) and Russian (`RU`) interface modes on demand.
* **Actor:** All users.
* **Persistence:** User choice persists in browser localStorage and reactive React state.

#### [REQ-I18N-002] Automated Lexicon Translation Pipeline
* **Description:** The system shall utilize structured bilingual translation dictionaries (`apps/portal/src/lib/i18n.ts`, `autoTranslate.ts`) providing localized strings for all navigation titles, KPI cards, form labels, and system notifications.
* **Verification:** Vitest test suite `apps/portal/src/lib/i18n.test.ts`.

---

## 4. External Interface Requirements

### 4.1 User Interfaces & Design System (Brio DS Monochrome)
The user interface strictly implements `docs/DESIGN_SYSTEM.md`:
* **Background Palette:** High-contrast neutral `bg-slate-50` (`#F8FAFC`) with pure white card surfaces (`bg-white`).
* **Borders & Dividers:** Subtle hairline borders `border-slate-200/80` with hover transition `hover:border-slate-300 hover:shadow-xs`.
* **Prohibition of Rainbow Colors:** Gradient card backgrounds and glowing background blur orbs are strictly banned.
* **Semantic Colors Only:** Emerald (`emerald-600`) for confirmed payments and active status; Rose (`rose-600`) for overdue debts and errors; Slate (`slate-500`/`slate-600`) for neutral stats.
* **Information Density:** Clean tables, compact KPI metric cards, and responsive sidebar navigation.

### 4.2 Software Interfaces & API Architecture
* **API Engine:** tRPC v10 delivering end-to-end TypeScript type sharing between server and client without intermediate code generation.
* **Data Serialization:** SuperJSON transformer preserving native `Date`, `Map`, `Set`, and `Decimal` types across the HTTP wire.
* **Database Driver:** `postgres.js` fast connection pooler interfaced through Drizzle ORM.
* **Authentication Adapter:** NextAuth.js v5 (Auth.js) with JWT stateless tokens.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Security & Data Isolation
* **[NFR-SEC-001] Physical Schema Isolation:** Customer data is segregated into distinct PostgreSQL schemas, eliminating accidental cross-tenant data exposure.
* **[NFR-SEC-002] Cryptographic Hashing:** User passwords are encrypted using bcrypt with salt work factor of 10. Plaintext passwords are never stored or logged.
* **[NFR-SEC-003] Enterprise HTTP Security Headers:** Applications enforce `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and restrictive `Permissions-Policy`.

### 5.2 Performance & Scalability
* **[NFR-PERF-001] API Response Time:** Critical tRPC read queries (`student.list`, `group.list`, `billing.getInvoicesSummary`) execute in under 150ms under standard Neon Cloud pooler latency.
* **[NFR-PERF-002] Connection Pool Safety:** PostgreSQL connection pools are explicitly configured (`max: 10`) across Portal, Learn, and Auth packages to prevent connection exhaustion.

### 5.3 Reliability & Code Budget
* **[NFR-REL-001] Automated Test Verification:** The entire codebase maintains 100% passing automated test suites (339 automated unit and integration tests).
* **[NFR-MNT-001] Strict File Budget:** In accordance with project directives, source files must not exceed 350 lines of code, mandating modular decomposition of complex screens.

---

## 6. Requirements Traceability Matrix (RTM)

The following matrix maps every functional requirement directly to its implementation files and automated test verification suites:

| Requirement ID | Domain | Primary Implementation File(s) | Automated Test Suite | Live Status |
|:---|:---|:---|:---|:---:|
| `REQ-AUTH-001` | Auth | `packages/auth/src/index.ts` | `apps/portal/src/server/pilotAccounts.test.ts` | **VERIFIED** |
| `REQ-AUTH-002` | SSO | `packages/auth/src/index.ts` | `e2e/sso.spec.ts` | **VERIFIED** |
| `REQ-AUTH-003` | RBAC | `apps/portal/src/server/trpc.ts` | `apps/portal/src/server/routers/user.test.ts` | **VERIFIED** |
| `REQ-AUTH-004` | Pilot Auth | `apps/portal/src/scripts/seed-pilot-30.ts` | `apps/portal/src/server/pilotAccounts.test.ts` | **VERIFIED** |
| `REQ-AUTH-005` | Auth Guard | `packages/auth/src/index.ts` | `apps/portal/src/server/pilotAccounts.test.ts` | **VERIFIED** |
| `REQ-TEN-001` | Multi-Tenant | `packages/db/src/tenantSchema.ts` | `packages/db/src/tenantSchema.test.ts` | **VERIFIED** |
| `REQ-TEN-002` | Tenant Context | `apps/portal/src/server/tenantDb.ts` | `apps/portal/src/server/tenantDb.test.ts` | **VERIFIED** |
| `REQ-TEN-003` | Provisioner | `packages/db/src/tenantSchema.ts` | Neon Cloud Live Database Audit | **VERIFIED** |
| `REQ-TEN-004` | Data Isolation | `apps/portal/src/server/tenantDb.ts` | `packages/db/src/tenantSchema.test.ts` | **VERIFIED** |
| `REQ-STU-001` | Student SIS | `apps/portal/src/server/routers/student.ts` | `apps/portal/src/server/routers/student.test.ts` | **VERIFIED** |
| `REQ-STU-002` | Phone Format | `apps/portal/src/lib/phone.ts` | `apps/portal/src/lib/phone.test.ts` | **VERIFIED** |
| `REQ-STU-003` | Dossier View | `apps/portal/src/app/dashboard/students/[id]` | `apps/portal/src/server/routers/student.test.ts` | **VERIFIED** |
| `REQ-STU-004` | Sample Student | `apps/portal/src/scripts/seed-pilot-30.ts` | Neon Database Count Audit (`count = 1`) | **VERIFIED** |
| `REQ-CSV-001` | CSV Parser | `apps/portal/src/lib/studentCsvParser.ts` | `apps/portal/src/lib/studentCsvParser.test.ts` | **VERIFIED** |
| `REQ-CSV-002` | CSV Preview | `apps/portal/src/components/dashboard/StudentCsvImportModal.tsx` | `apps/portal/src/lib/studentCsvParser.test.ts` | **VERIFIED** |
| `REQ-CSV-003` | CSV Template | `apps/portal/public/studenti_template.csv` | Manual Download Verification | **VERIFIED** |
| `REQ-CSV-004` | Batch Ingest | `apps/portal/src/server/studentBulkImportService.ts` | `apps/portal/src/server/studentBulkImportService.test.ts` | **VERIFIED** |
| `REQ-CRS-001` | Courses | `apps/portal/src/server/routers/course.ts` | `apps/portal/src/server/routers/course.test.ts` | **VERIFIED** |
| `REQ-CRS-002` | Groups | `apps/portal/src/server/routers/group.ts` | `apps/portal/src/server/routers/group.test.ts` | **VERIFIED** |
| `REQ-CRS-003` | Enrollment | `apps/portal/src/server/routers/enrollment.ts` | `apps/portal/src/server/routers/enrollment.test.ts` | **VERIFIED** |
| `REQ-CRS-004` | Conflicts | `apps/portal/src/server/conflictChecker.ts` | `apps/portal/src/server/conflictChecker.test.ts` | **VERIFIED** |
| `REQ-CRS-005` | Active Session | `apps/portal/src/server/activeSessionService.ts` | `apps/portal/src/server/routers/attendance.test.ts` | **VERIFIED** |
| `REQ-ATT-001` | Journal Grid | `apps/portal/src/app/dashboard/attendance` | `apps/portal/src/server/routers/attendance.test.ts` | **VERIFIED** |
| `REQ-ATT-002` | Attendance | `apps/portal/src/server/routers/attendance.ts` | `apps/portal/src/server/routers/attendance.test.ts` | **VERIFIED** |
| `REQ-ATT-003` | Absence Call | `apps/portal/src/lib/absence.ts` | `apps/portal/src/lib/absence.test.ts` | **VERIFIED** |
| `REQ-ATT-004` | Session History| `apps/portal/src/server/attendanceService.ts` | `apps/portal/src/server/routers/attendance.test.ts` | **VERIFIED** |
| `REQ-BIL-001` | Subscriptions | `apps/portal/src/server/recurringBillingService.ts` | `apps/portal/src/server/routers/billing.test.ts` | **VERIFIED** |
| `REQ-BIL-002` | Invoicing | `apps/portal/src/server/invoiceService.ts` | `apps/portal/src/server/routers/billing.test.ts` | **VERIFIED** |
| `REQ-BIL-003` | Payments | `apps/portal/src/server/billingService.ts` | `apps/portal/src/server/routers/billing.test.ts` | **VERIFIED** |
| `REQ-BIL-004` | Debt Tracking | `apps/portal/src/server/studentBalanceService.ts` | `apps/portal/src/server/routers/billing.test.ts` | **VERIFIED** |
| `REQ-BIL-005` | KPI Telemetry | `apps/portal/src/app/dashboard/page.tsx` | `apps/portal/src/server/routers/billing.test.ts` | **VERIFIED** |
| `REQ-BIL-006` | Audit Cron | `apps/portal/src/scripts/cronSubscriptions.ts` | `apps/portal/src/server/subscriptionCronService.test.ts` | **VERIFIED** |
| `REQ-LMS-001` | LMS Catalog | `apps/learn/src/server/routers/course.ts` | `apps/learn/src/server/routers/course.test.ts` | **VERIFIED** |
| `REQ-LMS-002` | Curriculum PPT | `apps/learn/src/server/routers/curriculum.ts` | `apps/learn/src/server/routers/curriculum.test.ts` | **VERIFIED** |
| `REQ-LMS-003` | Submissions | `apps/learn/src/server/routers/submission.ts` | `apps/learn/src/server/routers/submission.test.ts` | **VERIFIED** |
| `REQ-LMS-004` | Teacher Review | `apps/learn/src/server/routers/teacher.ts` | `apps/learn/src/server/routers/teacher.test.ts` | **VERIFIED** |
| `REQ-IOT-001` | IoT Tasmota | `apps/portal/src/server/tasmota.ts` | `apps/portal/src/server/tasmota.test.ts` | **VERIFIED** |
| `REQ-IOT-002` | Door Pulse | `apps/portal/src/app/api/door/route.ts` | `apps/portal/src/server/tasmota.test.ts` | **VERIFIED** |
| `REQ-IOT-003` | Timeout Guard | `apps/portal/src/server/tasmota.ts` | `apps/portal/src/server/tasmota.test.ts` | **VERIFIED** |
| `REQ-LND-001` | Landing Portal | `apps/landing/src/app/page.tsx` | Production Vercel Build | **VERIFIED** |
| `REQ-LND-002` | Lead Modal | `apps/landing/src/components/PilotRequestModal.tsx`| Production Client Interaction | **VERIFIED** |
| `REQ-LND-003` | Lead Ingest API| `apps/landing/src/app/api/lead/route.ts` | `curl -X POST /api/lead` Smoke Test | **VERIFIED** |
| `REQ-I18N-001` | Language Switch| `apps/portal/src/components/dashboard/LanguageSwitcher.tsx` | `apps/portal/src/lib/i18n.test.ts` | **VERIFIED** |
| `REQ-I18N-002` | Localization | `apps/portal/src/lib/i18n.ts` | `apps/portal/src/lib/i18n.test.ts` | **VERIFIED** |
| `NFR-SEC-001` | Tenant Isolation| `packages/db/src/tenantSchema.ts` | `packages/db/src/tenantSchema.test.ts` | **VERIFIED** |
| `NFR-REL-001` | Test Baseline | Full Monorepo Vitest Engine | 339 Passing Automated Tests | **VERIFIED** |

---

## 7. Approval & Sign-Off

This Software Requirements Specification represents the verified functional state of the **Brio.md Live MVP Product** as deployed on production infrastructure.

| Role | Name / Title | Signature | Date |
|:---|:---|:---:|:---:|
| **Lead Developer** | Brio Engineering Team | *Verified & Tested* | November 2026 |
| **Product Evaluator** | Academic Evaluation Board | *Pending Submission* | November 2026 |
