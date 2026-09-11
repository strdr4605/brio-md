/// <reference types="./next-auth.d.ts" />

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users } from "@brio-md/db";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 10 },
);
const db = drizzle(sql, { schema: { users } });

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  permissions?: string[] | null;
  courseIds?: number[] | null;
  studentId?: number | null;
  schoolId?: number | null;
  lastChangedAt?: Date | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.active) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions || [],
          courseIds: user.courseIds || [],
          studentId: user.studentId,
          schoolId: user.schoolId,
          lastChangedAt: user.lastChangedAt,
        } as AuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        const u = user as AuthUser;
        token.id = u.id as string;
        token.role = u.role ?? null;
        token.permissions = u.permissions ?? null;
        token.courseIds = u.courseIds ?? null;
        token.studentId = u.studentId ?? null;
        token.schoolId = u.schoolId ?? null;
        token.lastChangedAt = u.lastChangedAt ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const userId = parseInt(token.id as string, 10);
        if (isNaN(userId)) {
          return session;
        }

        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!dbUser || !dbUser.active) {
          session.user.id = token.id as string;
          session.user.expired = true;
          return session;
        }

        if (dbUser.lastChangedAt && token.iat) {
          const tokenIssuedAt = new Date(token.iat * 1000);
          if (dbUser.lastChangedAt > tokenIssuedAt) {
            session.user.id = token.id as string;
            session.user.expired = true;
            return session;
          }
        }

        session.user.id = String(dbUser.id);
        session.user.email = dbUser.email ?? "";
        session.user.name = dbUser.name ?? "";
        session.user.role = dbUser.role as typeof session.user.role;
        session.user.permissions = (dbUser.permissions || []) as typeof session.user.permissions;
        session.user.courseIds = (dbUser.courseIds || []) as typeof session.user.courseIds;
        session.user.studentId = dbUser.studentId as typeof session.user.studentId;
        session.user.schoolId = dbUser.schoolId as typeof session.user.schoolId;
        session.user.expired = false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
