import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { users } from "@brio-md/db";
import { eq } from "drizzle-orm";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth();
      if (!session?.user) {
        return { user: null };
      }

      let dbUser = null;
      try {
        const userId = parseInt(session.user.id as string, 10);
        if (!isNaN(userId)) {
          const [found] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          dbUser = found;
        }
      } catch {
        // Fallback to session user if DB read fails
      }

      return {
        user: dbUser
          ? {
              id: String(dbUser.id),
              email: dbUser.email || "",
              name: dbUser.name || "",
              role: dbUser.role || "teacher",
              permissions: dbUser.permissions || [],
              courseIds: dbUser.courseIds || [],
              studentId: dbUser.studentId || null,
              schoolId: dbUser.schoolId || null,
            }
          : {
              id: String(session.user.id),
              email: session.user.email || "",
              name: session.user.name || "",
              role: session.user.role || "teacher",
              permissions: session.user.permissions || [],
              courseIds: session.user.courseIds || [],
              studentId: session.user.studentId || null,
              schoolId: session.user.schoolId || null,
            },
      };
    },
  });

export { handler as GET, handler as POST };
