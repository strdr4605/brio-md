import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { users } from '@brio-md/db';

const sql = postgres(process.env.DATABASE_URL || 'postgres://brio:briopassword@localhost:5432/brio_md', { max: 1 });
const db = drizzle(sql, { schema: { users } });

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        console.log('[Auth] Login attempt for:', email);

        // Get user from DB
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          console.log('[Auth] User not found:', email);
          return null;
        }

        if (!user.passwordHash) {
          console.log('[Auth] No password hash for:', email);
          return null;
        }

        console.log('[Auth] User found, checking password...');
        console.log('[Auth] Hash in DB:', user.passwordHash.substring(0, 30) + '...');

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log('[Auth] Password valid:', isValid);

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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
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
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
});