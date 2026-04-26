"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, Download, AlertTriangle } from "lucide-react";
import { buildARAgingReport } from "@/lib/reports/ar-aging";
import { formatTHB } from "@/lib/money";
import type { ARAgingReport, ARAgingBucket } from "@/types";

const BUCKET_LABEL: Record<ARAgingBucket, string> = {
  current: "ยังไม่ถึงกำหนด",
  "1-30": "1-30 วัน",
  "31-60": "31-60 วัน",
  "61-90": "61-90 วัน",
  "90+": "เกิน 90 วัน",
};

const BUCKET_COLOR: Record<ARAgingBucket, string> = {
  current: "bg-blue-50 text-blue-700",
  "1-30": "bg-amber-50 text-amber-700",
  "31-60": "bg-orange-50 text-orange-700",
  "61-90": "bg-red-50 text-red-700",
  "90+": "bg-red-100 text-red-800",
};

export default function ARAgingPage() {
  const [report, setReport] = useState<ARAgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ARAgingBucket | "all">("all");

  useEffect(() => {
    buildARAgingReport()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    if (!report) return;
    const rows = [
      ["เลขที่", "ลูกค้า", "วันออก", "ครบกำหนด", "เกินวัน", "ค้างชำระ", "ช่วง"],
      ...report.items.map((it) => [
        it.invoiceNumber,
        it.customerName,
        it.issueDate.toLocaleDateString("th-TH"),
        it.dueDate.toLocaleDateString("th-TH"),
        String(it.overdueDays),
        it.amountDue.toFixed(2),
        BUCKET_LABEL[it.bucket],
      ]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ar-aging-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!report) return null;

  const items = filter === "all" ? report.items : report.items.filter((it) => it.bucket === filter);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">รายงานลูกหนี้คงค้าง (AR Aging)</h2>
          </div>
          <p className="text-sm text-gray-600">ณ {report.asOf.toLocaleDateString("th-TH")}</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Bucket summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(BUCKET_LABEL) as ARAgingBucket[]).map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={
              "p-3 rounded-xl border text-left transition " +
              (filter === b ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200") +
              " " +
              BUCKET_COLOR[b]
            }
          >
            <div className="text-xs font-medium opacity-80">{BUCKET_LABEL[b]}</div>
            <div className="text-lg font-bold tabular-nums mt-1">{formatTHB(report.buckets[b])}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-xl">
        <span className="font-semibold">รวมลูกหนี้คงค้างทั้งหมด</span>
        <span className="text-2xl font-bold tabular-nums">{formatTHB(report.totalDue)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={
            "text-sm px-3 py-1.5 rounded-lg " +
            (filter === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-300")
          }
        >
          ทั้งหมด ({report.items.length})
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border">
          ไม่มีลูกหนี้คงค้าง 🎉
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">ลูกค้า</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">ครบกำหนด</th>
                <th className="text-center px-4 py-2.5">เกิน</th>
                <th className="text-right px-4 py-2.5">ค้างชำระ</th>
                <th className="text-center px-4 py-2.5">ช่วง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it.invoiceId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono">
                    <Link href={`/admin/invoices/${it.invoiceId}`} className="text-blue-600 hover:underline">
                      {it.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{it.customerName}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-600">
                    {it.dueDate.toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {it.overdueDays > 60 ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {it.overdueDays}
                      </span>
                    ) : it.overdueDays > 0 ? (
                      <span className="text-amber-700">{it.overdueDays}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-red-600">
                    {formatTHB(it.amountDue)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${BUCKET_COLOR[it.bucket]}`}>
                      {BUCKET_LABEL[it.bucket]}
                    </span>
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
