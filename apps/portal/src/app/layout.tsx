import { redirect } from 'next/navigation';
import { auth } from '@brio-md/auth';
import { Providers } from '@/components/providers';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // If not logged in, show login page (root page)
  // If logged in, redirect to dashboard
  
  return (
    <html>
      <head>
        <title>Portal - Brio.md</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}