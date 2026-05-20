FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL=postgres://brio:briopassword@db:5432/brio_md
ENV AUTH_TRUST_HOST=true

RUN npm run build -w @brio-md/learn

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output and static files
COPY --from=builder /app/apps/learn/.next/standalone ./
COPY --from=builder /app/apps/learn/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Next.js standalone uses server.js in apps/learn directory
CMD ["node", "apps/learn/server.js"]