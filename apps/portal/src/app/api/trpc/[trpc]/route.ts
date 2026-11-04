import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { users, schools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantDb } from "@/server/tenantDb";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth();
      if (!session?.user || (session.user as any).expired) {
        return { user: null, db: getTenantDb(null) };
      }

      const rawId = session.user.id;
      const userId = typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);
      if (isNaN(userId) || userId <= 0) {
        return { user: null, db: getTenantDb(null) };
      }

      const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!dbUser || !dbUser.active) {
        return { user: null, db: getTenantDb(null) };
      }

      let schemaName: string | null = null;
      if (dbUser.schoolId) {
        const [school] = await db
          .select({ schemaName: schools.schemaName })
          .from(schools)
          .where(eq(schools.id, dbUser.schoolId))
          .limit(1);
        schemaName = school?.schemaName || `tenant_${dbUser.schoolId}`;
      }

      const tenantDb = getTenantDb(schemaName);

      return {
        user: {
          id: String(dbUser.id),
          email: dbUser.email || "",
          name: dbUser.name || "",
          role: dbUser.role || "teacher",
          permissions: dbUser.permissions || [],
          courseIds: dbUser.courseIds || [],
          schoolId: dbUser.schoolId || null,
          schemaName,
        },
        db: tenantDb,
      };
    },
  });

export { handler as GET, handler as POST };
