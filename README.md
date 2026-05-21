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

```bash
npm run deploy
```

## Apps

- **Landing** - Marketing page
- **Portal** - Staff management
- **Learn** - Learning/courses portal