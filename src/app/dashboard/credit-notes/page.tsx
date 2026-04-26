"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileMinus, Loader2 } from "lucide-react";
import { listCreditNotes } from "@/lib/credit-notes";
import { formatTHB } from "@/lib/money";
import type { CreditNote } from "@/types";

export default function CreditNotesListPage() {
  const [items, setItems] = useState<CreditNote[] | null>(null);

  useEffect(() => {
    listCreditNotes()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileMinus className="w-6 h-6 text-amber-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ใบลดหนี้</h2>
          <p className="text-sm text-gray-600">ออกจากใบกำกับภาษีต้นฉบับ — สร้างใหม่ผ่านหน้า invoice detail</p>
        </div>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีใบลดหนี้
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">วันออก</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-left px-4 py-2.5">อ้างอิง</th>
                <th className="text-right px-4 py-2.5">ยอดลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((cn) => (
                <tr key={cn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/dashboard/credit-notes/${cn.id}`} className="text-amber-700 hover:underline">
                      {cn.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{cn.issueDate.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-2.5">{cn.customerSnapshot?.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{cn.originalInvoiceNumber}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                    −{formatTHB(cn.grandTotal)}
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
