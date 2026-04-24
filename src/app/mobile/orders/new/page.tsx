"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  collection,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateOrderNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import OrderForm, { OrderFormValues } from "@/components/mobile/OrderForm";

export default function NewOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    values: OrderFormValues & { totalAmount: number; remainingAmount: number }
  ) => {
    setError("");
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      // 1. Customer: reuse if dedup matched, otherwise create new
      let customerId = values.customerId;
      if (!customerId) {
        const customerRef = doc(collection(db, "customers"));
        batch.set(customerRef, {
          name: values.customerName,
          phone: values.customerPhone,
          address: {
            street: "",
            district: "",
            province: "",
            postcode: "",
            fullAddress: values.customerAddress,
          },
          channel: values.channel,
          createdAt: now,
          updatedAt: now,
        });
        customerId = customerRef.id;
      } else {
        // Update existing customer's latest info
        const customerRef = doc(db, "customers", customerId);
        batch.update(customerRef, {
          name: values.customerName,
          address: {
            street: "",
            district: "",
            province: "",
            postcode: "",
            fullAddress: values.customerAddress,
          },
          channel: values.channel,
          updatedAt: now,
        });
      }

      // 2. Order with embedded items
      const orderRef = doc(collection(db, "orders"));
      const paymentVerified =
        values.paidAmount >= values.totalAmount && values.totalAmount > 0;

      const transferDateObj = values.transferDate
        ? Timestamp.fromDate(new Date(values.transferDate))
        : null;

      batch.set(orderRef, {
        customerId,
        orderNumber: generateOrderNumber(),
        transferDate: transferDateObj,
        channel: values.channel,
        items: values.items,
        totalAmount: values.totalAmount,
        paidAmount: values.paidAmount,
        remainingAmount: values.remainingAmount,
        discountAmount: 0,
        receiptInfo: values.receiptInfo,
        status: "pending",
        paymentVerified,
        notificationSent: false,
        createdAt: now,
        updatedAt: now,
      });

      await batch.commit();
      router.push(`/mobile/orders/${orderRef.id}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่";
      setError("เกิดข้อผิดพลาด: " + message);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4 max-w-2xl mx-auto">
        <Link
          href="/mobile/orders"
          className="p-2 -ml-2 text-gray-600"
          aria-label="กลับ"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">สร้างออเดอร์ใหม่</h2>
      </div>

      <OrderForm
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        submitLabel="บันทึกออเดอร์"
      />
    </div>
  );
}
