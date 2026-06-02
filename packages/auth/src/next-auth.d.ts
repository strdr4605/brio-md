import type { DefaultSession, AdapterUser as NextAdapterUser } from "next-auth";

declare module "next-auth" {
  type User = {
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
  }

  type AdapterUser = {
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
  type JWT = {
    id?: string;
    role?: string | null;
    permissions?: string[] | null;
    courseIds?: number[] | null;
    schoolId?: number | null;
    lastChangedAt?: Date | null;
    iat?: number;
  }
}