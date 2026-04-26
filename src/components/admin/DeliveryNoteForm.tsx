"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import CustomerPicker from "./CustomerPicker";
import { createDeliveryNote } from "@/lib/delivery-notes";
import { buildCustomerSnapshot } from "@/lib/customers";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer, DeliveryNote, Address } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const emptyAddress: Address = {
  street: "", district: "", province: "", postcode: "", fullAddress: "",
};

interface DNItem {
  productName: string;
  description?: string;
  quantity: number;
  unit?: string;
}

export default function DeliveryNoteForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DNItem[]>([
    { productName: "", quantity: 1, unit: "ตัว" },
  ]);
  const [deliveryDate, setDeliveryDate] = useState(today());
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [useCustomAddr, setUseCustomAddr] = useState(false);
  const [customAddr, setCustomAddr] = useState<Address>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function updateItem(i: number, patch: Partial<DNItem>) {
    setItems((arr) => {
      const next = [...arr];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  async function handleSave() {
    setErr(null);
    if (!user) return;
    if (!customer) return setErr("กรุณาเลือกลูกค้า");
    const cleanItems = items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (cleanItems.length === 0) return setErr("กรุณาเพิ่มอย่างน้อย 1 รายการ");

    setSaving(true);
    try {
      const data: Omit<DeliveryNote, "id" | "number" | "createdAt" | "updatedAt"> = {
        customerId: customer.id,
        customerSnapshot: buildCustomerSnapshot(customer),
        items: cleanItems,
        deliveryDate: new Date(deliveryDate),
        deliveryAddress: useCustomAddr ? customAddr : (customer.defaultBillingAddress ?? customer.address),
        carrier: carrier || undefined,
        trackingNo: trackingNo || undefined,
        receivedBy: receivedBy || undefined,
        notes: notes || undefined,
        status: "draft",
        createdBy: user.uid,
      };
      const { id } = await createDeliveryNote(data);
      router.push(`/admin/delivery-notes/${id}`);
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">สร้างใบส่งของ</h2>

      {err && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <Section title="ลูกค้า / ผู้รับ">
        <CustomerPicker value={customer} onChange={setCustomer} />
        {customer && (
          <label className="text-sm flex items-center gap-2 mt-2">
            <input type="checkbox" checked={useCustomAddr} onChange={(e) => setUseCustomAddr(e.target.checked)} />
            ใช้ที่อยู่จัดส่งอื่น (ไม่ใช่ที่อยู่ลูกค้า)
          </label>
        )}
        {useCustomAddr && (
          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2 mt-2">
            <legend className="text-xs text-gray-700 px-1">ที่อยู่จัดส่ง</legend>
            <input className={inputCls} placeholder="ที่อยู่เต็ม" value={customAddr.fullAddress}
              onChange={(e) => setCustomAddr({ ...customAddr, fullAddress: e.target.value })} />
          </fieldset>
        )}
      </Section>

      <Section title="รายการสินค้า">
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className={inputCls + " col-span-6"}
                placeholder="ชื่อสินค้า"
                value={it.productName}
                onChange={(e) => updateItem(i, { productName: e.target.value })}
              />
              <input
                type="number"
                className={inputCls + " col-span-2 text-right"}
                value={it.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
              />
              <input
                className={inputCls + " col-span-3"}
                placeholder="หน่วย"
                value={it.unit ?? ""}
                onChange={(e) => updateItem(i, { unit: e.target.value })}
              />
              <button
                onClick={() => setItems((a) => a.filter((_, j) => j !== i))}
                className="col-span-1 text-red-500 hover:text-red-700"
                aria-label="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((a) => [...a, { productName: "", quantity: 1, unit: "ตัว" }])}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการ
          </button>
        </div>
      </Section>

      <Section title="การจัดส่ง">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="วันที่ส่ง">
            <input type="date" className={inputCls} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </Field>
          <Field label="ผู้รับ (ถ้ารู้ก่อน)">
            <input className={inputCls} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
          </Field>
          <Field label="ขนส่ง">
            <input className={inputCls} placeholder="Flash, Kerry, J&T..." value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </Field>
          <Field label="เลข Tracking">
            <input className={inputCls} value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} />
          </Field>
        </div>
        <Field label="หมายเหตุ">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Section>

      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกและออกเลข
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
