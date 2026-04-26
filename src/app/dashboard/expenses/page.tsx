"use client";

import { useEffect, useState } from "react";
import { Plus, Wallet, Loader2, Trash2, Pencil } from "lucide-react";
import { listExpenses, deleteExpense, EXPENSE_CATEGORY_LABELS } from "@/lib/expenses";
import { formatTHB } from "@/lib/money";
import ExpenseForm from "@/components/admin/ExpenseForm";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense, ExpenseCategory } from "@/types";

export default function ExpensesPage() {
  const { canManageFinance } = useAuth();
  const [items, setItems] = useState<Expense[] | null>(null);
  const [filter, setFilter] = useState<ExpenseCategory | "all">("all");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function refresh() {
    setItems(null);
    try {
      const items = await listExpenses({
        category: filter === "all" ? undefined : filter,
        max: 500,
      });
      setItems(items);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleDelete(exp: Expense) {
    if (!confirm(`ลบ ${exp.number} (${exp.description})?`)) return;
    await deleteExpense(exp.id);
    await refresh();
  }

  const total = items?.reduce((s, e) => s + e.totalAmount, 0) ?? 0;
  const totalVAT = items?.reduce((s, e) => s + (e.isPurchaseTaxClaim ? e.vatAmount ?? 0 : 0), 0) ?? 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">ค่าใช้จ่าย</h2>
          </div>
          <p className="text-sm text-gray-600">บันทึกค่าใช้จ่าย — เครม VAT ซื้อ ภพ.30 ได้</p>
        </div>
        {canManageFinance && (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการ
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">รวมค่าใช้จ่าย</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">{formatTHB(total)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">VAT ซื้อที่เครมได้</div>
          <div className="text-2xl font-bold text-green-700 tabular-nums">{formatTHB(totalVAT)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={
            "px-3 py-1.5 text-sm rounded-lg whitespace-nowrap " +
            (filter === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700")
          }
        >
          ทั้งหมด
        </button>
        {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={
              "px-3 py-1.5 text-sm rounded-lg whitespace-nowrap " +
              (filter === c ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700")
            }
          >
            {EXPENSE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          ยังไม่มีรายการ
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-3 py-2.5">เลขที่</th>
                <th className="text-left px-3 py-2.5">วันที่</th>
                <th className="text-left px-3 py-2.5">รายละเอียด</th>
                <th className="text-left px-3 py-2.5 hidden md:table-cell">หมวด</th>
                <th className="text-right px-3 py-2.5">ยอด</th>
                <th className="text-center px-3 py-2.5">VAT</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-mono text-xs">{e.number}</td>
                  <td className="px-3 py-2.5 text-gray-600">{e.paidAt.toLocaleDateString("th-TH")}</td>
                  <td className="px-3 py-2.5">
                    <div>{e.description}</div>
                    {e.supplier && <div className="text-xs text-gray-500">{e.supplier}</div>}
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-gray-600">
                    {EXPENSE_CATEGORY_LABELS[e.category]}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatTHB(e.totalAmount)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {e.isPurchaseTaxClaim ? (
                      <span className="inline-block px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        ✓ {e.vatAmount?.toFixed(0) ?? 0}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {canManageFinance && (
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setEditing(e)}
                          className="p-1.5 text-gray-500 hover:text-blue-600"
                          title="แก้ไข"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          className="p-1.5 text-gray-500 hover:text-red-600"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <ExpenseForm
          onClose={() => setShowNew(false)}
          onSaved={async () => {
            setShowNew(false);
            await refresh();
          }}
        />
      )}
      {editing && (
        <ExpenseForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
