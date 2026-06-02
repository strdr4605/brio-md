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
  { max: 1 },
);
const db = drizzle(sql, { schema: { users } });

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
          schoolId: user.schoolId,
          lastChangedAt: user.lastChangedAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string | null }).role ?? null;
        token.permissions = (user as { permissions?: string[] | null }).permissions ?? null;
        token.courseIds = (user as { courseIds?: number[] | null }).courseIds ?? null;
        token.schoolId = (user as { schoolId?: number | null }).schoolId ?? null;
        token.lastChangedAt = (user as { lastChangedAt?: Date | null }).lastChangedAt ?? null;
      }
      return token;
    },
async session({ session, token }) {
      if (session.user) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(token.id as string)))
          .limit(1);
        if (dbUser?.lastChangedAt && token.lastChangedAt) {
          const tokenIssuedAt = new Date(token.iat! * 1000);
          if (dbUser.lastChangedAt > tokenIssuedAt) {
            session.user.id = token.id as string;
            session.user.expired = true;
            return session;
          }
        }
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.permissions = token.permissions as typeof session.user.permissions;
        session.user.courseIds = token.courseIds as typeof session.user.courseIds;
        session.user.schoolId = token.schoolId as typeof session.user.schoolId;
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
