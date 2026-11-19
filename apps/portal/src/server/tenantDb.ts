import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { sanitizeTenantSchemaName } from "@brio-md/db";

const connectionString =
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md";

// Connection pool cache on globalThis to prevent connection leaks across serverless environments
const globalForTenantDb = globalThis as unknown as {
  __brioTenantClients?: Map<string, ReturnType<typeof drizzle>>;
  __brioDefaultTenantDb?: ReturnType<typeof drizzle>;
};

if (!globalForTenantDb.__brioTenantClients) {
  globalForTenantDb.__brioTenantClients = new Map<string, ReturnType<typeof drizzle>>();
}

/**
 * Returns a scoped Drizzle instance where the PostgreSQL search_path is set to
 * the tenant's isolated schema first, then fallback to public.
 * Connections are globally cached across invocations.
 */
export function getTenantDb(schemaNameOrId: string | number | null | undefined) {
  if (!schemaNameOrId) {
    if (!globalForTenantDb.__brioDefaultTenantDb) {
      const defaultSql = postgres(connectionString, { max: 5 });
      globalForTenantDb.__brioDefaultTenantDb = drizzle(defaultSql, { schema });
    }
    return globalForTenantDb.__brioDefaultTenantDb;
  }

  const safeSchema = sanitizeTenantSchemaName(schemaNameOrId);
  const cached = globalForTenantDb.__brioTenantClients!.get(safeSchema);
  if (cached) return cached;

  const tenantSql = postgres(connectionString, {
    max: 5,
    onnotice: () => {},
    connection: {
      search_path: `"${safeSchema}", public`,
    },
  });

  const tenantDb = drizzle(tenantSql, { schema });
  globalForTenantDb.__brioTenantClients!.set(safeSchema, tenantDb);
  return tenantDb;
}
