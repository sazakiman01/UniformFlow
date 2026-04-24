"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft } from "lucide-react";
import OrderForm, {
  OrderFormValues,
} from "@/components/mobile/OrderForm";
import { OrderItem } from "@/types";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [initial, setInitial] = useState<Partial<OrderFormValues> | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      try {
        const orderSnap = await getDoc(doc(db, "orders", id));
        if (!orderSnap.exists()) {
          setLoadError("ไม่พบออเดอร์");
          setLoading(false);
          return;
        }
        const o = orderSnap.data();

        let customerName = "";
        let customerPhone = "";
        let customerAddress = "";
        if (o.customerId) {
          const cSnap = await getDoc(doc(db, "customers", o.customerId));
          if (cSnap.exists()) {
            const c = cSnap.data();
            customerName = c.name ?? "";
            customerPhone = c.phone ?? "";
            customerAddress = c.address?.fullAddress ?? "";
          }
        }

        const transferDate = (o.transferDate as Timestamp)?.toDate?.();
        const dateStr = transferDate
          ? transferDate.toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        setInitial({
          transferDate: dateStr,
          channel: o.channel ?? "L",
          customerId: o.customerId,
          customerPhone,
          customerName,
          customerAddress,
          items: (o.items as OrderItem[]) ?? [],
          paidAmount: o.paidAmount ?? 0,
          receiptInfo: o.receiptInfo ?? {
            name: "",
            address: "",
            phone: "",
          },
        });
      } catch (err) {
        console.error(err);
        setLoadError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (
    values: OrderFormValues & { totalAmount: number; remainingAmount: number }
  ) => {
    setError("");
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      // Update customer (reuse if exists, otherwise create)
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
        const customerRef = doc(db, "customers", customerId);
        batch.update(customerRef, {
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
          updatedAt: now,
        });
      }

      const paymentVerified =
        values.paidAmount >= values.totalAmount && values.totalAmount > 0;
      const transferDateObj = values.transferDate
        ? Timestamp.fromDate(new Date(values.transferDate))
        : null;

      const orderRef = doc(db, "orders", id);
      batch.update(orderRef, {
        customerId,
        transferDate: transferDateObj,
        channel: values.channel,
        items: values.items,
        totalAmount: values.totalAmount,
        paidAmount: values.paidAmount,
        remainingAmount: values.remainingAmount,
        receiptInfo: values.receiptInfo,
        paymentVerified,
        updatedAt: now,
      });

      await batch.commit();
      router.push(`/mobile/orders/${id}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่";
      setError("เกิดข้อผิดพลาด: " + message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loadError || !initial) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {loadError || "ไม่พบข้อมูล"}
        </div>
        <Link href={`/mobile/orders/${id}`} className="text-blue-600">
          ← กลับ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4 max-w-2xl mx-auto">
        <Link
          href={`/mobile/orders/${id}`}
          className="p-2 -ml-2 text-gray-600"
          aria-label="กลับ"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">แก้ไขออเดอร์</h2>
      </div>

      <OrderForm
        initial={initial}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}
