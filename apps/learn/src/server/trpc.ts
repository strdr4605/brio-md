import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// Session user type
export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  permissions: string[];
  courseIds: number[];
  studentId: number | null;
  schoolId: number | null;
};

// Context type
export type Context = {
  user: SessionUser | null;
};

// tRPC initialization
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Protected procedure middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
