"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Plus, LogOut, List, Users, AlertCircle } from "lucide-react";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, profile, profileLoading, isAdmin, isDisabled, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  // No profile = not set up yet (admin needs to seed or accept invite)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            บัญชียังไม่ได้รับการตั้งค่า
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชีของคุณ
          </p>
          <button
            onClick={handleLogout}
            className="w-full min-h-[48px] py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  // Disabled user
  if (isDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            บัญชีถูกปิดการใช้งาน
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <button
            onClick={handleLogout}
            className="w-full min-h-[48px] py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/mobile/orders", label: "ออเดอร์", icon: List },
    { href: "/mobile/orders/new", label: "สร้างใหม่", icon: Plus },
    ...(isAdmin
      ? [{ href: "/admin/users", label: "Admin", icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="font-bold text-gray-900">UniformFlow</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
