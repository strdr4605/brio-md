
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-base shadow-sm">
              B
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">
              brio<span className="text-indigo-600">.md</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Functionalități
            </a>
            <a href="#demo" className="hover:text-neutral-900 transition-colors">
              Demonstrație
            </a>
            <a href="#about" className="hover:text-neutral-900 transition-colors">
              Despre proiect
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 transition-colors hidden sm:inline-block"
            >
              Autentificare
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-all duration-150 shadow-sm"
            >
              Intră în portal
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-mono uppercase tracking-wider text-neutral-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                Evaluare Digitală Conformată Programa Școlară
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.12]">
                Evaluări mai clare. <br className="hidden sm:inline" />
                <span className="text-neutral-500 font-normal">Rezultate reale pentru fiecare elev.</span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl">
                Brio.md simplifică procesul de testare și monitorizare în școli. Fără foi risipite, fără corectări manuale obositoare — doar teste inteligente și analize clare.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-150 shadow-sm"
                >
                  Solicită o demonstrație
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all duration-150"
                >
                  Vezi cum funcționează
                </a>
              </div>

              {/* Social Proof Bar */}
              <div className="pt-6 border-t border-neutral-200/80 flex items-center gap-6 text-xs text-neutral-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Conform Curriculum Național</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Raportare Instantă</span>
                </div>
              </div>
            </div>

            {/* Right Educational Test Interactive Card Mockup */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-neutral-300 shadow-md p-5 space-y-4">
                {/* Header of Mock Test */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-mono font-semibold uppercase text-neutral-500">Test În Desfășurare</span>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">Matematică • Clasa IX</span>
                </div>

                {/* Question Box */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Întrebarea 4 din 10</div>
                  <p className="text-sm font-semibold text-neutral-900 leading-snug">
                    Fie funcția <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-700">f(x) = 2x - 4</code>. Care este valoarea lui <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-xs">x</code> pentru care <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-xs">f(x) = 0</code>?
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-neutral-50/50">
                    <span>A) x = -2</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-600 bg-indigo-50/40 text-xs font-semibold text-indigo-900">
                    <span>B) x = 2</span>
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">Răspuns Selectat</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-neutral-50/50">
                    <span>C) x = 4</span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>Acuratețe estimată</span>
                  <span className="font-bold text-indigo-600">96.4%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Feature Grid Section */}
        <section id="features" className="border-y border-neutral-200/90 bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600">
                01 — Arhitectură & Module
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-2">
                Conceput pentru profesori, elevi și administrație
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 border-t border-neutral-200">
              {/* Feature 1 */}
              <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-3">
                <div className="text-xs font-mono font-bold text-neutral-400">01 / EVALUARE</div>
                <h3 className="text-lg font-bold text-neutral-900">Testări & Rapoarte Automate</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Generare rapidă de testări conform programei și analiză detaliată a nivelului de pregătire per elev.
                </p>
                <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Află mai multe</span>
                  <span>→</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-3">
                <div className="text-xs font-mono font-bold text-neutral-400">02 / ADAPTIV</div>
                <h3 className="text-lg font-bold text-neutral-900">Învățare Personalizată</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Algoritmul adaptează gradul de dificultate al exercițiilor în funcție de evoluția individuală.
                </p>
                <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Află mai multe</span>
                  <span>→</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0 space-y-3">
                <div className="text-xs font-mono font-bold text-neutral-400">03 / ADMINISTRARE</div>
                <h3 className="text-lg font-bold text-neutral-900">Gestionare Simplă a Claselor</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Evidență clară a grupelor, claselor și rezultatelor într-un panou de control fără birocrație.
                </p>
                <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Află mai multe</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 text-xs py-12 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white text-neutral-900 font-bold flex items-center justify-center text-xs">
                B
              </div>
              <span className="text-base font-bold text-white tracking-tight">brio.md</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-neutral-300 font-medium">
              <a href="#features" className="hover:text-white transition-colors">
                Functionalități
              </a>
              <a href="#demo" className="hover:text-white transition-colors">
                Demonstrație
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Termeni
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Confidențialitate
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 font-mono">
            <p>© {new Date().getFullYear()} Brio.md. Platformă educațională de evaluare.</p>
            <p>Chișinău • București</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
