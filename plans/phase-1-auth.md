# Phase 1: Deployable Auth Foundation

## Goal

A working Next.js app with:
- PostgreSQL database
- Auth.js authentication  
- tRPC + React Query
- Role-based permissions (SuperAdmin, Admin, Teacher)
- Docker + Kamal deployment

**Not in scope:** All business logic (contracts, payments, attendance, etc.)

---

## Current State

```
apps/web/
├── src/
│   ├── app/                    # Pages
│   │   ├── api/auth/           # NextAuth routes
│   │   ├── (auth)/login/       # Login page
│   │   └── (dashboard)/        # Dashboard pages
│   ├── components/             # UI components
│   ├── db/
│   │   └── schema.ts           # Will be simplified
│   └── lib/
│       ├── auth.ts             # NextAuth config
│       └── db.ts               # Drizzle connection
├── docker-compose.yml          # MariaDB + app
└── package.json
```

**Problems:**
- Uses MariaDB (not PostgreSQL)
- 15+ tables (need just 2-3)
- No tRPC
- Complex password migration (not needed)
- No Kamal deploy
- Role logic is unclear

---

## Plan

### Step 1: Clean Up Database Schema

Keep only what's needed for auth + user management:

```sql
-- 1. Schools (for multi-tenant / admin assignment)
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users (simple, Auth.js compatible)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',  -- ['super'], ['admin'], ['teach', 'view'], etc.
  school_id INTEGER REFERENCES schools(id),      -- NULL for superusers
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Switch to PostgreSQL

- Update `docker-compose.yml` → PostgreSQL
- Update `drizzle.config.ts` → postgres driver
- Update `db.ts` → pg driver

### Step 3: Simplify Auth.js

Remove password migration (SHA1 → bcrypt):
- New users only use bcrypt
- No legacy password support needed

### Step 4: Add tRPC

- Set up tRPC router
- Add procedure for:
  - `users.list` - filtered by role/permissions
  - `users.create` - SuperAdmin only
  - `users.get` - by ID
- Protected procedures based on session

### Step 5: Role Permissions

## Permissions (PBAC - Permission-Based Access Control)

Each user has permissions (array):

| Permission | Description |
|------------|-------------|
| `super` | Full access to everything |
| `admin` | Manage users in their school |
| `teach` | View own profile |
| `view` | View assigned data |

Example:
- SuperAdmin: `['super']` → full access
- Admin: `['admin']` → manage school users
- Teacher: `['teach', 'view']` → view self only

A user can have multiple permissions.

### Step 6: Dashboard Pages

```
/                       → redirect to /dashboard
/login                  → Login form
/dashboard              → Welcome + user info
/dashboard/users        → User list (filtered by role)
/dashboard/users/new    → Create user form
```

### Step 7: Docker + Kamal Deploy

- `Dockerfile` - production build
- `docker-compose.yml` - postgres + app
- `config/deploy.yml` - Kamal config

---

## Files to Change

### New Files
- `apps/web/src/server/routers/_app.ts` - tRPC root router
- `apps/web/src/server/routers/user.ts` - user procedures
- `apps/web/src/server/trpc.ts` - tRPC init
- `apps/web/src/lib/trpc.tsx` - tRPC React provider
- `apps/web/src/app/api/trpc/[trpc]/route.ts` - tRPC handler
- `config/deploy.yml` - Kamal config

### Modify Files
- `apps/web/src/db/schema.ts` - simplify to 2 tables
- `apps/web/src/lib/db.ts` - switch to pg driver
- `apps/web/src/lib/auth.ts` - simplify (remove migration)
- `apps/web/src/lib/trpc.ts` → move to server/
- `docker-compose.yml` - PostgreSQL
- `apps/web/Dockerfile` - production
- `package.json` - add tRPC deps

### Delete Files
- Most existing API routes (clean slate)
- Legacy Educurat tables

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (credentials) |
| API | tRPC v11 |
| State | React Query v5 |
| Deploy | Docker + Kamal |
| CSS | Tailwind v4 |

---

## Dependencies to Add

```json
{
  "@trpc/server": "^11.0.0",
  "@trpc/client": "^11.0.0",
  "@trpc/react-query": "^11.0.0",
  "@trpc/next": "^11.0.0",
  "postgres": "^3.4.0",
  "@types/pg": "^8.0.0",
  "drizzle-orm": "^0.30.0",
  "superjson": "^2.0.0"
}
```

---

## Verification

1. **Build passes:** `npm run build`
2. **Dev works:** `npm run dev` → http://localhost:3000
3. **Login works:** Login as superadmin
4. **SuperAdmin sees all users:** Dashboard → Users
5. **Admin sees only school teachers:** Login as admin
6. **Create user works:** SuperAdmin can create users
7. **Deploy works:** Kamal deploy to VPS

---

## Questions

1. **Database name:** `brio_md` (confirmed)
2. **Admin school assignment:** Admin can only manage their assigned school (confirmed)
3. **Initial user:** Create seed data for first SuperAdmin login (confirmed)
4. **Permissions:** PBAC instead of RBAC - users have array of permissions

---

*Plan created: 2025-05-18*
*Phase 1 of Brio.md*