import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <title>Brio.md — Platformă Educațională de Evaluare și Gestionare</title>
        <meta name="description" content="Platforma integrată pentru elevi, profesori și școli. Monitorizează progresul și optimizează procesul de învățare." />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

