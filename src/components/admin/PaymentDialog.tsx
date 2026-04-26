"use client";

import { useState } from "react";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { recordPayment } from "@/lib/invoices";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice, PaymentMethod } from "@/types";

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onRecorded: () => void;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  transfer: "โอนเงิน",
  cash: "เงินสด",
  qr: "QR / PromptPay",
  cheque: "เช็ค",
  credit_card: "บัตรเครดิต",
  other: "อื่นๆ",
};

export default function PaymentDialog({ invoice, onClose, onRecorded }: Props) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<number>(invoice.amountDue);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bankRef, setBankRef] = useState("");
  const [whtAmount, setWhtAmount] = useState<number>(0);
  const [whtRate, setWhtRate] = useState<number>(invoice.withholdingTaxRate ?? 0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setErr(null);
    if (!user || !profile) return;
    if (amount <= 0) return setErr("ยอดต้องมากกว่า 0");
    if (amount > invoice.amountDue + 0.01) return setErr("ยอดเกินยอดค้างชำระ");
    setSaving(true);
    try {
      await recordPayment({
        invoiceId: invoice.id,
        amount,
        method,
        paidAt: new Date(paidAt),
        bankRef: bankRef || undefined,
        withholdingTaxAmount: whtAmount || undefined,
        withholdingTaxRate: whtRate || undefined,
        notes: notes || undefined,
        createdBy: user.uid,
        createdByName: profile.displayName ?? profile.email,
      });
      onRecorded();
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="font-bold">บันทึกการชำระเงิน</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {err && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{err}</div>
          )}
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
            ใบกำกับเลขที่ <span className="font-mono font-medium">{invoice.number}</span>
            <br />
            ค้างชำระ: <span className="font-medium">{invoice.amountDue.toFixed(2)}</span> บาท
          </div>

          <Field label="ยอดที่ชำระ *">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </Field>

          <Field label="วันที่ชำระ">
            <input type="date" className={inputCls} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </Field>

          <Field label="วิธีชำระ">
            <select
              className={inputCls}
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="เลขอ้างอิง / สลิป">
            <input className={inputCls} value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="หัก ณ ที่จ่าย (%)">
              <select
                className={inputCls}
                value={whtRate}
                onChange={(e) => setWhtRate(Number(e.target.value))}
              >
                <option value={0}>0%</option>
                <option value={1}>1%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
                <option value={5}>5%</option>
              </select>
            </Field>
            <Field label="ยอดหัก">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={whtAmount}
                onChange={(e) => setWhtAmount(Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <Field label="หมายเหตุ">
            <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
