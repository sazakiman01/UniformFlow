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
import { createInvoice, updateInvoice } from "@/lib/invoices";
import { generatePromptPayPayload } from "@/lib/promptpay";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Customer,
  DocumentLineItem,
  PriceMode,
  Invoice,
  InvoiceStatus,
  InvoiceType,
  CompanyProfile,
} from "@/types";

interface Props {
  initial?: Invoice;
  initialCustomer?: Customer | null;
  /** Pre-fill from quotation conversion */
  fromQuotation?: { quotationId: string; data: Partial<Invoice> };
}

const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  invoice: "ใบแจ้งหนี้",
  tax_invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  tax_invoice_receipt: "ใบกำกับภาษี/ใบเสร็จรับเงิน",
};

const today = () => new Date();
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export default function InvoiceForm({ initial, initialCustomer, fromQuotation }: Props) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const seedItems =
    initial?.items ?? (fromQuotation?.data.items as DocumentLineItem[] | undefined);
  const [items, setItems] = useState<DocumentLineItem[]>(
    seedItems?.length
      ? seedItems
      : [{ productName: "", quantity: 1, unitPrice: 0, total: 0, discount: 0 }],
  );
  const [type, setType] = useState<InvoiceType>(initial?.type ?? "tax_invoice_receipt");
  const [priceMode, setPriceMode] = useState<PriceMode>(initial?.priceMode ?? "exclusive");
  const [vatRate, setVatRate] = useState<number>(initial?.vatRate ?? 7);
  const [whtRate, setWhtRate] = useState<number>(initial?.withholdingTaxRate ?? 0);
  const [documentDiscount, setDocumentDiscount] = useState<number>(initial?.discountAmount ?? 0);
  const [issueDate, setIssueDate] = useState<string>(toDateInput(initial?.issueDate ?? today()));
  const [dueDate, setDueDate] = useState<string>(
    toDateInput(initial?.dueDate ?? addDays(today(), 0)),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(initial?.internalNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanyProfile().then(setCompany).catch(console.error);
  }, []);

  // Default vat from company on first mount
  useEffect(() => {
    if (!initial && company) setVatRate(company.vatRegistered ? company.vatRate : 0);
  }, [company, initial]);

  // Default credit term from customer
  useEffect(() => {
    if (!initial && customer && customer.creditTerm !== undefined) {
      setDueDate(toDateInput(addDays(new Date(issueDate), customer.creditTerm)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        priceMode,
        vatRate,
        documentDiscount,
        whtRate,
      }),
    [items, priceMode, vatRate, documentDiscount, whtRate],
  );

  const qrPayload = useMemo(() => {
    if (!company?.promptPayId) return undefined;
    if (totals.amountDue <= 0) return undefined;
    try {
      return generatePromptPayPayload({
        promptPayId: company.promptPayId,
        amount: totals.amountDue,
      });
    } catch (e) {
      console.error("PromptPay QR error:", e);
      return undefined;
    }
  }, [company?.promptPayId, totals.amountDue]);

  async function save(asStatus: InvoiceStatus = "draft") {
    setError(null);
    if (!user || !profile) return;
    if (!customer) return setError("กรุณาเลือกลูกค้า");
    if (
      (type === "tax_invoice" || type === "tax_invoice_receipt") &&
      !customer.taxId &&
      customer.customerType === "corporate"
    ) {
      return setError("ลูกค้านิติบุคคลต้องระบุ TIN ก่อนออกใบกำกับภาษี");
    }
    const cleanItems = normalizeLineItems(items).filter((it) => it.productName && it.quantity > 0);
    if (cleanItems.length === 0) return setError("กรุณาเพิ่มอย่างน้อย 1 รายการ");

    setSaving(true);
    try {
      const payload = {
        type,
        customerId: customer.id,
        customerSnapshot: buildCustomerSnapshot(customer),
        quotationId: initial?.quotationId ?? fromQuotation?.quotationId,
        orderId: initial?.orderId,
        items: cleanItems,
        priceMode,
        subtotal: totals.subtotal - totals.lineDiscounts,
        discountAmount: documentDiscount,
        netAmount: totals.netBeforeVat,
        vatRate,
        vatAmount: totals.vatAmount,
        withholdingTaxRate: whtRate || undefined,
        withholdingTaxAmount: whtRate ? totals.whtAmount : undefined,
        grandTotal: totals.grandTotal,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: asStatus,
        qrCodeData: qrPayload,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
        sentAt: asStatus === "sent" ? new Date() : undefined,
        createdBy: user.uid,
      };

      if (initial) {
        await updateInvoice(initial.id, {
          ...payload,
          updatedBy: user.uid,
          audit: {
            action: asStatus === "sent" ? "send" : "update",
            by: user.uid,
            byName: profile.displayName ?? profile.email,
          },
        });
        router.push(`/dashboard/invoices/${initial.id}`);
      } else {
        const { id } = await createInvoice({
          ...payload,
          audit: {
            action: "create",
            by: user.uid,
            byName: profile.displayName ?? profile.email,
          },
        });
        router.push(`/dashboard/invoices/${id}`);
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
          {initial ? `แก้ไข ${initial.number}` : "ออกเอกสาร"}
        </h2>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Section title="ประเภทเอกสาร">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INVOICE_TYPE_LABEL) as InvoiceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              disabled={!!initial}
              className={
                "px-3 py-2 text-sm rounded-lg border " +
                (type === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50") +
                (initial ? " opacity-50 cursor-not-allowed" : "")
              }
            >
              {INVOICE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {(type === "tax_invoice" || type === "tax_invoice_receipt") && !company?.vatRegistered && (
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            ⚠️ บริษัทยังไม่ได้จด VAT ในการตั้งค่า — ออกใบกำกับภาษีอาจผิดกฎหมาย
          </p>
        )}
      </Section>

      <Section title="ลูกค้า">
        <CustomerPicker value={customer} onChange={setCustomer} />
      </Section>

      <Section title="รายการสินค้า / บริการ">
        <LineItemsEditor items={items} onChange={setItems} />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="วันที่และหมายเหตุ">
          <div className="grid grid-cols-2 gap-3">
            <Field label="วันที่ออก">
              <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label="วันครบกำหนดชำระ">
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <Field label="หมายเหตุ (แสดงในเอกสาร)">
            <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label="หมายเหตุภายใน (ไม่แสดง)">
            <textarea className={inputCls} rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </Field>
        </Section>

        <Section title="ยอดเงิน">
          <DocumentTotalsBox
            totals={totals}
            vatRate={vatRate}
            priceMode={priceMode}
            documentDiscount={documentDiscount}
            whtRate={whtRate}
            showWHT
            vatRegistered={company?.vatRegistered ?? true}
            onChange={(p) => {
              if (p.vatRate !== undefined) setVatRate(p.vatRate);
              if (p.priceMode !== undefined) setPriceMode(p.priceMode);
              if (p.documentDiscount !== undefined) setDocumentDiscount(p.documentDiscount);
              if (p.whtRate !== undefined) setWhtRate(p.whtRate);
            }}
          />
          {qrPayload && (
            <p className="text-xs text-green-700 mt-2 px-1">
              ✓ จะแนบ QR PromptPay ในใบกำกับภาษี (ยอด {totals.amountDue.toFixed(2)} บาท)
            </p>
          )}
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
          ออกเลขและส่ง
        </button>
      </div>
    </form>
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
