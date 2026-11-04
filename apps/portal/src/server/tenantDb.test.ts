import { describe, it, expect } from "vitest";
import { getTenantDb } from "./tenantDb";

describe("getTenantDb", () => {
  it("returns a Drizzle database client for empty/null tenant", () => {
    const db = getTenantDb(null);
    expect(db).toBeDefined();
    expect(typeof db.select).toBe("function");
  });

  it("returns a scoped Drizzle database client for a specific tenant ID", () => {
    const tenantDb1 = getTenantDb(1);
    expect(tenantDb1).toBeDefined();
    expect(typeof tenantDb1.select).toBe("function");

    // Cache hit
    const tenantDb1Again = getTenantDb(1);
    expect(tenantDb1Again).toBe(tenantDb1);
  });

  it("returns a scoped Drizzle client for a school name string", () => {
    const schoolDb = getTenantDb("Academia Da Vinci");
    expect(schoolDb).toBeDefined();
    expect(typeof schoolDb.select).toBe("function");
  });
});
