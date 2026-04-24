"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrderItem, ReceiptInfo } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, CheckCircle2, Copy } from "lucide-react";

export type Channel = "L" | "F" | "OTHER";

export interface OrderFormValues {
  // payment
  transferDate: string; // yyyy-mm-dd
  channel: Channel;

  // customer
  customerId?: string; // filled if dedup matched
  customerPhone: string;
  customerName: string;
  customerAddress: string;

  // items
  items: OrderItem[];

  // summary
  paidAmount: number;

  // receipt
  receiptInfo: ReceiptInfo;
}

export interface OrderFormProps {
  initial?: Partial<OrderFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  error?: string;
  onSubmit: (
    values: OrderFormValues & { totalAmount: number; remainingAmount: number }
  ) => void | Promise<void>;
}

const emptyItem = (): OrderItem => ({
  productName: "",
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
});

const today = () => new Date().toISOString().slice(0, 10);

export default function OrderForm({
  initial,
  submitting = false,
  submitLabel = "บันทึกออเดอร์",
  error,
  onSubmit,
}: OrderFormProps) {
  const [transferDate, setTransferDate] = useState(
    initial?.transferDate ?? today()
  );
  const [channel, setChannel] = useState<Channel>(initial?.channel ?? "L");

  const [customerId, setCustomerId] = useState<string | undefined>(
    initial?.customerId
  );
  const [customerPhone, setCustomerPhone] = useState(
    initial?.customerPhone ?? ""
  );
  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [customerAddress, setCustomerAddress] = useState(
    initial?.customerAddress ?? ""
  );
  const [dedupStatus, setDedupStatus] = useState<
    "idle" | "searching" | "matched" | "new"
  >("idle");

  const [items, setItems] = useState<OrderItem[]>(
    initial?.items && initial.items.length > 0 ? initial.items : [emptyItem()]
  );

  const [paidAmount, setPaidAmount] = useState<number>(
    initial?.paidAmount ?? 0
  );

  const [receipt, setReceipt] = useState<ReceiptInfo>(
    initial?.receiptInfo ?? { name: "", address: "", phone: "" }
  );

  const firstItemInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // focus first item when fresh (new order only)
    if (!initial) {
      firstItemInputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced customer dedup lookup
  useEffect(() => {
    const phone = customerPhone.trim();
    if (!phone || phone.length < 6) {
      setDedupStatus("idle");
      return;
    }
    // Skip lookup if editing and phone matches initial (already known customer)
    if (initial?.customerId && initial.customerPhone === phone) {
      setDedupStatus("matched");
      return;
    }
    setDedupStatus("searching");
    const handle = setTimeout(async () => {
      try {
        const q = query(
          collection(db, "customers"),
          where("phone", "==", phone),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as {
            name?: string;
            address?: { fullAddress?: string };
          };
          setCustomerId(doc.id);
          setDedupStatus("matched");
          // Auto-fill only if fields are empty (don't overwrite edits)
          setCustomerName((prev) => prev || data.name || "");
          setCustomerAddress(
            (prev) => prev || data.address?.fullAddress || ""
          );
        } else {
          setCustomerId(undefined);
          setDedupStatus("new");
        }
      } catch (e) {
        console.error("Dedup lookup failed:", e);
        setDedupStatus("idle");
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [customerPhone, initial?.customerId, initial?.customerPhone]);

  // Recalculate item totals
  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, ...patch };
        next.totalPrice = (next.quantity || 0) * (next.unitPrice || 0);
        return next;
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );

  const totalAmount = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
  const remainingAmount = totalAmount - (paidAmount || 0);

  const remainingStyle =
    remainingAmount === 0
      ? "bg-green-50 text-green-700 border-green-200"
      : remainingAmount > 0
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-red-50 text-red-700 border-red-200";

  const remainingLabel =
    remainingAmount === 0
      ? "ชำระครบ"
      : remainingAmount > 0
      ? `ค้างชำระ ${formatCurrency(remainingAmount)}`
      : `ชำระเกิน ${formatCurrency(Math.abs(remainingAmount))}`;

  const copyFromCustomer = () => {
    setReceipt({
      name: customerName,
      address: customerAddress,
      phone: customerPhone,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validation
    if (items.length === 0 || items.every((it) => !it.productName.trim())) {
      alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    const cleanItems = items.filter((it) => it.productName.trim());
    await onSubmit({
      transferDate,
      channel,
      customerId,
      customerPhone: customerPhone.trim(),
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      items: cleanItems,
      paidAmount,
      receiptInfo: {
        name: receipt.name?.trim() || undefined,
        address: receipt.address?.trim() || undefined,
        phone: receipt.phone?.trim() || undefined,
      },
      totalAmount,
      remainingAmount: totalAmount - paidAmount,
    });
  };

  const inputCls =
    "w-full px-3 py-2.5 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const cardCls = "bg-white rounded-xl p-4 shadow-sm space-y-3";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-4 pb-28 md:pb-4"
    >
      {/* Section 1: ข้อมูลการสั่งซื้อ */}
      <div className={cardCls}>
        <h3 className="font-semibold text-gray-900">ข้อมูลการสั่งซื้อ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>วันที่ลูกค้าโอนเงิน *</label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ช่องทางการสั่งซื้อ *</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className={inputCls}
            >
              <option value="L">LINE</option>
              <option value="F">Facebook</option>
              <option value="OTHER">อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: ข้อมูลลูกค้า */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">ข้อมูลลูกค้า</h3>
          {dedupStatus === "matched" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ลูกค้าเดิม
            </span>
          )}
          {dedupStatus === "new" && customerPhone.length >= 6 && (
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              ลูกค้าใหม่
            </span>
          )}
          {dedupStatus === "searching" && (
            <span className="text-xs text-gray-500">กำลังค้นหา...</span>
          )}
        </div>

        <div>
          <label className={labelCls}>เบอร์โทร *</label>
          <input
            type="tel"
            required
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="08X-XXX-XXXX"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>ชื่อลูกค้า *</label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>ที่อยู่ส่งของ</label>
          <textarea
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            rows={2}
            className={inputCls + " min-h-[72px]"}
          />
        </div>
      </div>

      {/* Section 3: รายการสินค้า */}
      <div className={cardCls}>
        <h3 className="font-semibold text-gray-900">รายการสินค้า *</h3>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  รายการที่ {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="p-2 -m-2 text-red-600 disabled:text-gray-300"
                  aria-label="ลบรายการ"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <input
                ref={index === 0 ? firstItemInputRef : undefined}
                type="text"
                value={item.productName}
                onChange={(e) =>
                  updateItem(index, { productName: e.target.value })
                }
                placeholder="ชื่อสินค้า (เช่น ผ้านวม, ค่าส่ง)"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    ราคา/หน่วย
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateItem(index, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-600">รวม</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
        >
          <Plus className="w-5 h-5" />
          เพิ่มรายการ
        </button>
      </div>

      {/* Section 4: สรุปยอด */}
      <div className={cardCls}>
        <h3 className="font-semibold text-gray-900">สรุปยอด</h3>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-700">รวมยอดเงิน</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>
        <div>
          <label className={labelCls}>ยอดที่ลูกค้าชำระ *</label>
          <input
            type="number"
            required
            min={0}
            inputMode="decimal"
            value={paidAmount === 0 ? "" : paidAmount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div
          className={`rounded-lg p-3 border flex items-center justify-between ${remainingStyle}`}
        >
          <span className="text-sm font-medium">ยอดคงเหลือ</span>
          <span className="text-base font-bold">{remainingLabel}</span>
        </div>
      </div>

      {/* Section 5: ข้อมูลใบเสร็จ */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">ข้อมูลใบเสร็จ</h3>
          <button
            type="button"
            onClick={copyFromCustomer}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-2 py-1"
          >
            <Copy className="w-4 h-4" />
            เหมือนข้อมูลลูกค้า
          </button>
        </div>

        <div>
          <label className={labelCls}>ชื่อลูกค้า/บริษัท (ใบเสร็จ)</label>
          <input
            type="text"
            value={receipt.name ?? ""}
            onChange={(e) => setReceipt({ ...receipt, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>ที่อยู่ (ใบเสร็จ)</label>
          <textarea
            value={receipt.address ?? ""}
            onChange={(e) =>
              setReceipt({ ...receipt, address: e.target.value })
            }
            rows={2}
            className={inputCls + " min-h-[72px]"}
          />
        </div>
        <div>
          <label className={labelCls}>เบอร์โทร (ใบเสร็จ)</label>
          <input
            type="tel"
            inputMode="tel"
            value={receipt.phone ?? ""}
            onChange={(e) => setReceipt({ ...receipt, phone: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Sticky submit on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:static md:bg-transparent md:border-0 md:p-0 md:pt-2">
        <div className="max-w-2xl mx-auto">
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[52px] py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
