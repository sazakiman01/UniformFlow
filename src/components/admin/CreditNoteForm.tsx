"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, FileMinus } from "lucide-react";
import LineItemsEditor from "./LineItemsEditor";
import { computeTotals, normalizeLineItems } from "@/lib/money";
import { getInvoice } from "@/lib/invoices";
import { getCustomer, buildCustomerSnapshot } from "@/lib/customers";
import { createCreditNote } from "@/lib/credit-notes";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice, Customer, CreditNote, DocumentLineItem } from "@/types";

interface Props {
  invoiceId: string;
}

const REASON_OPTIONS: { value: CreditNote["reasonCategory"]; label: string }[] = [
  { value: "return", label: "ลูกค้าคืนสินค้า" },
  { value: "discount", label: "ส่วนลดเพิ่มเติม" },
  { value: "price_correction", label: "แก้ไขราคา (ใบกำกับเดิมผิด)" },
  { value: "cancellation", label: "ยกเลิกการขาย" },
  { value: "other", label: "อื่นๆ" },
];

export default function CreditNoteForm({ invoiceId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DocumentLineItem[]>([]);
  const [reasonCategory, setReasonCategory] = useState<CreditNote["reasonCategory"]>("return");
  const [reason, setReason] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const inv = await getInvoice(invoiceId);
      setInvoice(inv);
      if (inv) {
        // Pre-fill items from invoice — user can adjust quantities to credit
        setItems(inv.items.map((it) => ({ ...it })));
        const c = await getCustomer(inv.customerId);
        setCustomer(c);
      }
      setLoading(false);
    })();
  }, [invoiceId]);

  const totals = useMemo(() => {
    if (!invoice) return null;
    return computeTotals({
      items,
      priceMode: invoice.priceMode,
      vatRate: invoice.vatRate,
      documentDiscount: 0,
    });
  }, [items, invoice]);

  async function handleSave() {
    setErr(null);
    if (!user || !invoice || !customer || !totals) return;
    if (!reason.trim()) return setErr("ต้องระบุเหตุผลในการออกใบลดหนี้ (กฎหมายบังคับ)");
    const cleanItems = normalizeLineItems(items).filter((it) => it.productName && it.quantity > 0);
    if (cleanItems.length === 0) return setErr("กรุณาระบุรายการที่ลด");
    if (totals.grandTotal <= 0) return setErr("ยอดที่ลดต้องมากกว่า 0");
    if (totals.grandTotal > invoice.grandTotal + 0.01)
      return setErr("ยอดที่ลดเกินยอดในใบกำกับเดิม");

    setSaving(true);
    try {
      const data: Omit<CreditNote, "id" | "number" | "createdAt" | "updatedAt"> = {
        originalInvoiceId: invoice.id,
        originalInvoiceNumber: invoice.number,
        customerId: invoice.customerId,
        customerSnapshot: buildCustomerSnapshot(customer),
        reason: reason.trim(),
        reasonCategory,
        items: cleanItems,
        priceMode: invoice.priceMode,
        subtotal: totals.netBeforeVat,
        vatRate: invoice.vatRate,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
        issueDate: new Date(issueDate),
        status: "issued",
        createdBy: user.uid,
      };
      const { id } = await createCreditNote(data);
      router.push(`/admin/credit-notes/${id}`);
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!invoice) return <div className="p-8 text-center text-gray-500">ไม่พบใบกำกับต้นฉบับ</div>;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileMinus className="w-6 h-6 text-amber-600" />
        <h2 className="text-2xl font-bold text-gray-900">ออกใบลดหนี้</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
        <strong>อ้างอิง:</strong> ใบกำกับภาษีเลขที่ <span className="font-mono">{invoice.number}</span>
        ({invoice.customerSnapshot?.name}) ยอดเดิม{" "}
        <strong>{invoice.grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong> บาท
      </div>

      {err && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <Section title="เหตุผล (กฎหมายบังคับ)">
        <Field label="ประเภท">
          <select
            className={inputCls}
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value as CreditNote["reasonCategory"])}
          >
            {REASON_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
        <Field label="รายละเอียด *">
          <textarea
            className={inputCls}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น สินค้าชำรุดจำนวน 2 ตัว ลูกค้าตกลงคืน"
          />
        </Field>
        <Field label="วันที่ออกใบลดหนี้">
          <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </Field>
      </Section>

      <Section title="รายการที่ลด">
        <p className="text-xs text-gray-600 -mt-1">
          ปรับจำนวน/ราคาตามที่ต้องการลด — ลบแถวที่ไม่เกี่ยวข้องออก
        </p>
        <LineItemsEditor items={items} onChange={setItems} />
      </Section>

      {totals && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">ยอดที่ลด</span>
            <span className="text-2xl font-bold text-red-600 tabular-nums">
              −{totals.grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            (รวม VAT {invoice.vatRate}%)
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ออกใบลดหนี้
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
