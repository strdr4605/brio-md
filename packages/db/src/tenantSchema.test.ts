import { describe, it, expect } from "vitest";
import { sanitizeTenantSchemaName, getTenantSchemaDDL } from "./tenantSchema";

describe("tenantSchema", () => {
  it("sanitizes numeric ids into tenant_1", () => {
    expect(sanitizeTenantSchemaName(1)).toBe("tenant_1");
    expect(sanitizeTenantSchemaName(42)).toBe("tenant_42");
  });

  it("sanitizes school names into valid postgres schema identifiers", () => {
    expect(sanitizeTenantSchemaName("Liceul Orizont Chișinău")).toBe("tenant_liceul_orizont_chisinau");
    expect(sanitizeTenantSchemaName("Academia Da Vinci")).toBe("tenant_academia_da_vinci");
    expect(sanitizeTenantSchemaName("tenant_custom")).toBe("tenant_custom");
  });

  it("generates DDL statements for a tenant schema", () => {
    const ddl = getTenantSchemaDDL("tenant_orizont");
    expect(ddl.length).toBeGreaterThan(5);
    expect(ddl[0]).toBe('CREATE SCHEMA IF NOT EXISTS "tenant_orizont";');
    expect(ddl.some((stmt) => stmt.includes('"tenant_orizont"."students"'))).toBe(true);
    expect(ddl.some((stmt) => stmt.includes('"tenant_orizont"."courses"'))).toBe(true);
    expect(ddl.some((stmt) => stmt.includes('"tenant_orizont"."invoices"'))).toBe(true);
  });
});
