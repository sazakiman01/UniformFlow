import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UniformFlow
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ระบบบัญชี การเงิน และภาษี สำหรับธุรกิจยูนิฟอร์ม
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    </main>
  );
}
