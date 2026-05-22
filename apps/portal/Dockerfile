FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package.json and workspace config
COPY package.json package-lock.json* ./

# Copy all packages first
COPY packages/db/package.json ./packages/db/package.json
COPY packages/auth/package.json ./packages/auth/package.json

# Copy app package.json for workspace resolution
COPY apps/portal/package.json ./apps/portal/package.json

# Install all workspaces
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json* ./

# Copy all source
COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL=postgres://brio:briopassword@db:5432/brio_md
ENV AUTH_TRUST_HOST=true

RUN npm run build -w @brio-md/portal

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output: apps/portal/server.js and .next directory
COPY --from=builder /app/apps/portal/.next/standalone/apps/portal/. /app/apps/portal/
# Copy static files to /app/apps/portal/.next/ (where server.js expects them)
COPY --from=builder /app/apps/portal/.next/static /app/apps/portal/.next/static

# Copy all node_modules from builder (includes next, react, etc.)
COPY --from=builder /app/node_modules /app/node_modules

USER nextjs

EXPOSE 3000

CMD ["node", "apps/portal/server.js"]