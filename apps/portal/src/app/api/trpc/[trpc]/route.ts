import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth();
      if (!session?.user || (session.user as any).expired) {
        return { user: null, db };
      }

      const rawId = session.user.id;
      const userId = typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);
      if (isNaN(userId) || userId <= 0) {
        return { user: null, db };
      }

      const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!dbUser || !dbUser.active) {
        return { user: null, db };
      }

      return {
        user: {
          id: String(dbUser.id),
          email: dbUser.email || "",
          name: dbUser.name || "",
          role: dbUser.role || "teacher",
          permissions: dbUser.permissions || [],
          courseIds: dbUser.courseIds || [],
          schoolId: dbUser.schoolId || null,
        },
        db,
      };
    },
  });

export { handler as GET, handler as POST };
