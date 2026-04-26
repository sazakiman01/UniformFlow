"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText, Loader2, Plus } from "lucide-react";
import { listReceipts, type Receipt } from "@/lib/receipts";
import { formatTHB } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";

export default function ReceiptsListPage() {
  const { canManageFinance } = useAuth();
  const [items, setItems] = useState<Receipt[] | null>(null);

  useEffect(() => {
    listReceipts()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-6 h-6 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ใบเสร็จรับเงิน</h2>
            <p className="text-sm text-gray-600">
              ใบเสร็จอย่างเดียว (ไม่ใช่ใบกำกับ) — ใช้ตอนรับเงินจาก invoice หรือรับเงินสด
            </p>
          </div>
        </div>
        {canManageFinance && (
          <Link
            href="/dashboard/receipts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            ออกใบเสร็จใหม่
          </Link>
        )}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีใบเสร็จ
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">วันที่</th>
                <th className="text-left px-4 py-2.5">ผู้จ่าย</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">รายการ</th>
                <th className="text-right px-4 py-2.5">ยอด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/dashboard/receipts/${r.id}`} className="text-green-700 hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{r.issueDate.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-2.5">{r.customerSnapshot?.name ?? "-"}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-600 text-xs">{r.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-green-700">
                    {formatTHB(r.amount)}
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
