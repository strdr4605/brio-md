# Brio.md - Initial Setup Plan

## Overview

Modern school management platform built from scratch with Next.js. **Own database** that can be populated by importing data from Educurat production DB when MVP is ready.

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Next.js 16 (App Router, RSC) | 16.x |
| **Language** | TypeScript | 5.x |
| **Database** | MariaDB 11 (own DB `brio_md`) | Latest |
| **ORM** | Drizzle ORM | Latest |
| **Auth** | Auth.js v5 (NextAuth) | Beta |
| **Styling** | Tailwind CSS | 4.x |
| **Data Fetching** | TanStack Query (React Query) | 5.x |
| **Validation** | Zod | 3.x |
| **Container** | Docker | Latest |
| **Deploy** | Kamal v2 (Basecamp) | 2.x |
| **Host** | VPS (self-hosted) | - |

---

## Key Architecture Decision

```
┌─────────────────────┐         ┌─────────────────────┐
│   Educurat (PHP)   │         │    Brio.md (Next.js) │
│   Production       │         │    MVP              │
│   DB: educurat     │         │    DB: brio_md      │
└─────────────────────┘         └─────────────────────┘
         │                               │
         │  Export/Import               │
         └──────────────┬──────────────┘
                        ▼
              ┌─────────────────────┐
              │   Prod DB Migration │
              │   (when MVP ready)  │
              └─────────────────────┘
```

**Separate databases.** Import production data into Brio.md DB when MVP is ready.

---

## Project Structure

```
brio-md/
├── apps/
│   └── web/                    # Next.js app
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   │   ├── api/auth/[...nextauth]/  # Auth.js handlers
│       │   │   ├── api/health/             # Health check
│       │   │   ├── (auth)/login/            # Login page
│       │   │   └── (dashboard)/             # Protected routes
│       │   │       ├── admin/
│       │   │       └── teacher/
│       │   │
│       │   ├── components/      # Shared UI components
│       │   │   ├── ui/           # Base UI (Button, Input, Card)
│       │   │   └── providers/    # Providers (Query, Auth)
│       │   │
│       │   ├── lib/             # Utilities
│       │   │   ├── auth.ts      # Auth.js configuration
│       │   │   ├── db.ts        # Drizzle client
│       │   │   └── queries/     # React Query definitions
│       │   │
│       │   └── db/              # Database
│       │       ├── schema.ts    # Drizzle schema (from existing DB)
│       │       └── schema/
│       │           ├── users.ts
│       │           ├── schools.ts
│       │           └── ...
│       │
│       ├── Dockerfile           # Docker image
│       └── package.json
│
├── config/
│   ├── deploy.yml              # Kamal configuration
│   └── .env.production.example # Production env vars
│
├── packages/                   # Future: shared packages
│   └── shared/
│
├── docker-compose.yml         # Docker Compose for local dev
├── Gemfile                     # Ruby (for Kamal)
├── .env.example
├── .dockerignore
├── package.json
└── README.md
```

---

## Development Workflow

### Local Development

```yaml
# docker-compose.yml (local)
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: rootpassword
      MARIADB_DATABASE: brio_md
      MARIADB_USER: brio
      MARIADB_PASSWORD: briopassword
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://brio:briopassword@db:3306/brio_md
      AUTH_SECRET: dev-secret-change-in-production
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./apps/web:/app
      - /app/node_modules
      - /app/.next

volumes:
  mariadb_data:
```

```dockerfile
# apps/web/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
```

### Local Commands

```bash
# Start development
docker compose up -d
open http://localhost:3000

# View logs
docker compose logs -f app

# Access MariaDB CLI
docker compose exec db mariadb -u root -p brio_md

# Reset database
docker compose down -v && docker compose up -d
```

### Environment Variables (.env.local)

```bash
# Local development (.env.local)
DATABASE_URL="mysql://brio:briopassword@localhost:3306/brio_md"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="another-development-secret"
```

### Database Migrations

```bash
# Generate migration from schema
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

---

## Database Strategy

### Environment Setup

| Environment | Database | Connection |
|-------------|----------|------------|
| Local Dev | `brio_md` (Docker) | `mysql://brio:briopassword@localhost:3306/brio_md` |
| Production | `brio_md` (on VPS) | Set via Kamal env vars |

### Import from Production (When MVP Ready)

```
When MVP is ready:

1. Export from PROD: mysqldump -h prod educurat > educurat_dump.sql
2. Transform (if needed): ./scripts/transform-data.sh educurat_dump.sql brio_md.sql
3. Import to PROD: mysql -u root -p brio_md < brio_md.sql

Or use Docker:
docker exec -i brio-md-db mysql -u root -p brio_md < educurat_dump.sql
```

### Schema Mapping

Drizzle schema mirrors existing Educurat tables:

```typescript
// apps/web/src/db/schema/users.ts
import { mysqlTable, int, varchar, datetime } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  role: varchar('role', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  password: varchar('password', { length: 255 }),        // SHA1 (existing)
  passwordHash: varchar('password_hash', { length: 255 }), // bcrypt (new)
  passwordMigrated: int('password_migrated').default(0),  // 0 or 1
  // ... all existing columns preserved
  createdAt: datetime('created_at').defaultCurrent(),
  modifiedAt: datetime('modified_at').onUpdateNow(),
});
```

---

## Password Migration (SHA1 → bcrypt)

Existing Educurat DB uses SHA1 passwords. We need dual verification.

### Database Changes (Run on Import)

```sql
ALTER TABLE users 
ADD COLUMN password_hash VARCHAR(255) NULL,
ADD COLUMN password_migrated TINYINT(1) DEFAULT 0;
```

### Auth.js: Dual Verification

```typescript
// apps/web/src/lib/auth/credentials.ts
import { compare, hash } from 'bcryptjs';

async function verifyPassword(plainPassword: string, user: User) {
  // Already migrated to bcrypt
  if (user.password_migrated && user.password_hash) {
    return await compare(plainPassword, user.password_hash);
  }
  
  // Still SHA1 - verify and migrate
  const sha1Hash = sha1(plainPassword);
  if (user.password === sha1Hash) {
    // Migrate to bcrypt
    const bcryptHash = await hash(plainPassword, 12);
    await updateUserPassword(user.id, bcryptHash);
    return true;
  }
  
  return false;
}
```

### Migration Phases

| Phase | Action | When |
|-------|--------|------|
| 1 | Add migration columns to schema | During development |
| 2 | Implement dual verification in Auth.js | During development |
| 3 | Auto-migrate users on successful login | After MVP launch |
| 4 | Batch migrate remaining users | Later (optional) |

---

## Initial Setup Steps

### Step 1: Initialize Next.js Project

```bash
cd /Users/strdr4605/P/vibe2
mkdir brio-md && cd brio-md
npx create-next-app@latest apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

### Step 2: Install Dependencies

```bash
cd apps/web

# Database
npm install drizzle-orm mysql2
npm install -D drizzle-kit

# Auth
npm install @auth/drizzle-adapter next-auth@beta
npm install bcryptjs
npm install -D @types/bcryptjs

# Data Fetching
npm install @tanstack/react-query @tanstack/react-query-devtools

# Validation
npm install zod
```

### Step 3: Configure Environment

```bash
# .env.local (local dev - Docker)
DATABASE_URL="mysql://brio:briopassword@localhost:3306/brio_md"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 4: Create Drizzle Schema

Create schema files mirroring existing Educurat tables:
- `db/schema/users.ts`
- `db/schema/schools.ts`
- `db/schema/students.ts`
- `db/schema/teachers.ts`
- `db/schema/classes.ts`
- `db/schema/enrols.ts`
- etc.

---

## Authentication Flow (Auth.js v5)

```
User submits credentials (email + password)
        ↓
Auth.js validates against credentials provider
        ↓
Dual password check (bcrypt OR SHA1 + migrate)
        ↓
Creates session in MariaDB (via Drizzle adapter)
        ↓
Sets HTTP-only cookie
        ↓
Middleware protects routes automatically
```

---

## Data Fetching (TanStack Query)

### Architecture
```
React Components → useQuery/useMutation → React Query → API Routes → Drizzle → MariaDB
```

### Query Examples
```typescript
// apps/web/src/lib/queries/students.ts
export const studentQueries = {
  list: (filters) => ({ 
    queryKey: ['students', filters], 
    queryFn: () => fetchStudents(filters) 
  }),
  detail: (id) => ({ 
    queryKey: ['students', id], 
    queryFn: () => fetchStudent(id) 
  }),
};

// Component usage
const { data, isLoading } = useQuery(studentQueries.list({ schoolId, classId }));
```

---

## Mobile-First Design

### Approach
- Design for mobile screens first (320px+)
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Bottom navigation for mobile
- Responsive components using Tailwind

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

---

## MVP Scope (Phase 1 - Core)

### Goal: See data from DB

Focus: **No UX polish, just data visibility**
- Connect to MariaDB
- Display existing data (users, students, classes)
- Basic authentication
- Simple list views (not mobile-first yet)

### Must Have
- [ ] Next.js project setup
- [ ] Drizzle schema from Educurat DB
- [ ] Auth.js setup (credentials provider)
- [ ] Basic API routes to fetch data
- [ ] Login page
- [ ] Admin: list users, students, classes
- [ ] Teacher: list assigned classes, students
- [ ] Docker Compose setup

### Out of Scope (Phase 2+)
- Mobile-first design
- Styling polish
- CRUD operations
- Permission system
- Complex UI components

---

## MVP Scope (Phase 2 - UX)

- Mobile-first design
- CRUD operations
- Permission system
- Styling polish

### Nice to Have (Phase 2)
- [ ] Student view
- [ ] Parent view
- [ ] Class management
- [ ] Invoice tracking

---

## Deployment (Kamal v2 on VPS)

### Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS                                  │
│                                                              │
│   ┌────────────────────────────────────────────────────┐   │
│   │                    Kamal Proxy                     │   │
│   │                    (ports 80/443)                   │   │
│   └────────────────────────────────────────────────────┘   │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              │                           │                  │
│              ▼                           ▼                  │
│   ┌─────────────────────┐   ┌─────────────────────┐      │
│   │   Educurat (PHP)    │   │    Brio.md (Next.js) │      │
│   │   Current Prod      │   │        MVP           │      │
│   │   (localhost:8080)  │   │   (localhost:3000)   │      │
│   └─────────────────────┘   └─────────────────────┘      │
│                            │                                │
│                            ▼                                │
│   ┌────────────────────────────────────────────────────┐   │
│   │              MariaDB (brio_md)                     │   │
│   │              localhost:3306                       │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Deploy Configuration

```yaml
# config/deploy.yml
service: brio-md

servers:
  web:
    - <vps-ip>

registry:
  server: registry.hub.docker.com
  username: strdr4605
  password: <docker-hub-password>

builder:
  remote:
    arch: linux/amd64
    host: ssh://root@<vps-ip>

env:
  secret:
    - DATABASE_URL
    - AUTH_SECRET
    - NEXTAUTH_URL

healthcheck:
  path: /api/health
  port: 3000
  interval: 10s

proxy:
  - path: /
    port: 3000
```

**Before deploying to production:**
1. Create `brio_md` database on VPS
2. Import data from Educurat production (if needed)
3. Run DB migrations
4. Configure environment variables

### Deploy Steps

```bash
# Build and deploy
bundle exec kamal deploy

# Check logs
bundle exec kamal logs

# Rollback
bundle exec kamal rollback
```

---

## Decisions Made

| Question | Answer |
|----------|--------|
| **Database** | MariaDB 11 (own DB `brio_md`) |
| **DB Migration** | Import from Educurat PROD when MVP ready |
| **Local Dev** | Docker Compose |
| **Auth** | Auth.js v5 |
| **Data Layer** | TanStack Query |
| **Design** | Mobile-first |
| **Deploy** | Kamal v2 on VPS |
| **Views** | Admin + Teacher (Phase 1) |

---

## Next Actions

### Phase 1 (This Session - Core): See Data
1. Initialize Next.js project
2. Install dependencies
3. Create Drizzle schema (mirror existing tables)
4. Configure Auth.js with dual password verification
5. Create API routes to fetch data
6. Simple list pages (admin: users/students/classes, teacher: assigned classes)
7. Set up Docker Compose for local development
8. Test with Docker DB (empty or import sample)

### Phase 2 (Later - UX): Polish
- Mobile-first design
- CRUD operations
- Permission system
- Styling polish

---

## FAQ

**Q: When do we import production data?**
A: When MVP is ready. Export from Educurat, transform if needed, import into `brio_md` DB on VPS.

**Q: Can we rollback if something goes wrong?**
A: Yes - Kamal supports automatic rollback.

**Q: What about existing data in Educurat?**
A: Can be imported into Brio.md when transitioning. Export → transform → import.