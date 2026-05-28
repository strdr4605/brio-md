import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">Brio.md</h1>
        <p className="text-xl text-center text-gray-600 mb-2 max-w-2xl mx-auto">În curând</p>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <p className="text-center text-gray-500">© {new Date().getFullYear()} Brio.md</p>
      </footer>
    </div>
  );
}
