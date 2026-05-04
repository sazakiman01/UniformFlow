"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Edit, Trash2, Package } from "lucide-react";
import { listStockItems, deleteStockItem } from "@/lib/stock-items";
import { StockItem, STOCK_CATEGORY_LABELS } from "@/types";
import Link from "next/link";
import { canManageStock } from "@/types";

export default function StockItemsPage() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [items, setItems] = useState<StockItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      loadData();
    }
  }, [loading, profileLoading, user, profile]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const data = await listStockItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading stock items:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่ไหม?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteStockItem(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting stock item:", error);
      alert("เกิดข้อผิดพลาดในการลบรายการ");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || profileLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการวัตถุดิบ</h1>
          <p className="text-gray-500 mt-1">จัดการรายการวัตถุดิบทั้งหมด</p>
        </div>
        {canManageStock(profile.role) && (
          <Link
            href="/dashboard/stock/items/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการ
          </Link>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">รหัส</th>
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="px-4 py-3 font-medium">คงเหลือ</th>
                <th className="px-4 py-3 font-medium">จุดสั่ง</th>
                <th className="px-4 py-3 font-medium">ราคาต้นทุน</th>
                <th className="px-4 py-3 font-medium">สถานที่</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm">
                    {STOCK_CATEGORY_LABELS[item.category]}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-semibold ${
                      item.currentStock <= item.reorderPoint ? "text-orange-600" : "text-gray-900"
                    }`}>
                      {item.currentStock}
                    </span> {item.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.reorderPoint} {item.unit}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.costPerUnit.toLocaleString("th-TH")} ฿/{item.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.location || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {canManageStock(profile.role) && (
                        <>
                          <Link
                            href={`/dashboard/stock/items/${item.id}/edit`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="ลบ"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p>ยังไม่มีรายการวัตถุดิบ</p>
                      {canManageStock(profile.role) && (
                        <Link
                          href="/dashboard/stock/items/new"
                          className="text-blue-600 hover:underline"
                        >
                          เพิ่มรายการแรก
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
