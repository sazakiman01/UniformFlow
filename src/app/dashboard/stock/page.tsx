"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Package, AlertTriangle, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { listStockItemsSorted, listLowStockItems } from "@/lib/stock-items";
import { listStockMovements } from "@/lib/stock-movements";
import { StockItem, StockMovement } from "@/types";
import { STOCK_CATEGORY_LABELS, MOVEMENT_TYPE_LABELS } from "@/types";
import Link from "next/link";

export default function StockDashboard() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [fabricItems, setFabricItems] = useState<StockItem[]>([]);
  const [otherItems, setOtherItems] = useState<StockItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      loadData();
    }
  }, [loading, profileLoading, user, profile]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load stock items
      const sortedItems = await listStockItemsSorted();
      setFabricItems(sortedItems.fabric);
      setOtherItems(sortedItems.others);
      
      // Load low stock items
      const lowStock = await listLowStockItems();
      setLowStockItems(lowStock);
      
      // Load recent movements
      const movements = await listStockMovements(10);
      setRecentMovements(movements);
      
      // Calculate totals
      const allItems = [...sortedItems.fabric, ...sortedItems.others];
      setTotalItems(allItems.length);
      setLowStockCount(lowStock.length);
      
      const value = allItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
      setTotalStockValue(value);
      
    } catch (error) {
      console.error("Error loading stock data:", error);
    } finally {
      setLoadingData(false);
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
          <h1 className="text-2xl font-bold text-gray-900">สต็อกวัตถุดิบ</h1>
          <p className="text-gray-500 mt-1">จัดการและติดตามยอดวัตถุดิบ</p>
        </div>
        <Link
          href="/dashboard/stock/items/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายการ
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">มูลค่าสต็อก</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStockValue.toLocaleString("th-TH")} ฿
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">สต็อกต่ำ</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">การเคลื่อนไหวล่าสุด</p>
              <p className="text-2xl font-bold text-gray-900">{recentMovements.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">แจ้งเตือนสต็อกต่ำ</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">รหัส</th>
                  <th className="pb-2">ชื่อ</th>
                  <th className="pb-2">หมวดหมู่</th>
                  <th className="pb-2">คงเหลือ</th>
                  <th className="pb-2">จุดสั่ง</th>
                  <th className="pb-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 text-sm">{item.sku}</td>
                    <td className="py-2 text-sm font-medium">{item.name}</td>
                    <td className="py-2 text-sm">{STOCK_CATEGORY_LABELS[item.category]}</td>
                    <td className="py-2 text-sm">
                      <span className="text-orange-600 font-semibold">{item.currentStock}</span> {item.unit}
                    </td>
                    <td className="py-2 text-sm">{item.reorderPoint} {item.unit}</td>
                    <td className="py-2 text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        ต่ำกว่าจุดสั่ง
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Items - Fabric */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">เนื้อผ้า</h2>
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <ArrowDown className="w-3 h-3" />
              <span>มาก → น้อย</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">รหัส</th>
                <th className="pb-2">ชื่อ</th>
                <th className="pb-2">คงเหลือ</th>
                <th className="pb-2">ราคาต้นทุน</th>
                <th className="pb-2">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {fabricItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 text-sm">{item.sku}</td>
                  <td className="py-2 text-sm font-medium">{item.name}</td>
                  <td className="py-2 text-sm">{item.currentStock} {item.unit}</td>
                  <td className="py-2 text-sm">{item.costPerUnit.toLocaleString("th-TH")} ฿/{item.unit}</td>
                  <td className="py-2 text-sm">
                    {(item.currentStock * item.costPerUnit).toLocaleString("th-TH")} ฿
                  </td>
                </tr>
              ))}
              {fabricItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    ยังไม่มีข้อมูลเนื้อผ้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Items - Others */}
      <div className="bg-white rounded-lg border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">สินค้าสิ้นเปลือก</h2>
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              แจ้งเตือนสินค้าใกล้หมด
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3" />
              <span>น้อย → มาก</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">รหัส</th>
                <th className="pb-2">ชื่อ</th>
                <th className="pb-2">หมวดหมู่</th>
                <th className="pb-2">คงเหลือ</th>
                <th className="pb-2">ราคาต้นทุน</th>
                <th className="pb-2">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {otherItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 text-sm">{item.sku}</td>
                  <td className="py-2 text-sm font-medium">{item.name}</td>
                  <td className="py-2 text-sm">{STOCK_CATEGORY_LABELS[item.category]}</td>
                  <td className="py-2 text-sm">
                    <span className={`font-semibold ${
                      item.currentStock <= item.reorderPoint ? "text-orange-600" : "text-gray-900"
                    }`}>
                      {item.currentStock}
                    </span> {item.unit}
                  </td>
                  <td className="py-2 text-sm">{item.costPerUnit.toLocaleString("th-TH")} ฿/{item.unit}</td>
                  <td className="py-2 text-sm">
                    {(item.currentStock * item.costPerUnit).toLocaleString("th-TH")} ฿
                  </td>
                </tr>
              ))}
              {otherItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                    ยังไม่มีข้อมูลสินค้าสิ้นเปลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">การเคลื่อนไหวล่าสุด</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">วันที่</th>
                <th className="pb-2">ประเภท</th>
                <th className="pb-2">รายการ</th>
                <th className="pb-2">จำนวน</th>
                <th className="pb-2">เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((movement) => (
                <tr key={movement.id} className="border-b">
                  <td className="py-2 text-sm">
                    {movement.movementDate.toLocaleDateString("th-TH")}
                  </td>
                  <td className="py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      movement.type === "in" ? "bg-green-100 text-green-700" :
                      movement.type === "out" ? "bg-red-100 text-red-700" :
                      movement.type === "adjustment" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {MOVEMENT_TYPE_LABELS[movement.type]}
                    </span>
                  </td>
                  <td className="py-2 text-sm font-medium">{movement.itemSnapshot.name}</td>
                  <td className="py-2 text-sm">
                    {movement.type === "in" || movement.type === "adjustment" ? "+" : "-"}
                    {movement.quantity} {movement.itemSnapshot.unit}
                  </td>
                  <td className="py-2 text-sm text-gray-500">{movement.reason}</td>
                </tr>
              ))}
              {recentMovements.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    ยังไม่มีการเคลื่อนไหว
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
