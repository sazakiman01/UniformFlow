"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { buildCashFlowReport } from "@/lib/reports/cash-flow";
import { formatTHB } from "@/lib/money";
import type { CashFlowReport } from "@/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CashFlowPage() {
  const now = new Date();
  const [from, setFrom] = useState(toDateInput(startOfMonth(now)));
  const [to, setTo] = useState(toDateInput(endOfMonth(now)));
  const [report, setReport] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await buildCashFlowReport({ from: new Date(from), to: new Date(to + "T23:59:59") });
      setReport(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-gray-900">กระแสเงินสด (Cash Flow)</h2>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ตั้งแต่</label>
          <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ถึง</label>
          <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "คำนวณ"}
        </button>
      </div>

      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex justify-between text-sm font-medium">
              <span>เงินเข้า</span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">{formatTHB(report.inflow.total)}</div>
            <div className="text-xs text-gray-600">รับชำระจากลูกค้า</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex justify-between text-sm font-medium">
              <span>เงินออก</span>
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">{formatTHB(report.outflow.total)}</div>
            <div className="text-xs text-gray-600">ค่าใช้จ่าย</div>
          </div>
          <div
            className={
              "rounded-xl border p-4 " +
              (report.net >= 0 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50")
            }
          >
            <div className="text-sm font-medium">เงินสดสุทธิ</div>
            <div className="text-3xl font-bold tabular-nums mt-1">
              {report.net >= 0 ? "+" : ""}
              {formatTHB(report.net)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";
