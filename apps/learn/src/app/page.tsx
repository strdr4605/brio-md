import { signIn } from '@/lib/auth';
import { auth } from '@brio-md/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in, redirect to courses
  const session = await auth();
  if (session?.user) {
    redirect('/courses');
  }
  
  const params = await searchParams;
  const error = params.error;
  
  async function handleLogin(formData: FormData) {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      await signIn('credentials', {
        email,
        password,
      }, {
        redirectTo: '/courses',
      });
    } catch (error: any) {
      // Check if it's a redirect (Auth.js throws on redirect)
      if (error?.digest?.includes('NEXT_REDIRECT')) {
        throw error; // Re-throw the redirect
      }
      // Otherwise redirect to error page
      redirect('/?error=Invalid+credentials');
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Learning Portal</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            Invalid credentials. Please try again.
          </div>
        )}
        
        <form action={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="teacher@vibe.md"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link href="https://in.brio.md" className="text-sm text-green-600 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}