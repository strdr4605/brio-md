import { Providers } from "@/components/providers";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
