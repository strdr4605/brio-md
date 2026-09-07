
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-5 py-20">

        <div className="relative mb-6 flex justify-center">
            {/* Ambient background glow */}
            <div className="absolute -inset-x-20 -top-10 h-32 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-3xl rounded-full pointer-events-none" />
            
            <h1 className="relative text-6xl md:text-7xl font-black text-center tracking-tight text-gray-900">
              Brio<span className="bg-gradient-to-tr from-blue-600 to-indigo-600 bg-clip-text text-transparent">.md</span>
            </h1>
          </div>

          <p className="text-2xl md:text-3xl font-black text-center text-slate-800 tracking-tight mb-2 max-w-2xl mx-auto">În curând va fi gata
          </p>

      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <p className="text-center text-gray-500">© {new Date().getFullYear()} Brio.md</p>
      </footer>
    </div>
  );
}
