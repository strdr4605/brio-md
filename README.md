# Brio.md

School management platform for Vibe Academy (Moldova).

## Quick Start

```bash
# Start all services
npm run dev

# Or run individually
npm run dev:landing  # http://localhost:3001
npm run dev:portal    # http://localhost:3002
npm run dev:learn     # http://localhost:3003
```

## Development

```bash
# Start Drizzle Studio (database GUI)
npm run studio  # http://localhost:4983

# Stop Drizzle Studio
pkill -f drizzle-kit
```

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@brio.md | admin123 | SuperAdmin |
| admin@vibe.md | admin123 | Admin |
| teacher@vibe.md | teacher123 | Teacher |

## Deployment

Deploy to Hostinger VPS using Kamal 2.

### Prerequisites

1. **DNS (Cloudflare)** - Grey cloud (DNS only, no proxy):
   ```
   A     brio.md       → SERVER_IP
   CNAME in.brio.md    → brio.md
   CNAME learn.brio.md → brio.md
   ```

2. **Secrets** - Create `.kamal/secrets`:
   ```
   KAMAL_REGISTRY_PASSWORD=your_dockerhub_password
   POSTGRES_PASSWORD=your_postgres_password
   AUTH_SECRET=your_auth_secret
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

```bash
# 1. Setup (portal deploys DB, Drizzle, kamal-proxy) - MUST run first
kamal -c config/deploy.portal.yml setup
kamal -c config/deploy.portal.yml deploy

# 2. Deploy landing + learn
kamal -c config/deploy.learn.yml deploy
kamal -c config/deploy.landing.yml deploy
```

### Verify

```bash
curl https://brio.md
curl https://in.brio.md
curl https://learn.brio.md
```

### Drizzle Studio

Accessible via SSH tunnel:
```bash
ssh -L 4990:localhost:4990 root@SERVER_IP
# Then open http://localhost:4990
```

### Rollback

```bash
kamal -c config/deploy.portal.yml rollback -r portal
kamal -c config/deploy.learn.yml rollback -r learn
kamal -c config/deploy.landing.yml rollback -r landing
```

## Apps

- **Landing** - Marketing page
- **Portal** - Staff management
- **Learn** - Learning/courses portal