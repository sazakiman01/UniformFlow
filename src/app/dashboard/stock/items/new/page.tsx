"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { createStockItem } from "@/lib/stock-items";
import { StockCategory, STOCK_CATEGORY_LABELS } from "@/types";
import Link from "next/link";
import { canManageStock } from "@/types";
import { FABRIC_CATALOGS, getCatalogColors, generateSKU, groupColorsByFamily } from "@/data/fabric-catalogs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

export default function NewStockItemPage() {
  const router = useRouter();
  const { user, profile, loading, profileLoading } = useAuth();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [catalogCode, setCatalogCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "fabric" as StockCategory,
    unit: "",
    costPerUnit: "",
    sellingPrice: "",
    specifications: {
      size: "",
      brand: "",
      width: "",
    },
    supplier: {
      name: "",
      contact: "",
      phone: "",
    },
    reorderPoint: 0,
    minLevel: 0,
    maxLevel: 0,
    safetyStock: 0,
    currentStock: 0,
  });

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      if (!canManageStock(profile.role)) {
        router.push("/dashboard/stock");
      }
    }
  }, [loading, profileLoading, user, profile, router]);

  // Smart defaults: auto-fill unit based on category
  useEffect(() => {
    const categoryUnitMap: Record<StockCategory, string> = {
      fabric: "หลอ",
      zip: "ชิ้น",
      box: "ชิ้น",
      bag: "ชิ้น",
      pillow_filling: "กก.",
      tape: "ม้วน",
    };
    setFormData(prev => ({
      ...prev,
      unit: categoryUnitMap[formData.category] || "",
    }));
  }, [formData.category]);

  // Auto-generate SKU and name when catalog and color are selected
  useEffect(() => {
    if (catalogCode && colorCode) {
      const sku = generateSKU(catalogCode, colorCode);
      const catalog = FABRIC_CATALOGS.find(c => c.code === catalogCode);
      const color = catalog?.colors.find(c => c.code === colorCode);
      
      setFormData(prev => ({
        ...prev,
        sku,
        name: catalog && color ? `${catalog.name} - ${color.name}` : prev.name,
      }));
    }
  }, [catalogCode, colorCode]);

  const handleCatalogChange = (value: string) => {
    setCatalogCode(value);
    setColorCode(""); // Reset color when catalog changes
    setSearchValue(""); // Reset search when catalog changes
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      setLoadingSubmit(true);

      const itemData = {
        ...formData,
        costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : 0,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
        specifications: {
          size: formData.specifications.size || undefined,
          brand: formData.specifications.brand || undefined,
          width: formData.specifications.width ? parseFloat(formData.specifications.width) : undefined,
        },
        supplier: formData.supplier.name ? {
          name: formData.supplier.name,
          contact: formData.supplier.contact || undefined,
          phone: formData.supplier.phone || undefined,
        } : undefined,
        catalogCode: catalogCode || undefined,
        catalogName: catalogCode ? FABRIC_CATALOGS.find(c => c.code === catalogCode)?.name : undefined,
        colorCode: colorCode || undefined,
        colorName: colorCode ? FABRIC_CATALOGS.find(c => c.code === catalogCode)?.colors.find(c => c.code === colorCode)?.name : undefined,
        hexColor: colorCode ? FABRIC_CATALOGS.find(c => c.code === catalogCode)?.colors.find(c => c.code === colorCode)?.hex : undefined,
        createdBy: profile.id,
      };

      await createStockItem(itemData);
      router.push("/dashboard/stock");
    } catch (error) {
      console.error("Error creating stock item:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มรายการ");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading || profileLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/stock"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มรายการวัตถุดิบใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ข้อมูลพื้นฐาน</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสสินค้า (SKU) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 80000-888"
                readOnly={!!(catalogCode && colorCode)}
              />
              {catalogCode && colorCode && (
                <p className="text-xs text-gray-500 mt-1">Auto-generated จากแคตตาล็อกและรหัสสี</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น ผ้านวม ไมโครบ.14"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as StockCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STOCK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หน่วยวัด <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกหน่วยวัด</option>
                <option value="หลอ">หลอ</option>
                <option value="ม้วน">ม้วน</option>
                <option value="ชิ้น">ชิ้น</option>
                <option value="กก.">กก.</option>
                <option value="เมตร">เมตร</option>
                <option value="ยard">ยard</option>
                <option value="แผ่น">แผ่น</option>
                <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
              </select>
              {formData.unit === "อื่นๆ" && (
                <input
                  type="text"
                  required
                  value={formData.unit === "อื่นๆ" ? "" : formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ระบุหน่วยวัด"
                />
              )}
            </div>

            {/* Fabric Catalog & Color Code - Fabric Only */}
            {formData.category === 'fabric' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แคตตาล็อกผ้า
                  </label>
                  <Select
                    value={catalogCode}
                    onValueChange={handleCatalogChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกแคตตาล็อกผ้า (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {FABRIC_CATALOGS.map(catalog => (
                        <SelectItem key={catalog.code} value={catalog.code}>
                          {catalog.code} - {catalog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สีผ้า
                  </label>
                  <Select
                    value={colorCode}
                    onValueChange={setColorCode}
                    disabled={!catalogCode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกสีผ้า (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent
                      searchPlaceholder="ค้นหารหัสสี, ชื่อสี, หรือ hex code..."
                      onSearchChange={handleSearchChange}
                    >
                      {searchValue ? (
                        // Show filtered results without grouping when searching
                        getCatalogColors(catalogCode)
                          .filter(color => {
                            const searchLower = searchValue.toLowerCase();
                            return (
                              color.code.toLowerCase().includes(searchLower) ||
                              color.name.toLowerCase().includes(searchLower) ||
                              color.hex.toLowerCase().includes(searchLower)
                            );
                          })
                          .map(color => (
                            <SelectItem key={color.code} value={color.code}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.code} - {color.name}</span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        // Show grouped results when not searching
                        Object.entries(groupColorsByFamily(catalogCode)).map(([family, { label, colors: familyColors }]) => (
                          <SelectGroup key={family}>
                            <SelectLabel>{label}</SelectLabel>
                            {familyColors.map(color => (
                              <SelectItem key={color.code} value={color.code}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <span>{color.code} - {color.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {colorCode && (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded border border-gray-300"
                        style={{
                          backgroundColor: getCatalogColors(catalogCode).find(c => c.code === colorCode)?.hex || "#000000",
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600">
                          {getCatalogColors(catalogCode).find(c => c.code === colorCode)?.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          Color Code: {getCatalogColors(catalogCode).find(c => c.code === colorCode)?.hex}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ราคา</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคาต้นทุนต่อหน่วย (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคาขายต่อหน่วย (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">สเปก</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด</label>
              <input
                type="text"
                value={formData.specifications.size}
                onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, size: e.target.value } })}
                placeholder="เช่น XL, M, 44"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
              <input
                type="text"
                value={formData.specifications.brand}
                onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, brand: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความกว้าง (นิ้ว)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.specifications.width}
                  onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, width: e.target.value } })}
                  placeholder="0.0"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">นิ้ว</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ผู้ผลิต/ซัพพลายเออร์</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
              <input
                type="text"
                value={formData.supplier.name}
                onChange={(e) => setFormData({ ...formData, supplier: { ...formData.supplier, name: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ข้อมูลติดต่อ</label>
              <input
                type="text"
                value={formData.supplier.contact}
                onChange={(e) => setFormData({ ...formData, supplier: { ...formData.supplier, contact: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
              <input
                type="text"
                value={formData.supplier.phone}
                onChange={(e) => setFormData({ ...formData, supplier: { ...formData.supplier, phone: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stock Levels */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ระดับสต็อก</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยอดคงเหลือเริ่มต้น <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จุดสั่งซื้อใหม่ (Reorder Point) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">ยอดคงเหลือที่ต่ำกว่านี้จะแจ้งเตือนให้สั่งซื้อ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ระดับต่ำสุด</label>
              <input
                type="number"
                min="0"
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสูงสุด</label>
              <input
                type="number"
                min="0"
                value={formData.maxLevel}
                onChange={(e) => setFormData({ ...formData, maxLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">สต็อกสำรอง (Safety Stock)</label>
              <input
                type="number"
                min="0"
                value={formData.safetyStock}
                onChange={(e) => setFormData({ ...formData, safetyStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">ยอดสต็อกขั้นต่ำสำหรับกรณีฉุกเฉิน</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href="/dashboard/stock"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loadingSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSubmit ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                บันทึก...
              </span>
            ) : (
              "บันทึก"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
