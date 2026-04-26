"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, FileText, CheckSquare, Square } from "lucide-react";
import CustomerPicker from "./CustomerPicker";
import { listInvoices } from "@/lib/invoices";
import { createBillingNote } from "@/lib/billing-notes";
import { buildCustomerSnapshot } from "@/lib/customers";
import { formatTHB } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer, Invoice } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export default function BillingNoteForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(() =>
    addDays(new Date(), 30).toISOString().slice(0, 10),
  );
  const [collectorName, setCollectorName] = useState("");
  const [collectDate, setCollectDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load unpaid invoices when customer changes
  useEffect(() => {
    if (!customer) {
      setInvoices([]);
      setSelected(new Set());
      return;
    }
    setLoading(true);
    listInvoices({ customerId: customer.id, max: 200 })
      .then((list) => {
        // Only unpaid/partial invoices that are issued (not draft/cancelled)
        const unpaid = list.filter((inv) => {
          if (inv.status === "cancelled" || inv.status === "void" || inv.status === "draft") return false;
          const due = (inv.amountDue ?? 0) > 0.01;
          return due;
        });
        setInvoices(unpaid);
        setSelected(new Set(unpaid.map((inv) => inv.id)));
      })
      .finally(() => setLoading(false));
  }, [customer]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === invoices.length) setSelected(new Set());
    else setSelected(new Set(invoices.map((i) => i.id)));
  }

  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selected.has(inv.id)),
    [invoices, selected],
  );
  const totalAmount = useMemo(
    () => selectedInvoices.reduce((s, inv) => s + (inv.amountDue ?? 0), 0),
    [selectedInvoices],
  );

  async function handleSave() {
    setErr(null);
    if (!user) return;
    if (!customer) return setErr("กรุณาเลือกลูกค้า");
    if (selectedInvoices.length === 0) return setErr("กรุณาเลือกใบแจ้งหนี้อย่างน้อย 1 ใบ");

    setSaving(true);
    try {
      const { id } = await createBillingNote({
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        customerId: customer.id,
        customerSnapshot: buildCustomerSnapshot(customer),
        items: selectedInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          issueDate: inv.issueDate,
          description: inv.items?.[0]?.productName ?? "-",
          amount: inv.grandTotal,
          amountDue: inv.amountDue ?? 0,
        })),
        totalAmount,
        status: "draft",
        collectorName: collectorName || undefined,
        collectDate: collectDate ? new Date(collectDate) : undefined,
        notes: notes.trim() || undefined,
        createdBy: user.uid,
      });
      router.push(`/dashboard/billing-notes/${id}`);
    } catch (e) {
      console.error(e);
      setErr("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">สร้างใบวางบิล</h2>
      </div>

      {err && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <Section title="ลูกค้า">
        <CustomerPicker value={customer} onChange={setCustomer} />
      </Section>

      {customer && (
        <Section title="ใบแจ้งหนี้ค้างชำระ">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังโหลด...
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-gray-500">
              ลูกค้ารายนี้ไม่มีใบแจ้งหนี้ที่ค้างชำระ
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mb-2"
              >
                {selected.size === invoices.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selected.size === invoices.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-600">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="text-left px-3 py-2">เลขที่</th>
                      <th className="text-left px-3 py-2">วันที่</th>
                      <th className="text-left px-3 py-2">กำหนดชำระ</th>
                      <th className="text-right px-3 py-2">ยอดรวม</th>
                      <th className="text-right px-3 py-2">ค้าง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => {
                      const isSelected = selected.has(inv.id);
                      return (
                        <tr
                          key={inv.id}
                          onClick={() => toggle(inv.id)}
                          className={"cursor-pointer " + (isSelected ? "bg-indigo-50" : "hover:bg-gray-50")}
                        >
                          <td className="px-3 py-2 text-center">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{inv.number}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {inv.issueDate.toLocaleDateString("th-TH")}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {inv.dueDate.toLocaleDateString("th-TH")}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatTHB(inv.grandTotal)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium text-red-600">
                            {formatTHB(inv.amountDue ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-indigo-50 border-t-2 border-indigo-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                        รวมที่เลือก ({selectedInvoices.length} ใบ)
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-lg text-indigo-700">
                        {formatTHB(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </Section>
      )}

      <Section title="รายละเอียดการวางบิล">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="วันที่วางบิล">
            <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </Field>
          <Field label="กำหนดชำระ">
            <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="ผู้ไปเก็บเงิน">
            <input className={inputCls} value={collectorName} onChange={(e) => setCollectorName(e.target.value)} />
          </Field>
          <Field label="วันนัดเก็บ">
            <input type="date" className={inputCls} value={collectDate} onChange={(e) => setCollectDate(e.target.value)} />
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
          disabled={saving || selectedInvoices.length === 0}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          สร้างใบวางบิล
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500";

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
