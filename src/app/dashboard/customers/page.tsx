"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Loader2, Trash2, Search } from "lucide-react";
import { listCustomers, deleteCustomer } from "@/lib/customers";
import type { Customer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomersListPage() {
  const { canManageFinance } = useAuth();
  const [items, setItems] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(null);
    listCustomers({ search, max: 100 })
      .then(setItems)
      .catch((e) => {
        console.error(e);
        setItems([]);
      });
  }, [search]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบลูกค้า "${name}" ใช่หรือไม่?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteCustomer(id);
      setItems((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("ไม่สามารถลบลูกค้าได้");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">ลูกค้า</h2>
          </div>
          <p className="text-sm text-gray-600">จัดการข้อมูลลูกค้า และประวัติการซื้อ</p>
        </div>
        {canManageFinance && (
          <Link
            href="/dashboard/quotations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้าใหม่
          </Link>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์โทร, หรือ TIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
          {search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้า"}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left px-4 py-2.5">ชื่อ</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">เบอร์โทร</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">ประเภท</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">TIN</th>
                <th className="text-center px-4 py-2.5">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-600">{c.phone || "-"}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      c.customerType === "corporate" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {c.customerType === "corporate" ? "นิติบุคคล" : "บุคคลธรรมดา"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-gray-600 font-mono">{c.taxId || "-"}</td>
                  <td className="px-4 py-2.5 text-center">
                    {canManageFinance && (
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs">ลบ</span>
                      </button>
                    )}
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
