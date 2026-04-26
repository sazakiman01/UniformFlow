"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DocumentLineItem } from "@/types";
import { formatTHB, round2 } from "@/lib/money";

interface Props {
  items: DocumentLineItem[];
  onChange: (items: DocumentLineItem[]) => void;
}

export default function LineItemsEditor({ items, onChange }: Props) {
  const update = (idx: number, patch: Partial<DocumentLineItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    next[idx].total = round2(
      next[idx].quantity * next[idx].unitPrice - (next[idx].discount ?? 0),
    );
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () =>
    onChange([
      ...items,
      { productName: "", quantity: 1, unitPrice: 0, total: 0, discount: 0 },
    ]);

  return (
    <div className="space-y-2">
      <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 px-2">
        <div className="col-span-5">รายการ</div>
        <div className="col-span-1 text-right">จำนวน</div>
        <div className="col-span-1">หน่วย</div>
        <div className="col-span-2 text-right">ราคา/หน่วย</div>
        <div className="col-span-1 text-right">ส่วนลด</div>
        <div className="col-span-2 text-right">รวม</div>
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 border border-gray-200 rounded-lg bg-white"
        >
          <div className="sm:col-span-5">
            <input
              className={inputCls}
              placeholder="ชื่อสินค้า / บริการ"
              value={it.productName}
              onChange={(e) => update(i, { productName: e.target.value })}
            />
            <input
              className={inputCls + " mt-1 text-xs"}
              placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
              value={it.description ?? ""}
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </div>
          <div className="sm:col-span-1">
            <input
              className={inputCls + " text-right"}
              type="number"
              step="0.01"
              value={it.quantity}
              onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:col-span-1">
            <input
              className={inputCls}
              placeholder="ตัว"
              value={it.unit ?? ""}
              onChange={(e) => update(i, { unit: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <input
              className={inputCls + " text-right"}
              type="number"
              step="0.01"
              value={it.unitPrice}
              onChange={(e) => update(i, { unitPrice: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:col-span-1">
            <input
              className={inputCls + " text-right"}
              type="number"
              step="0.01"
              value={it.discount ?? 0}
              onChange={(e) => update(i, { discount: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
            <span className="font-medium tabular-nums text-right">
              {formatTHB(it.total)}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline px-2 py-1.5"
      >
        <Plus className="w-4 h-4" />
        เพิ่มรายการ
      </button>
    </div>
  );
}

const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white";
