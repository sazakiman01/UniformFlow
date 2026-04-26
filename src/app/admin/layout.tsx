"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Users, LogOut, ArrowLeft, Building2, FileText, Receipt, Wallet, BarChart3, Truck, FileMinus } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, profile, profileLoading, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile || !isAdmin) {
      router.replace("/mobile/orders");
    }
  }, [user, loading, profile, profileLoading, isAdmin, router]);

  if (loading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 p-6 text-center">
        <div>
          <p className="mb-3">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <Link href="/mobile/orders" className="text-blue-600 underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/mobile/orders"
              className="p-2 -ml-2 text-gray-600"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 truncate">Admin</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>
      <AdminNav />
      <main className="max-w-4xl mx-auto">{children}</main>
    </div>
  );
}

function AdminNav() {
  const pathname = usePathname();
  const items = [
    { href: "/admin/users", label: "ผู้ใช้", icon: Users },
    { href: "/admin/company", label: "ข้อมูลบริษัท", icon: Building2 },
    { href: "/admin/quotations", label: "ใบเสนอราคา", icon: FileText },
    { href: "/admin/invoices", label: "ใบกำกับภาษี", icon: Receipt },
    { href: "/admin/credit-notes", label: "ใบลดหนี้", icon: FileMinus },
    { href: "/admin/delivery-notes", label: "ใบส่งของ", icon: Truck },
    { href: "/admin/expenses", label: "ค่าใช้จ่าย", icon: Wallet },
    { href: "/admin/reports", label: "รายงาน", icon: BarChart3 },
  ];
  return (
    <nav className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-4xl mx-auto px-2 flex items-center gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors " +
                (active
                  ? "border-blue-600 text-blue-700 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900")
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
