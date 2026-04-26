"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus } from "lucide-react";
import { listBillingNotes, type BillingNote, type BillingNoteStatus } from "@/lib/billing-notes";
import { formatTHB } from "@/lib/money";

const STATUS_LABEL: Record<BillingNoteStatus, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

const STATUS_COLOR: Record<BillingNoteStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BillingNotesListPage() {
  const [items, setItems] = useState<BillingNote[] | null>(null);

  useEffect(() => {
    listBillingNotes()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ใบวางบิล</h2>
            <p className="text-sm text-gray-600">รวม invoice ค้างหลายใบในเอกสารเดียว ใช้ไปเก็บเงินจากลูกค้า</p>
          </div>
        </div>
        <Link
          href="/admin/billing-notes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          สร้างใบวางบิล
        </Link>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีใบวางบิล
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">วันที่</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-center px-4 py-2.5">ใบ</th>
                <th className="text-right px-4 py-2.5">ยอดรวม</th>
                <th className="text-center px-4 py-2.5">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/admin/billing-notes/${b.id}`} className="text-indigo-700 hover:underline">
                      {b.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{b.issueDate.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-2.5">{b.customerSnapshot?.name}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{b.items.length}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatTHB(b.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
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
