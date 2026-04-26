"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { buildPLReport } from "@/lib/reports/pnl";
import { formatTHB } from "@/lib/money";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expenses";
import type { PLReport, ExpenseCategory } from "@/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PLReportPage() {
  const now = new Date();
  const [from, setFrom] = useState(toDateInput(startOfMonth(now)));
  const [to, setTo] = useState(toDateInput(endOfMonth(now)));
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await buildPLReport({ from: new Date(from), to: new Date(to + "T23:59:59") });
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
        <FileText className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">งบกำไรขาดทุน (P&L)</h2>
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
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "คำนวณ"}
        </button>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card title="รายได้" value={report.revenue} icon={<TrendingUp className="w-5 h-5" />} color="green" />
            <Card title="COGS (ต้นทุนสินค้า)" value={report.cogs} negative color="amber" />
            <Card
              title="กำไรขั้นต้น"
              value={report.grossProfit}
              extra={`${report.grossMarginPct}%`}
              color="blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card
              title="ค่าใช้จ่ายดำเนินงาน (OPEX)"
              value={report.operatingExpenses}
              negative
              color="orange"
            />
            <Card
              title="กำไรสุทธิ"
              value={report.netProfit}
              extra={`${report.netMarginPct}%`}
              icon={
                report.netProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )
              }
              color={report.netProfit >= 0 ? "green" : "red"}
              big
            />
          </div>

          {Object.keys(report.expensesByCategory).length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="font-semibold mb-3">ค่าใช้จ่ายตามหมวด</h3>
              <div className="space-y-2">
                {Object.entries(report.expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => {
                    const total = report.cogs + report.operatingExpenses;
                    const pct = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}</span>
                          <span className="tabular-nums font-medium">
                            {formatTHB(amount)}{" "}
                            <span className="text-gray-400 text-xs">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded">
                          <div
                            className="h-full bg-blue-500 rounded"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputCls = "px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500";

function Card({
  title,
  value,
  extra,
  icon,
  negative = false,
  color,
  big = false,
}: {
  title: string;
  value: number;
  extra?: string;
  icon?: React.ReactNode;
  negative?: boolean;
  color: "green" | "blue" | "amber" | "orange" | "red";
  big?: boolean;
}) {
  const map: Record<typeof color, string> = {
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={`rounded-xl border p-4 ${map[color]}`}>
      <div className="flex items-center justify-between text-sm font-medium opacity-80">
        <span>{title}</span>
        {icon}
      </div>
      <div className={`tabular-nums font-bold mt-1 ${big ? "text-3xl" : "text-2xl"}`}>
        {negative ? "−" : ""}
        {formatTHB(value)}
      </div>
      {extra && <div className="text-xs opacity-70 mt-0.5">{extra}</div>}
    </div>
  );
}
