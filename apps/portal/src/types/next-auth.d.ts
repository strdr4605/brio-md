import "@brio-md/auth/types";
import type { Session } from "next-auth";

declare module "next-auth" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Session {
    user: {
      id?: string;
      role?: string | null;
      permissions?: string[] | null;
      courseIds?: number[] | null;
      studentId?: number | null;
      schoolId?: number | null;
      expired?: boolean;
    } & Session["user"];
  }
}