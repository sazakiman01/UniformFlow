"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, AlertCircle, ReceiptText } from "lucide-react";
import CustomerPicker from "./CustomerPicker";
import { createReceipt } from "@/lib/receipts";
import { getInvoice } from "@/lib/invoices";
import { buildCustomerSnapshot, getCustomer } from "@/lib/customers";
import { formatTHB } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer, PaymentMethod, Invoice } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function ReceiptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const invoiceIdParam = params.get("invoiceId");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [bankRef, setBankRef] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(!!invoiceIdParam);

  useEffect(() => {
    if (!invoiceIdParam) return;
    (async () => {
      const inv = await getInvoice(invoiceIdParam);
      if (inv) {
        setInvoice(inv);
        setDescription(`ชำระตามใบ ${inv.number}`);
        setAmount(inv.amountDue ?? inv.grandTotal - (inv.amountPaid ?? 0));
        const c = await getCustomer(inv.customerId);
        setCustomer(c);
      }
      setLoadingInvoice(false);
    })();
  }, [invoiceIdParam]);

  async function handleSave() {
    setErr(null);
    if (!user) return;
    if (amount <= 0) return setErr("ยอดเงินต้องมากกว่า 0");
    if (!description.trim()) return setErr("กรุณากรอกรายการ");

    setSaving(true);
    try {
      const { id } = await createReceipt({
        issueDate: new Date(issueDate),
        customerId: customer?.id,
        customerSnapshot: customer ? buildCustomerSnapshot(customer) : undefined,
        amount,
        paymentMethod,
        bankRef: bankRef || undefined,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.number,
        description: description.trim(),
        notes: notes.trim() || undefined,
        createdBy: user.uid,
      });
      router.push(`/admin/receipts/${id}`);
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loadingInvoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <ReceiptText className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">ออกใบเสร็จรับเงิน</h2>
      </div>

      {invoice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <strong>อ้างอิงใบกำกับ:</strong> <span className="font-mono">{invoice.number}</span>
          {" · "}ยอดค้าง <strong>{formatTHB(invoice.amountDue ?? invoice.grandTotal - (invoice.amountPaid ?? 0))}</strong> บาท
        </div>
      )}

      {err && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <Section title="ผู้จ่ายเงิน">
        <CustomerPicker value={customer} onChange={setCustomer} />
        {!customer && (
          <p className="text-xs text-gray-500 mt-1">
            ถ้าไม่เลือก จะแสดงเป็น Walk-in customer
          </p>
        )}
      </Section>

      <Section title="รายการและยอด">
        <Field label="รายละเอียด *">
          <input
            className={inputCls}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น ค่ามัดจำเสื้อโปโล"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ยอดรับ *">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className={inputCls + " text-right text-lg font-semibold pr-12"}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">บาท</span>
            </div>
          </Field>
          <Field label="วันที่">
            <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="วิธีรับชำระ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ช่องทาง">
            <select
              className={inputCls}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="transfer">โอนเงิน</option>
              <option value="cash">เงินสด</option>
              <option value="qr">QR / PromptPay</option>
              <option value="cheque">เช็ค</option>
              <option value="credit_card">บัตรเครดิต</option>
              <option value="other">อื่นๆ</option>
            </select>
          </Field>
          <Field label="เลขอ้างอิง / สลิป">
            <input className={inputCls} value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="หมายเหตุ">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Section>

      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ออกใบเสร็จและเลขที่
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500";

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
