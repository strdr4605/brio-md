# Brio.md

[![CI](https://github.com/strdr4605/brio-md/actions/workflows/ci.yml/badge.svg)](https://github.com/strdr4605/brio-md/actions/workflows/ci.yml)

School management platform for Vibe Academy (Moldova).

## Quick Start

**Prerequisites:** Docker, Node.js 20+, npm.

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd brio-md

# 2. Install workspace dependencies
npm install

# 3. Copy env file (defaults work out of the box)
cp .env.example .env

# 4. Start all services with hot reload
npm run dev
```

First run is slow (builds Docker images). Subsequent runs are fast.

### Apps

| App     | URL                   | Description             |
| ------- | --------------------- | ----------------------- |
| Landing | http://localhost:3001 | Marketing page          |
| Portal  | http://localhost:3002 | Staff management        |
| Learn   | http://localhost:3003 | Learning/courses portal |

### Database

```bash
npm run studio  # Drizzle Studio → http://localhost:4983

# Reset DB (wipes all data)
docker compose down -v
```

## Default Users

| Email           | Password   | Role       |
| --------------- | ---------- | ---------- |
| admin@brio.md   | admin123   | SuperAdmin |
| admin@vibe.md   | admin123   | Admin      |
| teacher@vibe.md | teacher123 | Teacher    |

## Deployment

Deploy to VPS using Kamal 2 with kamal-proxy for SSL termination and host-based routing.

### URLs

| App     | URL                   | Description      |
| ------- | --------------------- | ---------------- |
| Landing | https://brio.md       | Marketing page   |
| Portal  | https://in.brio.md    | Staff management |
| Learn   | https://learn.brio.md | Learning portal  |

### Prerequisites

1. **DNS (Cloudflare)** - Grey cloud (DNS only, no proxy):

   ```
   A     brio.md       → SERVER_IP
   CNAME in.brio.md    → brio.md
   CNAME learn.brio.md → brio.md
   ```

2. **Secrets** - Create `.kamal/secrets-common`:

   ```
   KAMAL_REGISTRY_PASSWORD=your_dockerhub_password
   AUTH_SECRET=your_auth_secret
   POSTGRES_PASSWORD=your_postgres_password
   ```

   Create `.kamal/secrets` (portal-specific):

   ```
   DATABASE_URL=postgres://brio:POSTGRES_PASSWORD@brio-portal-db:5432/brio_md
   ```

   Create `.kamal/secrets.learn` (learn-specific):

   ```
   DATABASE_URL=postgres://brio:POSTGRES_PASSWORD@brio-portal-db:5432/brio_md
   ```

3. **SSH key added**:

   ```bash
   ssh-add ~/.ssh/id_rsa
   ```

4. **Docker Hub logged in**:

   ```bash
   docker login -u strdr4605
   ```

5. **Server firewall** - Open ports 22, 80, 443

### Deploy

Portal MUST be deployed first (includes DB accessory):

```bash
# 1. Setup and deploy portal (includes DB)
kamal setup -d portal
kamal deploy -d portal

# 2. Deploy other apps
kamal deploy -d landing
kamal deploy -d learn
```

### Verify

```bash
curl https://brio.md
curl https://in.brio.md
curl https://learn.brio.md
```

### Rollback

```bash
kamal rollback -d portal
kamal rollback -d landing
kamal rollback -d learn
```

### Direct Database Access

From host machine:

```bash
# Connect to DB via external port
DATABASE_URL='postgres://brio:PASSWORD@SERVER_IP:5432/brio_md' psql

# Or with Drizzle Kit
DATABASE_URL='postgres://brio:PASSWORD@SERVER_IP:5432/brio_md' npx drizzle-kit studio
```

## Apps

- **Landing** - Marketing page
- **Portal** - Staff management (owns the database)
- **Learn** - Learning/courses portal (connects to portal DB)
