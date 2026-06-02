import type { DefaultSession, AdapterUser as NextAdapterUser } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
  }

  interface AdapterUser {
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string | null;
      permissions?: string[] | null;
      courseIds?: number[] | null;
      schoolId?: number | null;
      expired?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
    iat?: number;
  }
}