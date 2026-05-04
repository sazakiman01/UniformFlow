"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { listStockMovements } from "@/lib/stock-movements";
import { StockMovement, MOVEMENT_TYPE_LABELS } from "@/types";

export default function StockMovementsPage() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      loadData();
    }
  }, [loading, profileLoading, user, profile]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const data = await listStockMovements(100);
      setMovements(data);
    } catch (error) {
      console.error("Error loading stock movements:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการเคลื่อนไหวสต็อก</h1>
          <p className="text-gray-500 mt-1">ดูประวัติการรับ-ส่งวัตถุดิบทั้งหมด</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">วันที่</th>
                <th className="px-4 py-3 font-medium">ประเภท</th>
                <th className="px-4 py-3 font-medium">รายการ</th>
                <th className="px-4 py-3 font-medium">จำนวน</th>
                <th className="px-4 py-3 font-medium">ราคาต้นทุน</th>
                <th className="px-4 py-3 font-medium">มูลค่ารวม</th>
                <th className="px-4 py-3 font-medium">เหตุผล</th>
                <th className="px-4 py-3 font-medium">ผู้ทำ</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {movement.movementDate.toLocaleString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      movement.type === "in" ? "bg-green-100 text-green-700" :
                      movement.type === "out" ? "bg-red-100 text-red-700" :
                      movement.type === "adjustment" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {movement.type === "in" && <ArrowDown className="w-3 h-3" />}
                      {movement.type === "out" && <ArrowUp className="w-3 h-3" />}
                      {MOVEMENT_TYPE_LABELS[movement.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {movement.itemSnapshot.name}
                    <div className="text-gray-500 text-xs">{movement.itemSnapshot.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-semibold ${
                      movement.type === "in" || movement.type === "adjustment" ? "text-green-600" :
                      movement.type === "out" ? "text-red-600" :
                      "text-blue-600"
                    }`}>
                      {movement.type === "in" || movement.type === "adjustment" ? "+" : "-"}
                      {movement.quantity}
                    </span> {movement.itemSnapshot.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {movement.costPerUnit.toLocaleString("th-TH")} ฿/{movement.itemSnapshot.unit}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {movement.totalCost.toLocaleString("th-TH")} ฿
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {movement.reason}
                    {movement.referenceNumber && (
                      <div className="text-xs">Ref: {movement.referenceNumber}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {movement.createdByName || movement.createdBy}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-12 h-12 text-gray-300" />
                      <p>ยังไม่มีประวัติการเคลื่อนไหว</p>
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
