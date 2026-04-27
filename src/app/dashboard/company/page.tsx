"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCompanyProfile, saveCompanyProfile, DEFAULT_COMPANY_PROFILE } from "@/lib/company";
import { isValidThaiTaxId } from "@/lib/money";
import type { CompanyProfile, BankAccount } from "@/types";

type FormState = Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">;

export default function CompanyProfilePage() {
  const { canManageCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_COMPANY_PROFILE);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getCompanyProfile();
        if (profile) {
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = profile;
          setForm({ ...DEFAULT_COMPANY_PROFILE, ...rest });
        }
      } catch (e) {
        console.error(e);
        setError("โหลดข้อมูลบริษัทไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const updateAddress = (key: keyof FormState["address"], value: string) =>
    setForm((s) => ({ ...s, address: { ...s.address, [key]: value } }));

  const taxIdValid = !form.taxId || isValidThaiTaxId(form.taxId);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("กรุณากรอกชื่อกิจการ");
    if (!form.taxId.trim()) return setError("กรุณากรอกเลขประจำตัวผู้เสียภาษี");
    if (!isValidThaiTaxId(form.taxId)) return setError("เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง (13 หลัก + checksum)");
    if (form.branchCode.length !== 5) return setError("รหัสสาขาต้องเป็น 5 หลัก (00000 = สำนักงานใหญ่)");
    setSaving(true);
    try {
      await saveCompanyProfile(form);
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
      setError("บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!canManageCompany) {
    return (
      <div className="p-6 text-center text-gray-500">
        เฉพาะเจ้าของกิจการเท่านั้นที่แก้ไขข้อมูลบริษัทได้
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">ข้อมูลบริษัท</h2>
      </div>
      <p className="text-sm text-gray-600 -mt-4">
        ข้อมูลนี้จะแสดงบนเอกสารทุกฉบับ (ใบเสนอราคา / ใบกำกับภาษี / ใบเสร็จ)
      </p>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {savedAt && !error && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>บันทึกแล้วเมื่อ {savedAt.toLocaleTimeString("th-TH")}</span>
        </div>
      )}

      {/* ข้อมูลบริษัท */}
      <Section title="ชื่อกิจการ / ภาษี">
        <Field label="ชื่อกิจการ *" required>
          <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="เช่น ห้างหุ้นส่วนจำกัด ยูนิฟอร์มเมคเกอร์" />
        </Field>
        <Field label="ชื่อจดทะเบียน (legal name)">
          <input className={inputCls} value={form.legalName ?? ""} onChange={(e) => update("legalName", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="เลขประจำตัวผู้เสียภาษี (13 หลัก) *" required hint={!taxIdValid && form.taxId ? "ไม่ถูกต้อง" : undefined}>
            <input
              className={inputCls + (form.taxId && !taxIdValid ? " border-red-400" : "")}
              value={form.taxId}
              maxLength={13}
              inputMode="numeric"
              onChange={(e) => update("taxId", e.target.value.replace(/\D/g, ""))}
              placeholder="0000000000000"
            />
          </Field>
          <Field label="รหัสสาขา *" hint="00000 = สำนักงานใหญ่">
            <input className={inputCls} value={form.branchCode} maxLength={5} inputMode="numeric"
              onChange={(e) => update("branchCode", e.target.value.replace(/\D/g, "").padEnd(5, "0").slice(0, 5))}
            />
          </Field>
          <Field label="จด VAT?">
            <select
              className={inputCls}
              value={form.vatRegistered ? "yes" : "no"}
              onChange={(e) => update("vatRegistered", e.target.value === "yes")}
            >
              <option value="yes">จดแล้ว (ออกใบกำกับภาษีได้)</option>
              <option value="no">ไม่จด</option>
            </select>
          </Field>
        </div>
        {form.vatRegistered && (
          <Field label="อัตรา VAT (%)">
            <input
              type="number"
              className={inputCls}
              value={form.vatRate}
              onChange={(e) => update("vatRate", Number(e.target.value) || 0)}
              min={0}
              max={20}
            />
          </Field>
        )}
      </Section>

      <Section title="ที่อยู่จดทะเบียน">
        <Field label="เลขที่ / ถนน">
          <input className={inputCls} value={form.address.street} onChange={(e) => updateAddress("street", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="แขวง/ตำบล">
            <input className={inputCls} value={form.address.district} onChange={(e) => updateAddress("district", e.target.value)} />
          </Field>
          <Field label="เขต/อำเภอ">
            <input className={inputCls} value={form.address.subdistrict} onChange={(e) => updateAddress("subdistrict", e.target.value)} />
          </Field>
          <Field label="จังหวัด">
            <input className={inputCls} value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="รหัสไปรษณีย์">
            <input className={inputCls} value={form.address.postcode} maxLength={5} inputMode="numeric"
              onChange={(e) => updateAddress("postcode", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </div>
        <Field label="ที่อยู่เต็มสำหรับเอกสาร" hint="ถ้าเว้นว่าง ระบบจะรวมจากด้านบน">
          <textarea className={inputCls} rows={2} value={form.address.fullAddress}
            onChange={(e) => updateAddress("fullAddress", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="ติดต่อ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="เบอร์โทร">
            <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="อีเมล">
            <input className={inputCls} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
        </div>
        <Field label="เว็บไซต์">
          <input className={inputCls} value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} />
        </Field>
      </Section>

      <Section title="PromptPay (สำหรับใส่ใน QR ใบกำกับภาษี)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ประเภท">
            <select
              className={inputCls}
              value={form.promptPayType ?? "tax_id"}
              onChange={(e) => update("promptPayType", e.target.value as "phone" | "tax_id")}
            >
              <option value="tax_id">เลขประจำตัวผู้เสียภาษี (13 หลัก)</option>
              <option value="phone">เบอร์โทร (10 หลัก)</option>
            </select>
          </Field>
          <Field label="เลข PromptPay" hint="ปล่อยว่างได้ถ้าไม่ใช้ QR">
            <input className={inputCls} value={form.promptPayId ?? ""} inputMode="numeric"
              onChange={(e) => update("promptPayId", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </div>
      </Section>

      <Section title="บัญชีธนาคาร" hint="ปรากฏบนใบกำกับภาษี/ใบแจ้งหนี้">
        <BankAccountsEditor value={form.bankAccounts ?? []} onChange={(b) => update("bankAccounts", b)} />
      </Section>

      <Section title="การออกเลขเอกสาร">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="โหมดการออกเลข">
            <select
              className={inputCls}
              value={form.documentNumberingMode ?? "monthly"}
              onChange={(e) => update("documentNumberingMode", e.target.value as "monthly" | "yearly")}
            >
              <option value="monthly">รายเดือน (INV-2026-04-0001) — แนะนำ</option>
              <option value="yearly">รายปี (INV-2026-00001)</option>
            </select>
          </Field>
          <Field label="เครดิตเทอม default (วัน)">
            <input type="number" className={inputCls} value={form.defaultCreditTerm}
              onChange={(e) => update("defaultCreditTerm", Number(e.target.value) || 0)}
              min={0}
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white";

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-gray-500 mt-0.5 block">{hint}</span>}
    </label>
  );
}

function BankAccountsEditor({ value, onChange }: { value: BankAccount[]; onChange: (b: BankAccount[]) => void }) {
  const update = (idx: number, patch: Partial<BankAccount>) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    if (patch.isDefault) next.forEach((a, i) => { if (i !== idx) a.isDefault = false; });
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, { bankName: "", accountName: "", accountNumber: "", isDefault: value.length === 0 }]);
  return (
    <div className="space-y-3">
      {value.map((b, i) => (
        <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className={inputCls} placeholder="ธนาคาร" value={b.bankName} onChange={(e) => update(i, { bankName: e.target.value })} />
            <input className={inputCls} placeholder="ชื่อบัญชี" value={b.accountName} onChange={(e) => update(i, { accountName: e.target.value })} />
            <input className={inputCls} placeholder="เลขบัญชี" value={b.accountNumber} onChange={(e) => update(i, { accountNumber: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 inline-flex items-center gap-1.5">
              <input type="checkbox" checked={b.isDefault ?? false} onChange={(e) => update(i, { isDefault: e.target.checked })} />
              เป็นบัญชีหลัก
            </label>
            <button type="button" onClick={() => remove(i)} className="text-sm text-red-600 hover:underline">ลบ</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-blue-600 hover:underline">+ เพิ่มบัญชีธนาคาร</button>
    </div>
  );
}
