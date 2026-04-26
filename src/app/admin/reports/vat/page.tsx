"use client";

import { useEffect, useState } from "react";
import { Loader2, Receipt, Download } from "lucide-react";
import { buildVATReport, vatReportToCSV } from "@/lib/reports/vat";
import { formatTHB } from "@/lib/money";
import type { VATReport } from "@/types";

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default function VATReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<VATReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await buildVATReport({ year, month });
      setReport(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExport() {
    if (!report) return;
    const csv = vatReportToCSV(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vat-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">รายงานภาษีมูลค่าเพิ่ม (ภพ.30)</h2>
        </div>
        {report && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">เดือน</label>
          <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
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

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard title="VAT ขาย (Output)" base={report.output.base} vat={report.output.vat} count={report.output.invoiceCount} color="blue" />
            <SummaryCard title="VAT ซื้อ (Input)" base={report.input.base} vat={report.input.vat} count={report.input.expenseCount} color="green" />
            <div className={`rounded-xl border p-4 ${report.isRefund ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}>
              <div className="text-sm font-medium">{report.isRefund ? "VAT ขอคืน" : "VAT ที่ต้องชำระ"}</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {formatTHB(Math.abs(report.vatDue))}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                ภายในวันที่ 15 ของเดือนถัดไป
              </div>
            </div>
          </div>

          <Section title={`ใบกำกับภาษีขาย (${report.output.invoiceCount} รายการ)`}>
            <Table
              headers={["เลขที่", "วันที่", "ลูกค้า", "TIN", "ฐาน", "VAT"]}
              rows={report.output.invoices.map((i) => [
                i.number,
                i.issueDate.toLocaleDateString("th-TH"),
                i.customerName,
                i.customerTaxId ?? "-",
                formatTHB(i.netAmount),
                formatTHB(i.vatAmount),
              ])}
              emptyMessage="ไม่มีใบกำกับภาษีในเดือนนี้"
            />
          </Section>

          <Section title={`ใบกำกับภาษีซื้อ (${report.input.expenseCount} รายการ)`}>
            <Table
              headers={["UF", "วันที่", "ผู้ขาย", "TIN", "เลขใบกำกับ", "ฐาน", "VAT"]}
              rows={report.input.expenses.map((e) => [
                e.number,
                e.paidAt.toLocaleDateString("th-TH"),
                e.supplierName,
                e.supplierTaxId ?? "-",
                e.supplierTaxInvoiceNumber ?? "-",
                formatTHB(e.amount),
                formatTHB(e.vatAmount),
              ])}
              emptyMessage="ไม่มีใบกำกับภาษีซื้อ — ตรวจสอบว่าได้กรอก ✓ เครม VAT ซื้อในหน้าค่าใช้จ่ายแล้ว"
            />
          </Section>
        </>
      )}
    </div>
  );
}

const inputCls = "px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function SummaryCard({ title, base, vat, count, color }: { title: string; base: number; vat: number; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{formatTHB(vat)}</div>
      <div className="text-xs text-gray-600 mt-0.5">
        ฐาน {formatTHB(base)} · {count} รายการ
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Table({ headers, rows, emptyMessage }: { headers: string[]; rows: string[][]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-8 bg-white rounded-xl border border-gray-200">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={"text-left px-3 py-2 " + (i >= headers.length - 2 ? "text-right" : "")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {r.map((c, j) => (
                <td key={j} className={"px-3 py-2 " + (j >= headers.length - 2 ? "text-right tabular-nums" : "")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
