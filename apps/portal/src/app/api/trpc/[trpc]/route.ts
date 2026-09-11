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

      const userId = parseInt(session.user.id as string);
      const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      return {
        user: dbUser
          ? {
              id: String(dbUser.id),
              email: dbUser.email || "",
              name: dbUser.name || "",
              role: dbUser.role || "teacher",
              permissions: dbUser.permissions || [],
              courseIds: dbUser.courseIds || [],
              schoolId: dbUser.schoolId || null,
            }
          : {
              id: String(session.user.id),
              email: session.user.email || "",
              name: session.user.name || "",
              role: session.user.role || "teacher",
              permissions: session.user.permissions || [],
              courseIds: session.user.courseIds || [],
              schoolId: session.user.schoolId || null,
            },
        db,
      };
    },
  });

export { handler as GET, handler as POST };
