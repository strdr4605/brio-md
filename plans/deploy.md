# Brio.md Deployment Plan

## Context
Deploy Brio.md (school management platform) to Hostinger VPS with Kamal. Three apps need subdomain routing:
- `brio.md` → Landing page
- `in.brio.md` → Staff portal
- `learn.brio.md` → Student/teacher learn portal

Also need production DB access via Drizzle Studio.

## Approach
- **Kamal 2** for deployment (zero-downtime, Docker-based, built-in kamal-proxy + Let's Encrypt)
- **Single config with multiple roles** for each app (landing, portal, learn)
- **Kamal proxy** handles SSL + host-based routing (proxy hosts each role differently)
- **Drizzle Studio** as Kamal accessory accessible via `in.brio.md/studio/` path

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Hostinger VPS                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    kamal-proxy                        │  │
│  │              (Single proxy, routes by Host header)   │  │
│  │              Ports 80 + 443, auto SSL via Let's Encrypt│  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┼───────────────────────────┐  │
│  │                           │                           │  │
│  │  Host: brio.md      Host: in.brio.md      Host: learn.brio.md│
│  │        │                    │                    │        │
│  │        ▼                    ▼                    ▼        │
│  │ ┌────────────┐    ┌────────────┐    ┌────────────┐ │
│  │ │  Landing    │    │   Portal   │    │   Learn    │ │
│  │ │  :3000     │    │   :3000    │    │   :3000   │ │
│  │ │  (web)     │    │   (portal) │    │   (learn) │ │
│  │ └────────────┘    └────────────┘    └────────────┘ │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                    ┌─────────┴─────────┐                   │
│                    │      Postgres       │                   │
│                    │   + Drizzle Studio │                   │
│                    └─────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

**Single deploy.yml with multiple roles (web, portal, learn)**

## Files to Modify/Create

### 1. `config/deploy.yml` (single config with multiple roles)
Single Kamal config deploying all 3 apps with proxy hosts + SSL + Drizzle accessory

### 2. `config/nginx.conf` (optional, for Drizzle path routing)
Nginx config if Drizzle needs to be at `/studio/` path

### 3. `apps/portal/Dockerfile`, `apps/landing/Dockerfile`, `apps/learn/Dockerfile`
Add PORT env for Kamal
```
A     brio.md       → SERVER_IP
CNAME in.brio.md    → brio.md
CNAME learn.brio.md → brio.md
```

## Reuse Existing
- Dockerfiles in `apps/*/Dockerfile`
- PostgreSQL setup from `docker-compose.yml`
- Auth config from `@brio-md/auth`

## Steps

### 1. Update Dockerfiles for Kamal
- [ ] Add `ENV PORT=3000` to all Dockerfiles
- [ ] Ensure `CMD ["node", "apps/*/server.js"]` is correct

### 2. Create single Kamal config with multiple roles
- [ ] Rewrite `config/deploy.yml` with all 3 apps as roles: web (landing), portal, learn
- [ ] Each role has its own image
- [ ] Configure proxy with hosts for each role: brio.md, in.brio.md, learn.brio.md
- [ ] Add Drizzle Studio accessory (runs as separate container)
- [ ] Configure Postgres accessory (shared by all apps)

### 3. Set up Drizzle Studio accessory
- [ ] Add Drizzle Studio as accessory in deploy.yml
- [ ] Configure to run on internal port, accessible via subdomain or path
- [ ] Or use SSH tunnel for security: `ssh -L 4990:localhost:4990 root@SERVER`

### 4. Configure DNS (Cloudflare - DNS only, no proxy)
- [ ] Add A record: `brio.md` → SERVER_IP
- [ ] Add CNAME: `in.brio.md` → `brio.md`
- [ ] Add CNAME: `learn.brio.md` → `brio.md`
- [ ] **Important**: Set Cloudflare proxy to OFF (grey cloud) so Kamal can handle SSL

### 5. Server preparation
- [ ] Install Docker on VPS
- [ ] SSH access configured
- [ ] Firewall: ports 22, 80, 443 open

### 6. Deploy
- [ ] `kamal setup` - setup Postgres + Drizzle accessories
- [ ] `kamal deploy` - deploy all apps with zero-downtime
- [ ] Verify: brio.md, in.brio.md, learn.brio.md all accessible with SSL

### 7. Access Drizzle Studio
- [ ] Via subdomain: `studio.in.brio.md` (configure nginx accessory) OR
- [ ] Via SSH tunnel for security: `ssh -L 4990:localhost:4990 root@SERVER`

## Verification
```bash
# Check all apps
curl https://brio.md
curl https://in.brio.md  
curl https://learn.brio.md

# Drizzle Studio (via portal accessory)
curl https://in.brio.md/studio

# Or SSH tunnel for security
ssh -L 4990:localhost:4990 root@SERVER
# Then open http://localhost:4990 in browser
```