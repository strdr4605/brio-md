import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">Brio.md</h1>
        <p className="text-xl text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Modern school management platform for Vibe Academy
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="https://in.brio.md"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Staff Portal
          </Link>
          <Link
            href="https://learn.brio.md"
            className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Learning Portal
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Attendance Tracking</h3>
            <p className="text-gray-600">Track student attendance with monthly reports</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Payment Management</h3>
            <p className="text-gray-600">Manage contracts and monthly payments</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Course Materials</h3>
            <p className="text-gray-600">Share presentations and learning resources</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <p className="text-center text-gray-500">© 2025 Brio.md</p>
      </footer>
    </div>
  );
}
