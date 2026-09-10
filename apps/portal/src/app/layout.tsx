import { Providers } from "@/components/providers";
import { auth } from "@brio-md/auth";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html>
      <head>
        <title>Portal - Brio.md</title>
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
