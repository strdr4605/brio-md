import Link from "next/link";
import { STAFF_PORTAL_URL, LEARNING_PORTAL_URL } from "@/lib/config";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-base shadow-xs">
              V
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              Vibe<span className="text-slate-500 font-semibold">Academy</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#programe" className="hover:text-slate-900 transition-colors">
              Programe
            </a>
            <a href="#grupe" className="hover:text-slate-900 transition-colors">
              Grupe de Vârstă
            </a>
            <a href="#filiale" className="hover:text-slate-900 transition-colors">
              Filiale
            </a>
            <a href="#despre" className="hover:text-slate-900 transition-colors">
              Despre Noi
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={LEARNING_PORTAL_URL}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors hidden sm:inline-block"
            >
              Learning Portal
            </a>
            <a
              href={STAFF_PORTAL_URL}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all duration-150 shadow-xs"
            >
              Staff Portal
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono uppercase tracking-wider text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Academia de Tehnologie & STEM • Chișinău
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.12]">
                Robotică, programare și inginerie practică. <br className="hidden sm:inline" />
                <span className="text-slate-500 font-normal">Abilități reale pentru viitorul copiilor.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                La Vibe Academy copiii și adolescenții își dezvoltă gândirea analitică prin proiecte practice de robotică, codare și circuite electronice. Lucrăm în echipe restrânse, ghidați de mentori pasionați.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={LEARNING_PORTAL_URL}
                  className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all duration-150 shadow-xs"
                >
                  Intră în Learning Portal
                </a>
                <a
                  href={STAFF_PORTAL_URL}
                  className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-150"
                >
                  Portal Staff & Profesori
                </a>
              </div>

              {/* Highlights Bar */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>4 Filiale Moderne în Chișinău</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Kituri Reale & Proiecte Hardware</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Robotics Project Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold uppercase text-slate-700">Proiect Activ • Laborator</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500">Robotică & Electronică</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modul Curent</span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Rover Autonom cu Senzori Ultrasonici & Motoare Pas-cu-Pas
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Construcție mecanică și algoritm de navigare în timp real programat în C++ pe placă Arduino.
                  </p>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
                    <span className="font-medium">Senzori HC-SR04 Calibrați</span>
                    <span className="font-bold text-emerald-600">3 / 3 Conectați</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
                    <span className="font-medium">Firmware Microcontroller</span>
                    <span className="font-bold text-slate-900">Algoritm Evitare Obstacole</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
                    <span className="font-medium">Nivel Cursanți</span>
                    <span className="font-bold text-slate-900">Junior & Teens (10–14 ani)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Echipă Laborator</span>
                  <span className="font-bold text-slate-900">Grupa Robotică Sâmbătă</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Pillar Programs Section */}
        <section id="programe" className="border-y border-slate-200/80 bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                01 — Programe Educaționale
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                Pilonii de formare inginerească și digitală
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400">01 / ROBOTICĂ</div>
                <h3 className="text-lg font-bold text-slate-900">Robotică & Mecatronică</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Construcție practică cu LEGO Education, SPIKE Prime și componente modulare. Proiectare de mecanisme și roboți autonomi.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400">02 / CODING</div>
                <h3 className="text-lg font-bold text-slate-900">Programare & Software</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  De la Scratch și logică algoritmică la Python, dezvoltare web modernă și gândire computațională structurată.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400">03 / ELECTRONICĂ</div>
                <h3 className="text-lg font-bold text-slate-900">Circuite & IoT</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Lucru cu plăci Arduino și ESP32, senzori inteligenți, breadboard-uri și componente electronice reale.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400">04 / STEM</div>
                <h3 className="text-lg font-bold text-slate-900">Știință & Matematică Aplicată</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Concepte de fizică, mecanică și logică demonstrate prin experimente interactive și simulări practice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Age Groups Section */}
        <section id="grupe" className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                02 — Adaptat Fiecărei Vârste
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                Grupe calibrate pe etape de dezvoltare
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
                <div className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700">
                  5 – 7 ANI
                </div>
                <h3 className="text-lg font-bold text-slate-900">Early STEM & Inițiere Lego</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Descoperirea primelor mecanisme simple, roți dințate, orientare spațială și algoritmi vizuali intuitivi.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
                <div className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700">
                  8 – 11 ANI
                </div>
                <h3 className="text-lg font-bold text-slate-900">Robotică & Coding Junior</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Construcție de roboți complecși, programare în Scratch și Python introductiv, integrare de motoare și senzori.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
                <div className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700">
                  12 – 17 ANI
                </div>
                <h3 className="text-lg font-bold text-slate-900">Adolescenți & Tehnologii Avansate</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Python avansat, programare microcontroller în C++, dezvoltare software, baze de date și robotică competitivă.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Local Branches Section */}
        <section id="filiale" className="border-t border-slate-200/80 bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                03 — Locații în Chișinău
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                Filiale moderne aproape de tine
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase font-mono">SECTOR BOTANICA</div>
                <h3 className="text-base font-bold text-slate-900">Filiala Botanica</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  bd. Dacia • Laboratoare dotate pentru robotică și STEM.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase font-mono">SECTOR CENTRU</div>
                <h3 className="text-base font-bold text-slate-900">Filiala Centru</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  str. Pușkin • Hub tehnologic dedicat programării și IoT.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase font-mono">SECTOR RÎȘCANI</div>
                <h3 className="text-base font-bold text-slate-900">Filiala Rîșcani</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  bd. Moscova • Săli moderne de circuite și mecatronică.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase font-mono">SECTOR BUIUCANI</div>
                <h3 className="text-base font-bold text-slate-900">Filiala Buiucani</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  str. Ion Creangă • Centru educațional digital și coding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="despre" className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white text-slate-900 font-black flex items-center justify-center text-xs">
                V
              </div>
              <span className="text-base font-black text-white tracking-tight">Vibe Academy</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-300 font-medium">
              <a href="#programe" className="hover:text-white transition-colors">
                Programe
              </a>
              <a href="#grupe" className="hover:text-white transition-colors">
                Grupe Vârstă
              </a>
              <a href="#filiale" className="hover:text-white transition-colors">
                Filiale
              </a>
              <a href={LEARNING_PORTAL_URL} className="hover:text-white transition-colors">
                Learning Portal
              </a>
              <a href={STAFF_PORTAL_URL} className="hover:text-white transition-colors">
                Staff Portal
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 font-mono">
            <p>© {new Date().getFullYear()} Vibe Academy • Chișinău, Republica Moldova.</p>
            <p>Powered by Brio.md Educational Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
