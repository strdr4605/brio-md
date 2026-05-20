import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Simple auth config without DB - will be enhanced later
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Add real DB check
        // For now, accept any credentials and return mock user
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Mock user for development
        const email = credentials.email as string;
        
        if (email === 'admin@brio.md' && credentials.password === 'admin123') {
          return {
            id: '1',
            email: 'admin@brio.md',
            name: 'Super Admin',
            role: 'superadmin',
            permissions: ['super'],
            courseIds: [],
            schoolId: null,
          };
        }

        if (email === 'admin@vibe.md' && credentials.password === 'admin123') {
          return {
            id: '2',
            email: 'admin@vibe.md',
            name: 'School Admin',
            role: 'admin',
            permissions: ['admin'],
            courseIds: [],
            schoolId: 1,
          };
        }

        if (email === 'teacher@vibe.md' && credentials.password === 'teacher123') {
          return {
            id: '3',
            email: 'teacher@vibe.md',
            name: 'John Teacher',
            role: 'teacher',
            permissions: ['teach'],
            courseIds: [1],
            schoolId: 1,
          };
        }

        return null;
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