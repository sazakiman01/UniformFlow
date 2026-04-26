"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Wallet, AlertCircle, Save, CheckCircle2, Users, ArrowRight,
} from "lucide-react";
import { getCompanyProfile, saveCompanyProfile } from "@/lib/company";
import { listCustomers, updateCustomer } from "@/lib/customers";
import { formatTHB } from "@/lib/money";
import type { CompanyProfile, Customer } from "@/types";

export default function OpeningBalancePage() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [systemStartDate, setSystemStartDate] = useState("");
  const [cash, setCash] = useState(0);
  const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [arBalances, setArBalances] = useState<Record<string, { amount: number; date: string }>>({});

  useEffect(() => {
    Promise.all([getCompanyProfile(), listCustomers()]).then(([c, cs]) => {
      setCompany(c);
      setCustomers(cs);
      if (c) {
        setSystemStartDate(
          c.systemStartDate ? c.systemStartDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        );
        setCash(c.cashOpeningBalance ?? 0);
        setBankBalances(c.bankOpeningBalances ?? {});
        setNotes(c.openingBalanceNotes ?? "");
      }
      const ar: Record<string, { amount: number; date: string }> = {};
      for (const cu of cs) {
        if (cu.openingBalance) {
          ar[cu.id] = {
            amount: cu.openingBalance,
            date: cu.openingBalanceAsOf
              ? cu.openingBalanceAsOf.toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
          };
        }
      }
      setArBalances(ar);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!company) return;
    setSaving(true);
    setSaved(false);
    try {
      // Save company opening balances
      await saveCompanyProfile({
        ...company,
        systemStartDate: new Date(systemStartDate),
        cashOpeningBalance: cash,
        bankOpeningBalances: bankBalances,
        openingBalanceNotes: notes,
      });

      // Save per-customer AR opening balances
      const asOf = new Date(systemStartDate);
      const updates = Object.entries(arBalances).map(([customerId, v]) => {
        if (v.amount > 0) {
          return updateCustomer(customerId, {
            openingBalance: v.amount,
            openingBalanceAsOf: new Date(v.date || systemStartDate),
          });
        }
        return updateCustomer(customerId, { openingBalance: 0, openingBalanceAsOf: asOf });
      });
      await Promise.all(updates);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function setAR(customerId: string, amount: number) {
    setArBalances((prev) => ({
      ...prev,
      [customerId]: { amount, date: prev[customerId]?.date || systemStartDate },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-3">กรุณาตั้งค่าข้อมูลบริษัทก่อน</p>
        <Link href="/dashboard/company" className="text-blue-600 underline">
          ไปหน้าข้อมูลบริษัท
        </Link>
      </div>
    );
  }

  const totalBank = Object.values(bankBalances).reduce((s, v) => s + v, 0);
  const totalAR = Object.values(arBalances).reduce((s, v) => s + (v.amount || 0), 0);
  const customersWithAR = customers.filter((c) => (arBalances[c.id]?.amount ?? 0) > 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">ยอดยกมา (Opening Balance)</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          ตั้งยอดต้นงวดสำหรับการย้ายจากระบบเดิม เพื่อให้รายงานถูกต้อง
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
        <AlertCircle className="w-4 h-4 inline mr-1" />
        ตั้งค่านี้เพียงครั้งเดียวก่อนเริ่มใช้งานจริง — หลังจากนั้นตัวเลขจะถูกคำนวณอัตโนมัติจากรายการในระบบ
      </div>

      <Section title="วันที่เริ่มใช้ระบบ">
        <input
          type="date"
          className={inputCls}
          value={systemStartDate}
          onChange={(e) => setSystemStartDate(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          ยอดยกมาทั้งหมดจะคิดจากวันนี้ — รายการก่อนวันนี้จะไม่ถูกบันทึกในระบบ
        </p>
      </Section>

      <Section title="เงินสดต้นงวด">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            className={inputCls + " max-w-xs"}
            value={cash}
            onChange={(e) => setCash(Number(e.target.value) || 0)}
          />
          <span className="text-sm text-gray-600">บาท</span>
        </div>
      </Section>

      <Section title={`บัญชีธนาคารต้นงวด (${company.bankAccounts?.length ?? 0} บัญชี)`}>
        {company.bankAccounts && company.bankAccounts.length > 0 ? (
          <div className="space-y-2">
            {company.bankAccounts.map((acc) => (
              <div key={acc.accountNumber} className="flex items-center gap-3">
                <div className="flex-1 text-sm">
                  <div className="font-medium">{acc.bankName}</div>
                  <div className="text-xs text-gray-600 font-mono">{acc.accountNumber}</div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className={inputCls + " max-w-[200px] text-right"}
                  value={bankBalances[acc.accountNumber] ?? 0}
                  onChange={(e) =>
                    setBankBalances((prev) => ({
                      ...prev,
                      [acc.accountNumber]: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="text-xs text-gray-500 w-8">บาท</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>รวม</span>
              <span className="tabular-nums">{formatTHB(totalBank)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชีธนาคาร —{" "}
            <Link href="/dashboard/company" className="text-blue-600 underline">
              เพิ่มในหน้าข้อมูลบริษัท
            </Link>
          </p>
        )}
      </Section>

      <Section title={`ลูกหนี้คงค้างต้นงวด (${customersWithAR.length} ราย)`}>
        {customers.length === 0 ? (
          <div className="text-sm text-gray-500">
            ยังไม่มีลูกค้าในระบบ —{" "}
            <Link href="/dashboard/tools/import-customers" className="text-blue-600 underline inline-flex items-center gap-1">
              Import จาก CSV
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-2">
              <Users className="w-3 h-3 inline mr-1" />
              กรอกเฉพาะลูกค้าที่ยังค้างชำระ — ให้เหลือ 0 ถ้าไม่ค้าง
            </p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-xs text-gray-600 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">ลูกค้า</th>
                    <th className="text-right px-3 py-2 w-40">ยอดค้าง</th>
                    <th className="text-left px-3 py-2 w-36">วันตัดยอด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((c) => (
                    <tr key={c.id} className={(arBalances[c.id]?.amount ?? 0) > 0 ? "bg-blue-50" : ""}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.name}</div>
                        {c.taxId && <div className="text-xs text-gray-500 font-mono">{c.taxId}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className={inputCls + " text-right"}
                          value={arBalances[c.id]?.amount ?? 0}
                          onChange={(e) => setAR(c.id, Number(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className={inputCls}
                          value={arBalances[c.id]?.date || systemStartDate}
                          onChange={(e) =>
                            setArBalances((prev) => ({
                              ...prev,
                              [c.id]: { amount: prev[c.id]?.amount ?? 0, date: e.target.value },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between mt-2 font-semibold text-sm">
              <span>รวมลูกหนี้คงค้าง</span>
              <span className="tabular-nums">{formatTHB(totalAR)}</span>
            </div>
          </>
        )}
      </Section>

      <Section title="หมายเหตุ">
        <textarea
          className={inputCls}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น ย้ายมาจาก FlowAccount วันที่ 1 พ.ค. 2026"
        />
      </Section>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">สรุปยอดต้นงวด</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <SummaryItem label="เงินสด" value={cash} />
          <SummaryItem label="ธนาคาร" value={totalBank} />
          <SummaryItem label="ลูกหนี้ค้าง" value={totalAR} />
          <SummaryItem label="รวมสินทรัพย์" value={cash + totalBank + totalAR} bold />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="text-sm text-green-700 inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            บันทึกแล้ว
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกยอดต้นงวด
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

function SummaryItem({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div>
      <div className="text-xs text-blue-800/70">{label}</div>
      <div className={`tabular-nums ${bold ? "text-xl font-bold text-blue-900" : "font-semibold text-blue-900"}`}>
        {formatTHB(value)}
      </div>
    </div>
  );
}
