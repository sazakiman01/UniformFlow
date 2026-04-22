"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderItem, Customer, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, MapPin, Package } from "lucide-react";

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "รอยืนยัน", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "confirmed", label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "production", label: "กำลังผลิต", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "ready", label: "พร้อมส่ง", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "shipped", label: "จัดส่งแล้ว", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  { value: "completed", label: "เสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-300" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Order
        const orderSnap = await getDoc(doc(db, "orders", id));
        if (!orderSnap.exists()) {
          setError("ไม่พบออเดอร์");
          setLoading(false);
          return;
        }
        const d = orderSnap.data();
        const orderData: Order = {
          id: orderSnap.id,
          ...d,
          createdAt: (d.createdAt as Timestamp)?.toDate?.() ?? new Date(),
          updatedAt: (d.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
        } as Order;
        setOrder(orderData);

        // Customer
        if (orderData.customerId) {
          const customerSnap = await getDoc(doc(db, "customers", orderData.customerId));
          if (customerSnap.exists()) {
            setCustomer({ id: customerSnap.id, ...customerSnap.data() } as Customer);
          }
        }

        // Order Items
        const itemsQuery = query(
          collection(db, "orderItems"),
          where("orderId", "==", id)
        );
        const itemsSnap = await getDocs(itemsQuery);
        setItems(
          itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderItem))
        );
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error || "ไม่พบข้อมูล"}
        </div>
        <Link href="/mobile/orders" className="text-blue-600">
          ← กลับหน้ารายการ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/mobile/orders" className="p-2 -ml-2 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">สถานะออเดอร์</h3>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((opt) => {
            const isActive = order.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                disabled={updating || isActive}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  isActive
                    ? opt.color + " ring-2 ring-offset-1 ring-blue-500"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                } disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลลูกค้า</h3>
          <p className="font-medium text-gray-900">{customer.name}</p>
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-2 text-blue-600"
          >
            <Phone className="w-4 h-4" />
            {customer.phone}
          </a>
          {customer.address?.fullAddress && (
            <div className="flex items-start gap-2 text-gray-700 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{customer.address.fullAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">ไม่มีรายการ</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-3">
                  {item.specifications?.logoImage ? (
                    <img
                      src={item.specifications.logoImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.specifications?.customNotes && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.specifications.customNotes}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">ยอดรวม</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
