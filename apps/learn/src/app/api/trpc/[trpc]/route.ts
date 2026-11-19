import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { users } from "@brio-md/db";
import { eq } from "drizzle-orm";

export async function createLearnContext() {
  let session = null;
  try {
    session = await auth();
  } catch {
    return { user: null };
  }

  if (!session?.user || (session.user as any).expired) {
    return { user: null };
  }

  const rawId = session.user.id;
  const userId = typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);
  if (isNaN(userId) || userId <= 0) {
    return { user: null };
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!dbUser || !dbUser.active) {
    return { user: null };
  }

  if (dbUser.lastChangedAt && (session.user as any).lastChangedAt) {
    const sessionLastChanged = new Date((session.user as any).lastChangedAt);
    if (dbUser.lastChangedAt > sessionLastChanged) {
      return { user: null };
    }
  }

  return {
    user: {
      id: String(dbUser.id),
      email: dbUser.email || "",
      name: dbUser.name || "",
      role: dbUser.role || "teacher",
      permissions: dbUser.permissions || [],
      courseIds: dbUser.courseIds || [],
      studentId: dbUser.studentId || null,
      schoolId: dbUser.schoolId || null,
    },
  };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createLearnContext,
  });

export { handler as GET, handler as POST };
