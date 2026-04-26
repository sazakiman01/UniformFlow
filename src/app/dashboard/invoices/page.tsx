"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { listInvoices } from "@/lib/invoices";
import { formatTHB } from "@/lib/money";
import type { Invoice, InvoiceStatus, InvoiceType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  partial: "จ่ายบางส่วน",
  paid: "จ่ายครบ",
  overdue: "เกินกำหนด",
  cancelled: "ยกเลิก",
  void: "void (ลบ)",
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-300 text-gray-700",
  void: "bg-red-200 text-red-800",
};

const TYPE_SHORT: Record<InvoiceType, string> = {
  invoice: "INV",
  tax_invoice: "TAX",
  receipt: "REC",
  tax_invoice_receipt: "TAX/REC",
};

export default function InvoicesListPage() {
  const { canManageFinance } = useAuth();
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");

  useEffect(() => {
    setItems(null);
    listInvoices({ status: filter === "all" ? undefined : filter })
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
            <Receipt className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">ใบกำกับภาษี / ใบเสร็จ</h2>
          </div>
          <p className="text-sm text-gray-600">ออกใบกำกับภาษี — มี QR PromptPay ฝังในเอกสาร</p>
        </div>
        {canManageFinance && (
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            ออกเอกสารใหม่
          </Link>
        )}
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto">
        {(["all", "draft", "sent", "partial", "paid", "overdue", "cancelled"] as const).map((s) => (
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
          ยังไม่มีเอกสาร
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">ประเภท</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">ออก</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">ครบกำหนด</th>
                <th className="text-right px-4 py-2.5">รวม</th>
                <th className="text-right px-4 py-2.5">ค้างชำระ</th>
                <th className="text-center px-4 py-2.5">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500">
                    {TYPE_SHORT[inv.type]}
                  </td>
                  <td className="px-4 py-2.5">{inv.customerSnapshot?.name ?? inv.customerId}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-gray-600">
                    {inv.issueDate.toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-gray-600">
                    {inv.dueDate.toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatTHB(inv.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                    {inv.amountDue > 0 ? (
                      <span className="text-red-600">{formatTHB(inv.amountDue)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
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
