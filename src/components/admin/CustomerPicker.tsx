"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, X, CheckCircle2, Globe, Loader2, AlertCircle, SearchX } from "lucide-react";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
} from "@/lib/customers";
import { isValidThaiTaxId } from "@/lib/money";
import { searchDBDCompany, mapDBDCompanyToUniformFlow, type DBDCompany } from "@/lib/dbd";
import type { Customer, CustomerType, Address } from "@/types";

interface Props {
  value: Customer | null;
  onChange: (c: Customer | null) => void;
}

const emptyAddress: Address = {
  street: "",
  district: "",
  subdistrict: "",
  province: "",
  postcode: "",
  fullAddress: "",
};

export default function CustomerPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search debounce
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const items = await listCustomers({ search, max: 20 });
      setResults(items);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">{value.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {value.customerType === "corporate" ? "นิติบุคคล" : "บุคคลธรรมดา"}
              </span>
              {value.taxId && (
                <span className="text-xs text-gray-600">TIN: {value.taxId}</span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {value.phone}
              {value.email ? ` · ${value.email}` : ""}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {value.address.fullAddress ||
                [value.address.street, value.address.district, value.address.subdistrict, value.address.province, value.address.postcode]
                  .filter(Boolean)
                  .join(" ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              แก้ไข
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="เปลี่ยนลูกค้า"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {editing && (
          <CustomerEditModal
            customer={value}
            onClose={() => setEditing(false)}
            onSaved={(c) => {
              onChange(c);
              setEditing(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="ค้นหาลูกค้า — ชื่อ / เบอร์ / TIN"
          value={search}
          onFocus={() => setShow(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setShow(true);
          }}
        />
      </div>
      {show && (search || results.length > 0) && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.length === 0 && search.length >= 2 && (
            <div className="p-3 text-sm text-gray-500">ไม่พบ — กดเพิ่มลูกค้าใหม่</div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c);
                setShow(false);
                setSearch("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0"
            >
              <div className="font-medium text-gray-900">{c.name}</div>
              <div className="text-xs text-gray-500">
                {c.phone}
                {c.taxId ? ` · TIN ${c.taxId}` : ""}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setShow(false);
            }}
            className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1.5 border-t border-gray-200"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มลูกค้าใหม่
          </button>
        </div>
      )}
      {editing && (
        <CustomerEditModal
          customer={null}
          initialName={search}
          onClose={() => setEditing(false)}
          onSaved={(c) => {
            onChange(c);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  customer: Customer | null;
  initialName?: string;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}

function CustomerEditModal({ customer, initialName, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState({
    name: customer?.name ?? initialName ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    customerType: (customer?.customerType ?? "individual") as CustomerType,
    taxId: customer?.taxId ?? "",
    branchCode: customer?.branchCode ?? "00000",
    creditTerm: customer?.creditTerm ?? 0,
    channel: customer?.channel ?? ("OTHER" as Customer["channel"]),
    address: customer?.address ?? emptyAddress,
    notes: customer?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dbdSearch, setDbdSearch] = useState("");
  const [dbdResults, setDbdResults] = useState<DBDCompany[]>([]);
  const [showDbdResults, setShowDbdResults] = useState(false);
  const [dbdLoading, setDbdLoading] = useState(false);
  const [dbdError, setDbdError] = useState<string | null>(null);
  const dbdWrapperRef = useRef<HTMLDivElement>(null);

  const taxValid = !form.taxId || isValidThaiTaxId(form.taxId);

  // DBD search debounce
  useEffect(() => {
    if (!dbdSearch || dbdSearch.length < 3 || form.customerType !== "corporate") {
      setDbdResults([]);
      setShowDbdResults(false);
      setDbdError(null);
      return;
    }
    setDbdLoading(true);
    setDbdError(null);
    const t = setTimeout(async () => {
      try {
        const results = await searchDBDCompany(dbdSearch, 5);
        setDbdResults(results);
        setShowDbdResults(results.length > 0);
        setDbdError(null);
      } catch {
        setDbdError("ไม่สามารถค้นหาข้อมูลจาก DBD ได้");
        setShowDbdResults(false);
      } finally {
        setDbdLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [dbdSearch, form.customerType]);

  // Close DBD dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dbdWrapperRef.current && !dbdWrapperRef.current.contains(e.target as Node)) {
        setShowDbdResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelectDBDResult(dbdCompany: DBDCompany) {
    const mapped = mapDBDCompanyToUniformFlow(dbdCompany);
    setForm((s) => ({
      ...s,
      name: mapped.name,
      taxId: mapped.taxId,
      address: {
        ...s.address,
        ...mapped.address,
      },
    }));
    setDbdSearch("");
    setDbdResults([]);
    setShowDbdResults(false);
  }

  async function handleSave() {
    setErr(null);
    if (!form.name.trim()) return setErr("กรุณากรอกชื่อลูกค้า");
    if (form.customerType === "corporate" && !form.taxId) return setErr("ลูกค้านิติบุคคลต้องระบุ TIN");
    if (form.taxId && !taxValid) return setErr("TIN ไม่ถูกต้อง (13 หลัก + checksum)");
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        customerType: form.customerType,
        taxId: form.taxId || undefined,
        branchCode: form.branchCode || "00000",
        creditTerm: form.creditTerm,
        channel: form.channel,
        address: form.address,
        notes: form.notes || undefined,
      };
      if (customer) {
        await updateCustomer(customer.id, data);
        onSaved({ ...customer, ...data, updatedAt: new Date() });
      } else {
        const id = await createCustomer({ ...data, address: form.address });
        onSaved({
          id,
          ...data,
          address: form.address,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Customer);
      }
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="font-bold">{customer ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {err && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{err}</div>
          )}
          <Field label="ประเภท">
            <select
              className={inputCls}
              value={form.customerType}
              onChange={(e) => setForm((s) => ({ ...s, customerType: e.target.value as CustomerType }))}
            >
              <option value="individual">บุคคลธรรมดา</option>
              <option value="corporate">นิติบุคคล</option>
            </select>
          </Field>
          <Field label="ชื่อ *">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </Field>

          {form.customerType === "corporate" && (
            <div ref={dbdWrapperRef} className="relative">
              <Field label="ค้นหาจาก DBD (กรมพัฒนาธุรกิจการค้า)" hint="ขั้นต่ำ 3 ตัวอักษร">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="พิมพ์ชื่อบริษัท..."
                    value={dbdSearch}
                    onChange={(e) => {
                      setDbdSearch(e.target.value);
                      if (e.target.value.length >= 3) setShowDbdResults(true);
                    }}
                    onFocus={() => {
                      if (dbdSearch.length >= 3) setShowDbdResults(true);
                    }}
                  />
                </div>
              </Field>
              {dbdLoading && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">กำลังค้นหา...</span>
                </div>
              )}
              {dbdError && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-red-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{dbdError}</span>
                </div>
              )}
              {showDbdResults && !dbdLoading && !dbdError && dbdResults.length === 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
                  <SearchX className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">ไม่พบข้อมูลบริษัทที่ค้นหา</span>
                </div>
              )}
              {showDbdResults && !dbdLoading && !dbdError && dbdResults.length > 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {dbdResults.map((company, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDBDResult(company)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0"
                    >
                      <div className="font-medium text-gray-900 text-sm">{company.ชื่อนิติบุคคล}</div>
                      <div className="text-xs text-gray-500">
                        {company.เลขทะเบียน} · {company.จังหวัด}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="เบอร์โทร">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </Field>
            <Field label="อีเมล">
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="TIN (13 หลัก)" hint={!taxValid ? "ไม่ถูกต้อง" : undefined}>
              <input
                className={inputCls + (form.taxId && !taxValid ? " border-red-400" : "")}
                value={form.taxId}
                inputMode="numeric"
                maxLength={13}
                onChange={(e) => setForm((s) => ({ ...s, taxId: e.target.value.replace(/\D/g, "") }))}
              />
            </Field>
            <Field label="รหัสสาขา">
              <input
                className={inputCls}
                value={form.branchCode}
                inputMode="numeric"
                maxLength={5}
                onChange={(e) => setForm((s) => ({ ...s, branchCode: e.target.value.replace(/\D/g, "") }))}
              />
            </Field>
            <Field label="เครดิต (วัน)">
              <input
                className={inputCls}
                type="number"
                value={form.creditTerm}
                onChange={(e) => setForm((s) => ({ ...s, creditTerm: Number(e.target.value) || 0 }))}
              />
            </Field>
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2">
            <legend className="text-xs font-medium text-gray-700 px-1">ที่อยู่</legend>
            <input
              className={inputCls}
              placeholder="เลขที่ / ถนน"
              value={form.address.street}
              onChange={(e) => setForm((s) => ({ ...s, address: { ...s.address, street: e.target.value } }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                placeholder="แขวง/ตำบล"
                value={form.address.district}
                onChange={(e) => setForm((s) => ({ ...s, address: { ...s.address, district: e.target.value } }))}
              />
              <input
                className={inputCls}
                placeholder="เขต/อำเภอ"
                value={form.address.subdistrict}
                onChange={(e) => setForm((s) => ({ ...s, address: { ...s.address, subdistrict: e.target.value } }))}
              />
              <input
                className={inputCls}
                placeholder="จังหวัด"
                value={form.address.province}
                onChange={(e) => setForm((s) => ({ ...s, address: { ...s.address, province: e.target.value } }))}
              />
            </div>
            <input
              className={inputCls}
              placeholder="รหัสไปรษณีย์"
              value={form.address.postcode}
              inputMode="numeric"
              maxLength={5}
              onChange={(e) =>
                setForm((s) => ({ ...s, address: { ...s.address, postcode: e.target.value.replace(/\D/g, "") } }))
              }
            />
          </fieldset>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
      {children}
      {hint && <span className="text-xs text-red-600 block mt-0.5">{hint}</span>}
    </label>
  );
}
