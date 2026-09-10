import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// Session user type
type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  permissions: string[];
  courseIds: number[];
  schoolId: number | null;
  expired?: boolean;
};

// Context type
type Context = {
  user: SessionUser | null;
};

// tRPC initialization
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.expired) {
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

// Super permission middleware
const hasSuper = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const isSuper = ctx.user.permissions.includes("super") || ctx.user.role === "superadmin";
  if (!isSuper) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const superProcedure = protectedProcedure.use(hasSuper);

// Admin permission middleware
const hasAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const isSuperOrAdmin =
    ctx.user.permissions.includes("admin") ||
    ctx.user.permissions.includes("super") ||
    ctx.user.role === "admin" ||
    ctx.user.role === "superadmin";
  if (!isSuperOrAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(hasAdmin);
