"use client";

import { useState } from "react";
import { Loader2, Save, X, AlertCircle } from "lucide-react";
import { createExpense, updateExpense, EXPENSE_CATEGORY_OPTIONS } from "@/lib/expenses";
import { isValidThaiTaxId, round2 } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/types";

interface Props {
  initial?: Expense;
  onClose: () => void;
  onSaved: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ initial, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: (initial?.category ?? "other") as ExpenseCategory,
    description: initial?.description ?? "",
    supplier: initial?.supplier ?? "",
    supplierTaxId: initial?.supplierTaxId ?? "",
    amount: initial?.amount ?? 0,
    vatRate: initial?.vatRate ?? 0,
    vatAmount: initial?.vatAmount ?? 0,
    totalAmount: initial?.totalAmount ?? 0,
    isPurchaseTaxClaim: initial?.isPurchaseTaxClaim ?? false,
    isCOGS: initial?.isCOGS ?? false,
    supplierTaxInvoiceNumber: initial?.supplierTaxInvoiceNumber ?? "",
    supplierTaxInvoiceDate: initial?.supplierTaxInvoiceDate
      ? initial.supplierTaxInvoiceDate.toISOString().slice(0, 10)
      : "",
    paidAt: initial?.paidAt ? initial.paidAt.toISOString().slice(0, 10) : today(),
    paymentMethod: (initial?.paymentMethod ?? "transfer") as PaymentMethod,
    bankRef: initial?.bankRef ?? "",
    withholdingTaxRate: initial?.withholdingTaxRate ?? 0,
    withholdingTaxAmount: initial?.withholdingTaxAmount ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const taxIdValid = !form.supplierTaxId || isValidThaiTaxId(form.supplierTaxId);

  // Auto-compute total when amount/vat changes
  function recomputeTotal(amount: number, vatRate: number) {
    const vatAmount = round2((amount * vatRate) / 100);
    setForm((s) => ({ ...s, amount, vatRate, vatAmount, totalAmount: round2(amount + vatAmount) }));
  }

  async function handleSave() {
    setErr(null);
    if (!user) return;
    if (!form.description.trim()) return setErr("กรุณากรอกรายละเอียด");
    if (form.totalAmount <= 0) return setErr("ยอดเงินต้องมากกว่า 0");
    if (form.isPurchaseTaxClaim && !taxIdValid) return setErr("TIN ผู้ขายไม่ถูกต้อง");
    if (form.isPurchaseTaxClaim && !form.supplierTaxId)
      return setErr("เครม VAT ซื้อต้องระบุ TIN ผู้ขาย");
    if (form.isPurchaseTaxClaim && !form.supplierTaxInvoiceNumber)
      return setErr("เครม VAT ซื้อต้องระบุเลขใบกำกับจากผู้ขาย");

    setSaving(true);
    try {
      const data: Omit<Expense, "id" | "number" | "createdAt" | "updatedAt"> = {
        category: form.category,
        description: form.description.trim(),
        supplier: form.supplier.trim() || undefined,
        supplierTaxId: form.supplierTaxId || undefined,
        amount: form.amount,
        vatRate: form.vatRate || undefined,
        vatAmount: form.vatAmount || undefined,
        totalAmount: form.totalAmount,
        isPurchaseTaxClaim: form.isPurchaseTaxClaim,
        isCOGS: form.isCOGS,
        supplierTaxInvoiceNumber: form.supplierTaxInvoiceNumber || undefined,
        supplierTaxInvoiceDate: form.supplierTaxInvoiceDate
          ? new Date(form.supplierTaxInvoiceDate)
          : undefined,
        paidAt: new Date(form.paidAt),
        paymentMethod: form.paymentMethod,
        bankRef: form.bankRef || undefined,
        withholdingTaxRate: form.withholdingTaxRate || undefined,
        withholdingTaxAmount: form.withholdingTaxAmount || undefined,
        createdBy: user.uid,
      };
      if (initial) {
        await updateExpense(initial.id, data);
      } else {
        await createExpense(data);
      }
      onSaved();
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="font-bold">
            {initial ? `แก้ไข ${initial.number}` : "บันทึกค่าใช้จ่าย"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {err && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="หมวด">
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as ExpenseCategory }))}
              >
                {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="วันที่จ่าย">
              <input
                type="date"
                className={inputCls}
                value={form.paidAt}
                onChange={(e) => setForm((s) => ({ ...s, paidAt: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="รายละเอียด *">
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="เช่น ค่าผ้ายืด 50 หลา"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="ยอดก่อน VAT *">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.amount}
                onChange={(e) => recomputeTotal(Number(e.target.value) || 0, form.vatRate)}
              />
            </Field>
            <Field label="VAT %">
              <select
                className={inputCls}
                value={form.vatRate}
                onChange={(e) => recomputeTotal(form.amount, Number(e.target.value))}
              >
                <option value={0}>0% (ไม่มี)</option>
                <option value={7}>7%</option>
              </select>
            </Field>
            <Field label="รวมทั้งสิ้น">
              <input
                type="number"
                step="0.01"
                className={inputCls + " font-bold"}
                value={form.totalAmount}
                onChange={(e) => setForm((s) => ({ ...s, totalAmount: Number(e.target.value) || 0 }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="วิธีจ่าย">
              <select
                className={inputCls}
                value={form.paymentMethod}
                onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value as PaymentMethod }))}
              >
                <option value="transfer">โอน</option>
                <option value="cash">เงินสด</option>
                <option value="qr">QR</option>
                <option value="cheque">เช็ค</option>
                <option value="credit_card">บัตรเครดิต</option>
                <option value="other">อื่นๆ</option>
              </select>
            </Field>
            <Field label="เลขอ้างอิง / สลิป">
              <input
                className={inputCls}
                value={form.bankRef}
                onChange={(e) => setForm((s) => ({ ...s, bankRef: e.target.value }))}
              />
            </Field>
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2">
            <legend className="text-xs font-medium text-gray-700 px-1">ผู้ขาย / ใบกำกับซื้อ</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="ชื่อผู้ขาย"
                value={form.supplier}
                onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))}
              />
              <input
                className={inputCls + (form.supplierTaxId && !taxIdValid ? " border-red-400" : "")}
                placeholder="TIN ผู้ขาย (13 หลัก)"
                value={form.supplierTaxId}
                inputMode="numeric"
                maxLength={13}
                onChange={(e) =>
                  setForm((s) => ({ ...s, supplierTaxId: e.target.value.replace(/\D/g, "") }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="เลขที่ใบกำกับ"
                value={form.supplierTaxInvoiceNumber}
                onChange={(e) => setForm((s) => ({ ...s, supplierTaxInvoiceNumber: e.target.value }))}
              />
              <input
                type="date"
                className={inputCls}
                value={form.supplierTaxInvoiceDate}
                onChange={(e) => setForm((s) => ({ ...s, supplierTaxInvoiceDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPurchaseTaxClaim}
                  onChange={(e) => setForm((s) => ({ ...s, isPurchaseTaxClaim: e.target.checked }))}
                />
                เครม VAT ซื้อ (ภพ.30)
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isCOGS}
                  onChange={(e) => setForm((s) => ({ ...s, isCOGS: e.target.checked }))}
                />
                นับเป็นต้นทุนสินค้า (COGS)
              </label>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2">
            <legend className="text-xs font-medium text-gray-700 px-1">หัก ณ ที่จ่าย (ถ้าเราหัก supplier)</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                className={inputCls}
                value={form.withholdingTaxRate}
                onChange={(e) => setForm((s) => ({ ...s, withholdingTaxRate: Number(e.target.value) }))}
              >
                <option value={0}>ไม่หัก</option>
                <option value={1}>1%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
                <option value={5}>5%</option>
              </select>
              <input
                type="number"
                step="0.01"
                className={inputCls}
                placeholder="ยอดหัก"
                value={form.withholdingTaxAmount}
                onChange={(e) =>
                  setForm((s) => ({ ...s, withholdingTaxAmount: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </fieldset>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
