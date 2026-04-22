"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, ChevronRight, Plus } from "lucide-react";

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "รอยืนยัน", color: "bg-gray-100 text-gray-700" },
  confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700" },
  production: { label: "กำลังผลิต", color: "bg-yellow-100 text-yellow-700" },
  ready: { label: "พร้อมส่ง", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: (d.createdAt as Timestamp)?.toDate?.() ?? new Date(),
            updatedAt: (d.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
          } as Order;
        });
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลได้");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">รายการออเดอร์</h2>
        <span className="text-sm text-gray-500">{orders.length} รายการ</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">ยังไม่มีออเดอร์</p>
          <Link
            href="/mobile/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            สร้างออเดอร์แรก
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.pending;
            return (
              <Link
                key={order.id}
                href={`/mobile/orders/${order.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
