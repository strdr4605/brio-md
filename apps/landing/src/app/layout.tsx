import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <title>Vibe Academy — Robotică, Programare & STEM pentru Copii și Adolescenți</title>
        <meta
          name="description"
          content="Academia de tehnologie și inovație din Chișinău: cursuri practice de robotică, programare, electronică și STEM pentru copii și adolescenți (5-17 ani)."
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
