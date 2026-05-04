"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Plus, Edit2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { canManageStock } from "@/types";
import { getFabricCatalogs, createFabricCatalog, updateFabricCatalog, deleteFabricCatalog } from "@/lib/fabric-catalogs";
import { FabricCatalog, FabricColor, StockCategory, STOCK_CATEGORY_LABELS } from "@/types";
import ColorExtractor from "@/components/stock/ColorExtractor";

export default function ColorCatalogsPage() {
  const router = useRouter();
  const { user, profile, loading, profileLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [catalogs, setCatalogs] = useState<FabricCatalog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<FabricCatalog | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showColorExtractorModal, setShowColorExtractorModal] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [colorSearchQuery, setColorSearchQuery] = useState("");
  const [editingColorDetailIndex, setEditingColorDetailIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "fabric" as StockCategory,
    colors: [] as FabricColor[],
  });

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      if (!canManageStock(profile.role)) {
        router.push("/dashboard/stock");
      } else {
        loadCatalogs();
      }
    }
  }, [loading, profileLoading, user, profile, router]);

  const loadCatalogs = async () => {
    try {
      setLoadingData(true);
      const data = await getFabricCatalogs();
      setCatalogs(data);
    } catch (error) {
      console.error("Error loading catalogs:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateNew = () => {
    setEditingCatalog(null);
    setFormData({
      code: "",
      name: "",
      category: "fabric" as StockCategory,
      colors: [],
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleEdit = (catalog: FabricCatalog) => {
    setEditingCatalog(catalog);
    setFormData({
      code: catalog.code,
      name: catalog.name,
      category: catalog.category,
      colors: catalog.colors,
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบแคตตาล็อกนี้ใช่ไหม?")) return;

    try {
      await deleteFabricCatalog(id);
      await loadCatalogs();
    } catch (error) {
      console.error("Error deleting catalog:", error);
      alert("เกิดข้อผิดพลาดในการลบแคตตาล็อก");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      if (editingCatalog) {
        await updateFabricCatalog(editingCatalog.id, formData);
      } else {
        await createFabricCatalog({
          ...formData,
          createdBy: user!.uid,
        });
      }
      setHasUnsavedChanges(false);
      setShowModal(false);
      await loadCatalogs();
    } catch (error) {
      console.error("Error saving catalog:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกแคตตาล็อก");
    }
  };

  const handleAddColor = () => {
    setFormData(prev => {
      const newColors = [...prev.colors, { code: "", name: "", hex: "#000000" }];
      // Open detail modal for the new color
      setEditingColorDetailIndex(newColors.length - 1);
      return { ...prev, colors: newColors };
    });
    setHasUnsavedChanges(true);
  };

  const handleColorChange = (index: number, field: keyof FabricColor, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) =>
        i === index ? { ...color, [field]: value } : color
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteColor = (index: number) => {
    if (!confirm("ต้องการลบสีนี้ใช่ไหม?")) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
    setEditingColorDetailIndex(null);
  };

  const handleOpenColorExtractor = (index: number) => {
    setEditingColorIndex(index);
    setShowColorExtractorModal(true);
  };

  const handleCloseColorExtractor = () => {
    setShowColorExtractorModal(false);
    setEditingColorIndex(null);
  };

  const handleColorExtractorAdd = (hexColors: string[]) => {
    if (editingColorIndex !== null && hexColors.length > 0) {
      setFormData(prev => ({
        ...prev,
        colors: prev.colors.map((color, i) =>
          i === editingColorIndex ? { ...color, hex: hexColors[0] } : color
        ),
      }));
      setHasUnsavedChanges(true);
      handleCloseColorExtractor();
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/stock" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปหน้าสต็อก
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">จัดการแคตตาล็อกวัตถุดิบ</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">แคตตาล็อกวัตถุดิบ</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มแคตตาล็อก
            </button>
          </div>
        </div>

        {loadingData ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    รหัสแคตตาล็อก
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ชื่อผ้า
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    หมวดหมู่
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    จำนวนสี
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    สร้างเมื่อ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {catalogs.map((catalog) => (
                  <tr key={catalog.id}>
                    <td className="px-4 py-3 text-sm">{catalog.code}</td>
                    <td className="px-4 py-3 text-sm">{catalog.name}</td>
                    <td className="px-4 py-3 text-sm">{STOCK_CATEGORY_LABELS[catalog.category]}</td>
                    <td className="px-4 py-3 text-sm">{catalog.colors.length}</td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        const date = catalog.createdAt;
                        if (!date) return "-";
                        try {
                          let parsedDate: Date;
                          if (date instanceof Date) {
                            parsedDate = date;
                          } else {
                            const firebaseTimestamp = date as { toDate: () => Date } | string | number;
                            if (typeof firebaseTimestamp === "object" && firebaseTimestamp !== null && "toDate" in firebaseTimestamp) {
                              // Firebase Timestamp
                              parsedDate = firebaseTimestamp.toDate();
                            } else {
                              parsedDate = new Date(firebaseTimestamp as string | number);
                            }
                          }
                          if (isNaN(parsedDate.getTime())) return "-";
                          return parsedDate.toLocaleDateString("th-TH");
                        } catch {
                          return "-";
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(catalog)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(catalog.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {catalogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      ไม่มีแคตตาล็อก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold">
                {editingCatalog ? "แก้ไขแคตตาล็อก" : "เพิ่มแคตตาล็อกใหม่"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสแคตตาล็อก
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อวัตถุดิบ
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as StockCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fabric">ผ้า</option>
                  <option value="zip">ซิป</option>
                  <option value="box">กล่อง</option>
                  <option value="bag">ถุง</option>
                  <option value="pillow_filling">ใย/นุ่น</option>
                  <option value="tape">เทป</option>
                </select>
              </div>

              {/* Color Extractor - Inside form for better UX flow */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎨 เลือกสีจากรูป
                </label>
                <ColorExtractor
                  onColorsAdd={(hexColors) => {
                    // Add all picked colors
                    const newColors: FabricColor[] = hexColors.map(hex => ({
                      code: "",
                      name: "",
                      hex: hex,
                    }));
                    setFormData({
                      ...formData,
                      colors: [...formData.colors, ...newColors],
                    });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      สีวัตถุดิบ <span className="text-gray-500 font-normal">({formData.colors.length} สี)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">คลิกที่สีเพื่อแก้ไข หรือเพิ่มสีใหม่</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มสี
                  </button>
                </div>

                {/* Search */}
                {formData.colors.length > 0 && (
                  <input
                    type="text"
                    placeholder="🔍 ค้นหาสี (HEX, รหัส, ชื่อสี)"
                    value={colorSearchQuery}
                    onChange={(e) => setColorSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
                  />
                )}

                {/* Compact Grid */}
                {formData.colors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีสีวัตถุดิบ คลิก &ldquo;+ เพิ่มสี&rdquo; หรือ &ldquo;เลือกสีจากรูป&rdquo; เพื่อเริ่ม</p>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2">
                    {formData.colors.map((color, index) => {
                      const q = colorSearchQuery.trim().toLowerCase();
                      const matches = !q || color.hex.toLowerCase().includes(q) || color.code.toLowerCase().includes(q) || color.name.toLowerCase().includes(q);
                      if (!matches) return null;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditingColorDetailIndex(index)}
                          className="group flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-gray-100 transition"
                          title={`${color.hex}${color.code ? ` (${color.code})` : ""}${color.name ? ` - ${color.name}` : ""}`}
                        >
                          <div
                            className="w-12 h-12 rounded-md border border-gray-300 group-hover:ring-2 group-hover:ring-blue-400"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="flex flex-col items-center gap-0.5 w-full">
                            {color.code && (
                              <span className="text-[10px] font-medium text-gray-700 truncate w-full text-center">
                                {color.code}
                              </span>
                            )}
                            {color.name && (
                              <span className="text-[9px] text-gray-500 truncate w-full text-center">
                                {color.name}
                              </span>
                            )}
                            {!color.code && !color.name && (
                              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                                {color.hex.slice(1, 7).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky bottom-0">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (!confirm("มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการปิดใช่ไหม?")) {
                          return;
                        }
                      }
                      setShowModal(false);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Detail Edit Modal */}
      {editingColorDetailIndex !== null && formData.colors[editingColorDetailIndex] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">แก้ไขสี</h3>
              <button
                type="button"
                onClick={() => setEditingColorDetailIndex(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Color Picker Row */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.colors[editingColorDetailIndex].hex}
                  onChange={(e) => handleColorChange(editingColorDetailIndex, "hex", e.target.value)}
                  className="w-16 h-16 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">รหัสสี (HEX)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น #FF0000"
                      value={formData.colors[editingColorDetailIndex].hex}
                      onChange={(e) => handleColorChange(editingColorDetailIndex, "hex", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenColorExtractor(editingColorDetailIndex)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap"
                    >
                      เลือกจากรูป
                    </button>
                  </div>
                </div>
              </div>
              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">รหัสสี (ตัวย่อ) <span className="text-gray-400">- ไม่บังคับ</span></label>
                  <input
                    type="text"
                    placeholder="เช่น R, G, B"
                    value={formData.colors[editingColorDetailIndex].code}
                    onChange={(e) => handleColorChange(editingColorDetailIndex, "code", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ชื่อสี <span className="text-gray-400">- ไม่บังคับ</span></label>
                  <input
                    type="text"
                    placeholder="เช่น แดง, น้ำเงิน"
                    value={formData.colors[editingColorDetailIndex].name}
                    onChange={(e) => handleColorChange(editingColorDetailIndex, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => handleDeleteColor(editingColorDetailIndex)}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                ลบสีนี้
              </button>
              <button
                type="button"
                onClick={() => setEditingColorDetailIndex(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ColorExtractor Modal for Editing Existing Color */}
      {showColorExtractorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">เลือกสีจากรูป</h3>
              <button
                type="button"
                onClick={handleCloseColorExtractor}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ColorExtractor
                onColorsAdd={handleColorExtractorAdd}
                maxColors={1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
