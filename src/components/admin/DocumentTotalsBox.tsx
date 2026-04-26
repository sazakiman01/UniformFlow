"use client";

import { formatTHB } from "@/lib/money";
import type { DocumentTotals } from "@/lib/money";
import type { PriceMode } from "@/types";

interface Props {
  totals: DocumentTotals;
  vatRate: number;
  priceMode: PriceMode;
  documentDiscount: number;
  whtRate?: number;
  onChange: (patch: { vatRate?: number; priceMode?: PriceMode; documentDiscount?: number; whtRate?: number }) => void;
  showWHT?: boolean;
  vatRegistered?: boolean;
}

export default function DocumentTotalsBox({
  totals,
  vatRate,
  priceMode,
  documentDiscount,
  whtRate = 0,
  onChange,
  showWHT = false,
  vatRegistered = true,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">รวมก่อนส่วนลด</span>
        <span className="tabular-nums">{formatTHB(totals.subtotal)}</span>
      </div>

      {totals.lineDiscounts > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>ส่วนลดรายการ</span>
          <span className="tabular-nums">−{formatTHB(totals.lineDiscounts)}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">ส่วนลดรวม</label>
        <input
          type="number"
          step="0.01"
          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded text-right"
          value={documentDiscount}
          onChange={(e) => onChange({ documentDiscount: Number(e.target.value) || 0 })}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">มูลค่าก่อน VAT</span>
        <span className="tabular-nums font-medium">{formatTHB(totals.netBeforeVat)}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">ราคา</span>
          <select
            className="text-xs px-2 py-0.5 border border-gray-300 rounded bg-white"
            value={priceMode}
            onChange={(e) => onChange({ priceMode: e.target.value as PriceMode })}
          >
            <option value="exclusive">ไม่รวม VAT</option>
            <option value="inclusive">รวม VAT แล้ว</option>
          </select>
          {vatRegistered && (
            <select
              className="text-xs px-2 py-0.5 border border-gray-300 rounded bg-white"
              value={vatRate}
              onChange={(e) => onChange({ vatRate: Number(e.target.value) })}
            >
              <option value={0}>VAT 0%</option>
              <option value={7}>VAT 7%</option>
            </select>
          )}
        </div>
        <span className="tabular-nums">{formatTHB(totals.vatAmount)}</span>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-bold text-gray-900">รวมทั้งสิ้น</span>
        <span className="text-xl font-bold text-blue-700 tabular-nums">
          {formatTHB(totals.grandTotal)}
        </span>
      </div>

      {showWHT && (
        <>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">หัก ณ ที่จ่าย</span>
              <select
                className="text-xs px-2 py-0.5 border border-gray-300 rounded bg-white"
                value={whtRate}
                onChange={(e) => onChange({ whtRate: Number(e.target.value) })}
              >
                <option value={0}>0%</option>
                <option value={1}>1%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
                <option value={5}>5%</option>
              </select>
            </div>
            <span className="tabular-nums text-red-600">−{formatTHB(totals.whtAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="font-medium">ยอดสุทธิที่ต้องโอน</span>
            <span className="font-bold tabular-nums text-green-700">{formatTHB(totals.amountDue)}</span>
          </div>
        </>
      )}
    </div>
  );
}
