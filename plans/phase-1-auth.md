# Phase 1: Deployable Auth Foundation

## Goal

Three Next.js apps deployed on single VPS with Kamal v2:

| App     | URL             | Purpose                             |
| ------- | --------------- | ----------------------------------- |
| Landing | `brio.md`       | Public marketing page (hello world) |
| Portal  | `in.brio.md`    | Admin/Teachers (Auth.js SSO)        |
| Learn   | `learn.brio.md` | Students (Auth.js SSO)              |

- PostgreSQL database (`brio_md`)
- Auth.js with SSO (users logged in once, access both portals)
- PBAC permissions
- Course assignments for teachers

**Not in scope:** Business logic (contracts, payments, attendance, course content)

---

## Decisions

| Item       | Decision                                 |
| ---------- | ---------------------------------------- |
| Apps       | 3 apps (landing + portal + learn)        |
| DB name    | `brio_md`                                |
| Deployment | Single VPS (Hostinger) + Kamal v2        |
| Domains    | `brio.md`, `in.brio.md`, `learn.brio.md` |
| CSS        | Tailwind CSS                             |
| Auth       | Auth.js with SSO (credentials provider)  |

---

## Architecture

```
                    ┌─────────────────────────┐
                    │    PostgreSQL (brio_md) │
                    └────────────┬────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌──────────┐            ┌──────────────┐            ┌──────────────┐
│  Landing │            │    Portal    │            │    Learn     │
│ brio.md  │            │  in.brio.md  │            │learn.brio.md │
│  (hello  │            │ (Auth.js SSO)│            │ (Auth.js SSO)│
│  world)  │            └──────┬───────┘            └──────┬───────┘
└──────────┘                   │                             │
                               └──────────┬──────────────────┘
                                          │
                                    ┌─────────────┐
                                    │  Auth.js    │
                                    │    SSO      │
                                    └─────────────┘
```

### Landing (`brio.md`)

- Simple hello world marketing page
- Links to login for both portals

### Portal (`in.brio.md`)

- Admin/Teacher dashboard
- Full management features
- Permissions: `super`, `admin`, `teach`

### Learn (`learn.brio.md`)

- Teacher/Student course view
- View assigned courses
- For now: simple placeholder

---

## Database Schema

### Tables

```sql
-- 1. Schools (for admin assignment)
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Courses (for teacher assignment - Phase 1 minimal)
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  school_id INTEGER REFERENCES schools(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Users (Auth.js compatible + PBAC)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role TEXT DEFAULT 'teacher',              -- superadmin, admin, teacher
  permissions TEXT[] DEFAULT '{}',         -- ['super'], ['admin'], ['view'], etc.
  course_ids INTEGER[] DEFAULT '{}',       -- Courses this teacher can teach
  school_id INTEGER REFERENCES schools(id),
  phone VARCHAR(50),
  info TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Students (separate table - may not have login yet)
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  school_id INTEGER REFERENCES schools(id),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  info TEXT,
  class_id INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Auth.js adapter tables (SSO)
CREATE TABLE accounts (...);
CREATE TABLE sessions (...);
CREATE TABLE users_accounts (...);
CREATE TABLE verification_tokens (...);
```

---

## Access Control

### User Viewing Permissions

| Viewer     | Can See                                   |
| ---------- | ----------------------------------------- |
| SuperAdmin | All users (all schools)                   |
| Admin      | Teachers and students (their school only) |
| Teacher    | Own profile only                          |

### Course Assignment

- `course_ids` array on users table
- Admin/SuperAdmin can assign courses to teachers
- Teachers see only courses they are assigned to (in learn.brio.md)

### Permissions (PBAC)

| Permission | Description                     |
| ---------- | ------------------------------- |
| `super`    | Full access to everything       |
| `admin`    | Manage school users and courses |
| `teach`    | Teach assigned courses          |
| `view`     | View assigned data              |

---

## Project Structure

```
brio-md/
├── apps/
│   ├── landing/              # Landing page (brio.md)
│   │   ├── src/
│   │   │   └── app/
│   │   │       └── page.tsx  # Hello world
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── portal/               # Admin/Teacher (in.brio.md)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx        # Login (front page)
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx    # Dashboard (after login)
│   │   │   ├── components/
│   │   │   ├── db/
│   │   │   ├── lib/
│   │   │   └── server/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── learn/                # Teacher/Student (learn.brio.md)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx        # Login (front page)
│       │   │   └── courses/
│       │   │       └── page.tsx    # Courses (after login)
│       │   ├── components/
│       │   ├── db/
│       │   ├── lib/
│       │   └── server/
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── db/                   # Shared database schema
│       └── src/
│           └── schema.ts    # Drizzle schema
│
├── packages/
│   └── auth/                 # Shared Auth.js config
│
├── docker-compose.yml
├── config/
│   └── deploy.yml            # Kamal config (3 apps)
└── package.json
```

---

## Tech Stack

| Layer     | Choice                         |
| --------- | ------------------------------ |
| Framework | Next.js 16                     |
| Database  | PostgreSQL 16                  |
| ORM       | Drizzle ORM                    |
| Auth      | Auth.js v5 (credentials + SSO) |
| API       | tRPC v11                       |
| State     | React Query v5                 |
| CSS       | Tailwind v4                    |
| Deploy    | Docker + Kamal v2              |

---

## Implementation Steps

### Step 1: Setup Workspace

- [ ] Root `package.json` with npm workspaces
- [ ] Shared packages (`packages/db`)
- [ ] Install dependencies

### Step 2: Database

- [ ] `schools`, `courses`, `users`, `students` tables
- [ ] Auth.js adapter tables
- [ ] PostgreSQL connection

### Step 3: Shared Auth Package

- [ ] Auth.js configuration with SSO
- [ ] Session callback with role + permissions + course_ids

### Step 4: Portal App (`in.brio.md`)

- [ ] Login page (front page)
- [ ] Dashboard (SuperAdmin: all users, Admin: school users)
- [ ] User management (set permissions, assign courses)
- [ ] tRPC routes with PBAC

### Step 5: Learn App (`learn.brio.md`)

- [ ] Login page (front page, SSO)
- [ ] Courses page (shows assigned courses based on course_ids)

### Step 6: Landing Page (`brio.md`)

- [ ] Simple hello world
- [ ] Links to both portals

### Step 7: Deploy

- [ ] Dockerfiles for each app
- [ ] docker-compose.yml
- [ ] Kamal config (3 apps, 3 domains)

---

## Files to Create

### Root

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `package.json`       | npm workspaces                             |
| `docker-compose.yml` | All apps + postgres                        |
| `config/deploy.yml`  | Kamal (brio.md, in.brio.md, learn.brio.md) |

### Shared Packages

| File                         | Purpose            |
| ---------------------------- | ------------------ |
| `packages/db/src/schema.ts`  | All tables         |
| `packages/auth/src/index.ts` | Auth.js SSO config |

### Landing App

| File                            | Purpose     |
| ------------------------------- | ----------- |
| `apps/landing/src/app/page.tsx` | Hello world |
| `apps/landing/Dockerfile`       | Build       |
| `apps/landing/package.json`     | Deps        |

### Portal App

| File                                     | Purpose                 |
| ---------------------------------------- | ----------------------- |
| `apps/portal/src/app/page.tsx`           | Login (front page)      |
| `apps/portal/src/app/dashboard/page.tsx` | Dashboard (after login) |
| `apps/portal/src/lib/trpc.tsx`           | tRPC client             |
| `apps/portal/src/server/trpc.ts`         | tRPC init               |
| `apps/portal/src/server/routers/_app.ts` | Root router             |
| `apps/portal/Dockerfile`                 | Build                   |
| `apps/portal/package.json`               | Deps                    |

### Learn App

| File                                  | Purpose               |
| ------------------------------------- | --------------------- |
| `apps/learn/src/app/page.tsx`         | Login (front page)    |
| `apps/learn/src/app/courses/page.tsx` | Courses (after login) |
| `apps/learn/Dockerfile`               | Build                 |
| `apps/learn/package.json`             | Deps                  |

---

## Seed Data

| Email             | Password     | Role         | Permissions | course_ids | App Access   |
| ----------------- | ------------ | ------------ | ----------- | ---------- | ------------ |
| `admin@brio.md`   | `admin123`   | `superadmin` | `['super']` | `[]`       | Both portals |
| `admin@vibe.md`   | `admin123`   | `admin`      | `['admin']` | `[]`       | Both portals |
| `teacher@vibe.md` | `teacher123` | `teacher`    | `['teach']` | `[1]`      | Both portals |

Also create a test course:
| ID | Name |
|----|------|
| 1 | English |

---

## Verification

1. **Build:** `npm run build` passes
2. **Dev:** `docker compose up` → 3 apps on localhost
3. **Deploy:** Kamal deploys to `brio.md`, `in.brio.md`, `learn.brio.md`
4. **SSO:** Login once → access both portals
5. **Permissions:** SuperAdmin sees all, Admin sees school only
6. **Courses:** Teachers see only assigned courses

---

## Future (Not in Phase 1)

- Contracts & Payments
- Class attendance
- Student records
- Teacher schedules
- Tours management
- Course content (presentations)
- Student login to learn.brio.md

---

_Plan updated: 2025-05-18_
_Phase 1 of Brio.md_
