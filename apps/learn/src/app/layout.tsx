import type { Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <title>Learn - Brio.md</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
