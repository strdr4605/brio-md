FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package.json and workspace config
COPY package.json package-lock.json* ./

# Copy all packages first
COPY packages/db/package.json ./packages/db/package.json
COPY packages/auth/package.json ./packages/auth/package.json

# Install all workspaces
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json* ./

# Copy all source
COPY . .

ENV NODE_ENV=production

RUN npm run build -w @brio-md/landing

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output: apps/landing/server.js and .next directory
COPY --from=builder /app/apps/landing/.next/standalone/apps/landing/. /app/apps/landing/
# Copy static files to /app/apps/landing/.next/ (where server.js expects them)
COPY --from=builder /app/apps/landing/.next/static /app/apps/landing/.next/static

# Copy all node_modules from builder (includes next, react, etc.)
COPY --from=builder /app/node_modules /app/node_modules

USER nextjs

EXPOSE 3000

CMD ["node", "apps/landing/server.js"]