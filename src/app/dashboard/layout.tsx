"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Users, LogOut, Building2, FileText, Receipt, Wallet, BarChart3, Truck, FileMinus, ReceiptText, Wrench, Menu, X, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, UserProfile } from "@/types";
import { can, PermissionKey } from "@/lib/roles";

type NavLink = {
  href: string;
  label: string;
  icon: typeof Users;
  requires?: PermissionKey;
};
type NavDivider = { type: "divider"; label: string };
type NavEntry = NavLink | NavDivider;

const NAV_ITEMS: NavEntry[] = [
  { type: "divider", label: "หน้าหลัก" },
  { href: "/dashboard", label: "ภาพรวม", icon: BarChart3 },
  { type: "divider", label: "จัดการ" },
  { href: "/dashboard/users", label: "ผู้ใช้", icon: Users, requires: "manageUsers" },
  { href: "/dashboard/company", label: "ข้อมูลบริษัท", icon: Building2, requires: "manageCompany" },
  { type: "divider", label: "เอกสารการเงิน" },
  { href: "/dashboard/quotations", label: "ใบเสนอราคา", icon: FileText, requires: "viewFinance" },
  { href: "/dashboard/invoices", label: "ใบกำกับภาษี", icon: Receipt, requires: "viewFinance" },
  { href: "/dashboard/receipts", label: "ใบเสร็จ", icon: ReceiptText, requires: "viewFinance" },
  { href: "/dashboard/credit-notes", label: "ใบลดหนี้", icon: FileMinus, requires: "viewFinance" },
  { href: "/dashboard/billing-notes", label: "ใบวางบิล", icon: FileText, requires: "viewFinance" },
  { href: "/dashboard/expenses", label: "ค่าใช้จ่าย", icon: Wallet, requires: "viewFinance" },
  { type: "divider", label: "เอกสารปฏิบัติการ" },
  { href: "/dashboard/delivery-notes", label: "ใบส่งของ", icon: Truck },
  { type: "divider", label: "ระบบ" },
  { href: "/dashboard/reports", label: "รายงาน", icon: BarChart3, requires: "viewFinance" },
  { href: "/dashboard/tools", label: "เครื่องมือ", icon: Wrench, requires: "manageUsers" },
  { href: "/dashboard/guide", label: "คู่มือ", icon: BookOpen },
];

const ROLE_BADGE: Record<UserProfile["role"], string> = {
  owner: "bg-purple-100 text-purple-700",
  accountant: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-700",
};

function filterNav(items: NavEntry[], profile: UserProfile | null): NavEntry[] {
  if (!profile) return [];
  // Filter out links the user cannot access
  const filtered: NavEntry[] = [];
  for (const item of items) {
    if ("type" in item && item.type === "divider") {
      filtered.push(item);
      continue;
    }
    const link = item as NavLink;
    if (!link.requires || can[link.requires](profile)) {
      filtered.push(link);
    }
  }
  // Drop dividers that have no link items after them (or trailing dividers)
  const result: NavEntry[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const cur = filtered[i];
    if ("type" in cur && cur.type === "divider") {
      const next = filtered[i + 1];
      if (!next || ("type" in next && next.type === "divider")) continue;
    }
    result.push(cur);
  }
  return result;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, profile, profileLoading, isDisabled, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile || isDisabled) {
      router.replace("/login");
    }
  }, [user, loading, profile, profileLoading, isDisabled, router]);

  // ปิด drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Early returns after all hooks are called
  if (loading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile || isDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 p-6 text-center">
        <div>
          <p className="mb-3">บัญชีถูกปิดใช้งาน หรือไม่มีสิทธิ์เข้าถึง</p>
          <Link href="/login" className="text-blue-600 underline">
            ไปหน้า Login
          </Link>
        </div>
      </div>
    );
  }

  const navItems = filterNav(NAV_ITEMS, profile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-2 text-gray-700"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 truncate">UniformFlow Admin</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-gray-600"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <aside
        className={
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 " +
          "transform transition-all duration-200 ease-in-out lg:translate-x-0 " +
          (drawerOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0") + " " +
          (!drawerOpen && "lg:w-16 lg:hover:w-64")
        }
        onMouseEnter={() => !drawerOpen && setSidebarCollapsed(false)}
        onMouseLeave={() => !drawerOpen && setSidebarCollapsed(true)}
      >
        <SidebarContent
          pathname={pathname ?? ""}
          onClose={() => setDrawerOpen(false)}
          onSignOut={() => signOut()}
          userEmail={user.email ?? ""}
          profile={profile}
          navItems={navItems}
          collapsed={!drawerOpen && sidebarCollapsed}
        />
      </aside>

      {/* Main content area — offset by sidebar width on desktop */}
      <main className={`min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  pathname,
  onClose,
  onSignOut,
  userEmail,
  profile,
  navItems,
  collapsed,
}: {
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
  userEmail: string;
  profile: UserProfile;
  navItems: NavEntry[];
  collapsed: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={onClose}>
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-gray-900 truncate">UniformFlow</span>}
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 text-gray-500" aria-label="ปิดเมนู">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item, i) => {
          if ("type" in item && item.type === "divider") {
            return (
              !collapsed && (
                <div
                  key={`d-${i}`}
                  className="px-3 mt-4 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                >
                  {item.label}
                </div>
              )
            );
          }
          const { href, label, icon: Icon } = item as NavLink;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-2.5 px-3 py-2 my-0.5 rounded-lg text-sm transition-colors " +
                (active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100") +
                (collapsed ? " justify-center" : "")
              }
              title={collapsed ? label : undefined}
            >
              <Icon className={"w-4 h-4 flex-shrink-0 " + (active ? "text-blue-600" : "text-gray-500")} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-2">
        <div className="px-3">
          {!collapsed && (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[profile.role]}`}
                >
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate mb-1.5" title={userEmail}>
                {userEmail}
              </div>
            </>
          )}
          <button
            onClick={onSignOut}
            className={`w-full inline-flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? "ออกจากระบบ" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
