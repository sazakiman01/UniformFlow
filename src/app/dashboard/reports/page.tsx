"use client";

import Link from "next/link";
import { Users, FileText, Receipt, BarChart3, Calculator, Wallet, ArrowRight } from "lucide-react";

const reports = [
  {
    href: "/dashboard/reports/ar-aging",
    title: "ลูกหนี้คงค้าง (AR Aging)",
    desc: "ใบกำกับที่ยังค้างชำระ — แบ่งช่วง 30/60/90 วัน",
    icon: Users,
    color: "text-orange-600 bg-orange-50",
  },
  {
    href: "/dashboard/reports/pnl",
    title: "งบกำไรขาดทุน (P&L)",
    desc: "รายได้ - COGS - ค่าใช้จ่าย = กำไรสุทธิ",
    icon: FileText,
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/dashboard/reports/vat",
    title: "ภาษีมูลค่าเพิ่ม (ภพ.30)",
    desc: "VAT ขาย - VAT ซื้อ — ส่งกรมสรรพากรรายเดือน",
    icon: Receipt,
    color: "text-purple-600 bg-purple-50",
  },
  {
    href: "/dashboard/reports/wht",
    title: "หัก ณ ที่จ่าย (ภงด.3/53)",
    desc: "รายงานภาษีหัก ณ ที่จ่ายที่เราหัก supplier",
    icon: Calculator,
    color: "text-amber-600 bg-amber-50",
  },
  {
    href: "/dashboard/reports/cash-flow",
    title: "กระแสเงินสด (Cash Flow)",
    desc: "เงินเข้า - เงินออก ในแต่ละช่วง",
    icon: Wallet,
    color: "text-emerald-600 bg-emerald-50",
  },
];

export default function ReportsHub() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">รายงาน</h2>
        </div>
        <p className="text-sm text-gray-600">เลือกรายงานที่ต้องการดูหรือ export</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition flex items-start gap-3"
          >
            <div className={`p-2.5 rounded-lg ${r.color}`}>
              <r.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
