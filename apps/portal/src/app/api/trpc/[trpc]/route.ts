import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { auth } from "@brio-md/auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth();
      return {
        user: session?.user ? {
          id: String(session.user.id),
          email: session.user.email || "",
          name: session.user.name || "",
          role: (session.user as any).role || "teacher",
          permissions: (session.user as any).permissions || [],
          courseIds: (session.user as any).courseIds || [],
          schoolId: (session.user as any).schoolId || null,
        } : null,
        db: null,
      };
    },
  });

export { handler as GET, handler as POST };
