import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <title>Brio.md</title>
        <meta name="description" content="School Management Platform" />
      </head>
      <body>{children}</body>
    </html>
  );
}
