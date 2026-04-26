"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Truck, Loader2 } from "lucide-react";
import { listDeliveryNotes } from "@/lib/delivery-notes";
import type { DeliveryNote } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<DeliveryNote["status"], string> = {
  draft: "ร่าง",
  shipped: "จัดส่งแล้ว",
  delivered: "ส่งถึงแล้ว",
};

const STATUS_COLOR: Record<DeliveryNote["status"], string> = {
  draft: "bg-gray-100 text-gray-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
};

export default function DeliveryNotesListPage() {
  const { canManageOps } = useAuth();
  const [items, setItems] = useState<DeliveryNote[] | null>(null);

  useEffect(() => {
    listDeliveryNotes()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">ใบส่งของ</h2>
        </div>
        {canManageOps && (
          <Link
            href="/dashboard/delivery-notes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            สร้างใหม่
          </Link>
        )}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีใบส่งของ
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-left px-4 py-2.5">วันส่ง</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">ขนส่ง</th>
                <th className="text-center px-4 py-2.5">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/dashboard/delivery-notes/${d.id}`} className="text-blue-600 hover:underline">
                      {d.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{d.customerSnapshot?.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{d.deliveryDate.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-600">
                    {d.carrier ?? "-"}
                    {d.trackingNo ? ` · ${d.trackingNo}` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[d.status]}`}>
                      {STATUS_LABEL[d.status]}
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
