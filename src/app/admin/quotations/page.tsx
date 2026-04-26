"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Loader2 } from "lucide-react";
import { listQuotations } from "@/lib/quotations";
import { formatTHB } from "@/lib/money";
import type { Quotation, QuotationStatus } from "@/types";

const STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  accepted: "ตอบรับ",
  rejected: "ปฏิเสธ",
  expired: "หมดอายุ",
  converted: "ออกใบกำกับแล้ว",
};

const STATUS_COLOR: Record<QuotationStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
  converted: "bg-purple-100 text-purple-700",
};

export default function QuotationsListPage() {
  const [items, setItems] = useState<Quotation[] | null>(null);
  const [filter, setFilter] = useState<QuotationStatus | "all">("all");

  useEffect(() => {
    setItems(null);
    listQuotations({ status: filter === "all" ? undefined : filter })
      .then(setItems)
      .catch((e) => {
        console.error(e);
        setItems([]);
      });
  }, [filter]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">ใบเสนอราคา</h2>
          </div>
          <p className="text-sm text-gray-600">ออกใบเสนอราคาให้ลูกค้า → แปลงเป็นใบกำกับภาษีเมื่อชำระแล้ว</p>
        </div>
        <Link
          href="/admin/quotations/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          สร้างใหม่
        </Link>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto">
        {(["all", "draft", "sent", "accepted", "rejected", "expired", "converted"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              "px-3 py-1.5 text-sm rounded-lg whitespace-nowrap " +
              (filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50")
            }
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีใบเสนอราคา
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">วันออก</th>
                <th className="text-right px-4 py-2.5">ยอดรวม</th>
                <th className="text-center px-4 py-2.5">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/admin/quotations/${q.id}`} className="text-blue-600 hover:underline">
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{q.customerSnapshot?.name ?? q.customerId}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-600">
                    {q.createdAt.toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatTHB(q.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[q.status]}`}>
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
