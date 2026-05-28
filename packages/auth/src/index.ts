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

        // Get user from DB
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        // Verify password
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.courseIds = (user as any).courseIds;
        token.schoolId = (user as any).schoolId;
        token.passwordLastChanged = (user as any).passwordLastChanged;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const [dbUser] = await db.select().from(users).where(eq(users.id, parseInt(token.id as string))).limit(1);
        if (dbUser && (dbUser as any).passwordLastChanged && token.passwordLastChanged) {
          const tokenIssuedAt = new Date(token.iat! * 1000);
          if ((dbUser as any).passwordLastChanged > tokenIssuedAt) {
            return { ...session, user: { ...session.user, id: token.id, expired: true } as any };
          }
        }
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).courseIds = token.courseIds;
        (session.user as any).schoolId = token.schoolId;
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
