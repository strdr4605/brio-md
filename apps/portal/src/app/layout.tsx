import type { Viewport } from "next";
import { Providers } from "@/components/providers";
import { auth } from "@brio-md/auth";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="ro">
      <head>
        <title>Portal - Brio.md</title>
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
