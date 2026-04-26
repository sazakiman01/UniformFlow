"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, BarChart3, TrendingUp, AlertTriangle, Users, Receipt, Wallet,
} from "lucide-react";
import { buildPLReport } from "@/lib/reports/pnl";
import { buildARAgingReport } from "@/lib/reports/ar-aging";
import { buildCashFlowReport } from "@/lib/reports/cash-flow";
import { formatTHB } from "@/lib/money";
import type { PLReport, ARAgingReport, CashFlowReport } from "@/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export default function DashboardPage() {
  const [pl, setPL] = useState<PLReport | null>(null);
  const [ar, setAR] = useState<ARAgingReport | null>(null);
  const [cf, setCF] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    Promise.all([
      buildPLReport({ from, to }),
      buildARAgingReport(),
      buildCashFlowReport({ from, to }),
    ])
      .then(([p, a, c]) => {
        setPL(p);
        setAR(a);
        setCF(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const monthName = new Date().toLocaleString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ภาพรวมกิจการ</h2>
          <p className="text-sm text-gray-600">ประจำเดือน {monthName}</p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          title="รายได้เดือนนี้"
          value={pl?.revenue ?? 0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          link="/admin/invoices"
        />
        <KPI
          title="กำไรสุทธิ"
          value={pl?.netProfit ?? 0}
          extra={pl ? `${pl.netMarginPct.toFixed(1)}%` : undefined}
          icon={<Receipt className="w-5 h-5" />}
          color={(pl?.netProfit ?? 0) >= 0 ? "green" : "red"}
          link="/admin/reports/pnl"
        />
        <KPI
          title="ลูกหนี้คงค้าง"
          value={ar?.totalDue ?? 0}
          extra={ar ? `${ar.items.length} ใบ` : undefined}
          icon={<Users className="w-5 h-5" />}
          color="amber"
          link="/admin/reports/ar-aging"
        />
        <KPI
          title="กระแสเงินสด"
          value={cf?.net ?? 0}
          icon={<Wallet className="w-5 h-5" />}
          color={(cf?.net ?? 0) >= 0 ? "emerald" : "red"}
          link="/admin/reports/cash-flow"
        />
      </div>

      {/* AR breakdown */}
      {ar && ar.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              ลูกหนี้ค้างชำระ
            </h3>
            <Link href="/admin/reports/ar-aging" className="text-sm text-blue-600 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <Bucket label="ยังไม่ครบกำหนด" value={ar.buckets.current} color="bg-blue-50 text-blue-700" />
            <Bucket label="1-30 วัน" value={ar.buckets["1-30"]} color="bg-amber-50 text-amber-700" />
            <Bucket label="31-60 วัน" value={ar.buckets["31-60"]} color="bg-orange-50 text-orange-700" />
            <Bucket label="61-90 วัน" value={ar.buckets["61-90"]} color="bg-red-50 text-red-700" />
            <Bucket label="เกิน 90 วัน" value={ar.buckets["90+"]} color="bg-red-100 text-red-800" />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QuickLink href="/admin/invoices/new" label="ออกใบกำกับ" icon={Receipt} />
        <QuickLink href="/admin/quotations/new" label="สร้างใบเสนอราคา" icon={Receipt} />
        <QuickLink href="/admin/expenses" label="บันทึกค่าใช้จ่าย" icon={Wallet} />
        <QuickLink href="/admin/reports/vat" label="รายงานภพ.30" icon={Receipt} />
      </div>
    </div>
  );
}

function KPI({
  title, value, extra, icon, color, link,
}: {
  title: string; value: number; extra?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "emerald" | "red";
  link?: string;
}) {
  const map = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };
  const inner = (
    <div className={`rounded-xl border p-4 ${map[color]} hover:shadow-sm transition`}>
      <div className="flex items-center justify-between text-sm font-medium opacity-80">
        <span className="line-clamp-1">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{formatTHB(value)}</div>
      {extra && <div className="text-xs opacity-70 mt-0.5">{extra}</div>}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function Bucket({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-2 rounded-lg ${color}`}>
      <div className="text-xs">{label}</div>
      <div className="text-sm font-bold tabular-nums">{formatTHB(value)}</div>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
    >
      <Icon className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
