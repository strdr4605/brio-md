import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { sanitizeTenantSchemaName } from "@brio-md/db";

const connectionString =
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md";

// Connection pool cache per schema for maximum performance and isolation
const tenantClients = new Map<string, ReturnType<typeof drizzle>>();

/**
 * Returns a scoped Drizzle instance where the PostgreSQL search_path is set to
 * the tenant's isolated schema first, then fallback to public.
 */
export function getTenantDb(schemaNameOrId: string | number | null | undefined) {
  if (!schemaNameOrId) {
    const defaultSql = postgres(connectionString, { max: 5 });
    return drizzle(defaultSql, { schema });
  }

  const safeSchema = sanitizeTenantSchemaName(schemaNameOrId);
  const cached = tenantClients.get(safeSchema);
  if (cached) return cached;

  const tenantSql = postgres(connectionString, {
    max: 5,
    onnotice: () => {},
    connection: {
      search_path: `"${safeSchema}", public`,
    },
  });

  const tenantDb = drizzle(tenantSql, { schema });
  tenantClients.set(safeSchema, tenantDb);
  return tenantDb;
}
