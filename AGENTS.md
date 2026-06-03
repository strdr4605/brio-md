# DB Migrations

When modifying `packages/db/src/schema.ts`, always generate a migration:

```bash
cd packages/db
npm run generate   # or: npx drizzle-kit generate
```

Review the generated SQL in `packages/db/drizzle/` before committing.