import "@brio-md/auth/types";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string | null;
      permissions?: string[] | null;
      courseIds?: number[] | null;
      schoolId?: number | null;
      expired?: boolean;
    } & Session["user"];
  }
}