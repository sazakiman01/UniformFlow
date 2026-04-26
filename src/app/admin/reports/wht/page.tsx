"use client";

import { useEffect, useState } from "react";
import { Loader2, Calculator, Download } from "lucide-react";
import { listExpenses } from "@/lib/expenses";
import { formatTHB } from "@/lib/money";
import type { Expense } from "@/types";

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/**
 * WHT report = ภาษีหัก ณ ที่จ่ายที่ "เราหัก supplier" (เราจ่ายให้สรรพากรแทน supplier).
 * Pulled from expenses with withholdingTaxAmount > 0.
 *
 * Note: Full PND.3/53 export is a separate phase. This page shows the data ready for accountant.
 */
export default function WHTReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<Expense[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0, 23, 59, 59);
      const all = await listExpenses({ from, to, max: 5000 });
      setItems(all.filter((e) => (e.withholdingTaxAmount ?? 0) > 0));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCSV() {
    if (!items) return;
    const rows = [
      ["วันที่จ่าย", "ผู้รับ", "TIN", "ประเภท", "ยอดจ่าย", "อัตรา %", "ยอดหัก"],
      ...items.map((e) => [
        e.paidAt.toLocaleDateString("th-TH"),
        e.supplier ?? "",
        e.supplierTaxId ?? "",
        e.description,
        e.totalAmount.toFixed(2),
        String(e.withholdingTaxRate ?? 0),
        (e.withholdingTaxAmount ?? 0).toFixed(2),
      ]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wht-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = items?.reduce((s, e) => s + (e.withholdingTaxAmount ?? 0), 0) ?? 0;
  const totalIncome = items?.reduce((s, e) => s + e.totalAmount, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-900">รายงานหัก ณ ที่จ่าย (ภงด.3/53)</h2>
        </div>
        {items && items.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        💡 รายงานนี้คือ ภาษีหัก ณ ที่จ่าย ที่เราหัก supplier แล้วต้องนำส่งกรมสรรพากรภายในวันที่ 7 ของเดือนถัดไป
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">เดือน</label>
          <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ปี</label>
          <input type="number" className={inputCls} value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "คำนวณ"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">ยอดที่จ่ายให้ supplier</div>
          <div className="text-2xl font-bold tabular-nums">{formatTHB(totalIncome)}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-800">ภาษีหัก ณ ที่จ่ายที่ต้องนำส่ง</div>
          <div className="text-2xl font-bold tabular-nums">{formatTHB(total)}</div>
        </div>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-200">
          ไม่มีรายการในเดือนนี้
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-3 py-2.5">วันที่</th>
                <th className="text-left px-3 py-2.5">ผู้รับ</th>
                <th className="text-left px-3 py-2.5">TIN</th>
                <th className="text-left px-3 py-2.5">ประเภท</th>
                <th className="text-right px-3 py-2.5">ยอดจ่าย</th>
                <th className="text-center px-3 py-2.5">อัตรา</th>
                <th className="text-right px-3 py-2.5">ยอดหัก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5">{e.paidAt.toLocaleDateString("th-TH")}</td>
                  <td className="px-3 py-2.5">{e.supplier ?? "-"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{e.supplierTaxId ?? "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{e.description}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatTHB(e.totalAmount)}</td>
                  <td className="px-3 py-2.5 text-center">{e.withholdingTaxRate}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-amber-700">
                    {formatTHB(e.withholdingTaxAmount ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls = "px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";
