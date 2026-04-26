"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, AlertCircle } from "lucide-react";
import CustomerPicker from "./CustomerPicker";
import LineItemsEditor from "./LineItemsEditor";
import DocumentTotalsBox from "./DocumentTotalsBox";
import { computeTotals, normalizeLineItems } from "@/lib/money";
import { getCompanyProfile } from "@/lib/company";
import { buildCustomerSnapshot } from "@/lib/customers";
import { createQuotation, updateQuotation } from "@/lib/quotations";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Customer,
  DocumentLineItem,
  PriceMode,
  Quotation,
  QuotationStatus,
  CompanyProfile,
} from "@/types";

interface Props {
  initial?: Quotation;
  initialCustomer?: Customer | null;
}

const today = () => new Date();
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export default function QuotationForm({ initial, initialCustomer }: Props) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [items, setItems] = useState<DocumentLineItem[]>(
    initial?.items?.length
      ? initial.items
      : [{ productName: "", quantity: 1, unitPrice: 0, total: 0, discount: 0 }],
  );
  const [priceMode, setPriceMode] = useState<PriceMode>(initial?.priceMode ?? "exclusive");
  const [vatRate, setVatRate] = useState<number>(initial?.vatRate ?? 7);
  const [documentDiscount, setDocumentDiscount] = useState<number>(initial?.discountAmount ?? 0);
  const [validUntil, setValidUntil] = useState<string>(
    toDateInput(initial?.validUntil ?? addDays(today(), 30)),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(
    initial?.termsAndConditions ?? "ราคานี้รวม VAT (หรือไม่รวมตามที่ระบุ) ยืนยันราคาภายใน 30 วัน",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanyProfile().then(setCompany).catch(console.error);
  }, []);

  // VAT comes from company default if quotation has no rate yet
  useEffect(() => {
    if (!initial && company) setVatRate(company.vatRegistered ? company.vatRate : 0);
  }, [company, initial]);

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        priceMode,
        vatRate,
        documentDiscount,
      }),
    [items, priceMode, vatRate, documentDiscount],
  );

  async function save(asStatus: QuotationStatus = "draft") {
    setError(null);
    if (!user || !profile) return;
    if (!customer) return setError("กรุณาเลือกลูกค้า");
    const cleanItems = normalizeLineItems(items).filter((it) => it.productName && it.quantity > 0);
    if (cleanItems.length === 0) return setError("กรุณาเพิ่มอย่างน้อย 1 รายการ");
    setSaving(true);
    try {
      const payload = {
        customerId: customer.id,
        customerSnapshot: buildCustomerSnapshot(customer),
        items: cleanItems,
        priceMode,
        subtotal: totals.netBeforeVat,
        discountAmount: documentDiscount,
        vatRate,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
        validUntil: new Date(validUntil),
        notes: notes || undefined,
        termsAndConditions: terms || undefined,
        status: asStatus,
        createdBy: user.uid,
        sentAt: asStatus === "sent" ? new Date() : undefined,
      };
      if (initial) {
        await updateQuotation(initial.id, {
          ...payload,
          updatedBy: user.uid,
          audit: {
            action: asStatus === "sent" ? "send" : "update",
            by: user.uid,
            byName: profile.displayName ?? profile.email,
          },
        });
        router.push(`/dashboard/quotations/${initial.id}`);
      } else {
        const { id } = await createQuotation({
          ...payload,
          audit: {
            action: "create",
            by: user.uid,
            byName: profile.displayName ?? profile.email,
          },
        });
        router.push(`/dashboard/quotations/${id}`);
      }
    } catch (e) {
      console.error(e);
      setError("บันทึกไม่สำเร็จ — ลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("draft");
      }}
      className="p-4 sm:p-6 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {initial ? `แก้ไข ${initial.number}` : "สร้างใบเสนอราคา"}
        </h2>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Section title="ลูกค้า">
        <CustomerPicker value={customer} onChange={setCustomer} />
      </Section>

      <Section title="รายการสินค้า / บริการ">
        <LineItemsEditor items={items} onChange={setItems} />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="เงื่อนไข">
          <Field label="วันยืนราคาถึง">
            <input
              type="date"
              className={inputCls}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </Field>
          <Field label="หมายเหตุ">
            <textarea
              className={inputCls}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เงื่อนไขการชำระ มัดจำ 50% ก่อนผลิต"
            />
          </Field>
          <Field label="เงื่อนไขและข้อตกลง">
            <textarea className={inputCls} rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </Field>
        </Section>

        <Section title="ยอดเงิน">
          <DocumentTotalsBox
            totals={totals}
            vatRate={vatRate}
            priceMode={priceMode}
            documentDiscount={documentDiscount}
            vatRegistered={company?.vatRegistered ?? true}
            onChange={(p) => {
              if (p.vatRate !== undefined) setVatRate(p.vatRate);
              if (p.priceMode !== undefined) setPriceMode(p.priceMode);
              if (p.documentDiscount !== undefined) setDocumentDiscount(p.documentDiscount);
            }}
          />
        </Section>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกร่าง
        </button>
        <button
          type="button"
          onClick={() => save("sent")}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          บันทึกและส่ง
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

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
