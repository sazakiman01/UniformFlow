"use client";

import { useState, useEffect } from "react";
import { StockCategory, FabricColor } from "@/types";
import { getFabricCatalogs, getCatalogColors, groupColorsByFamily } from "@/data/fabric-catalogs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

interface ColorCatalogPickerProps {
  category?: StockCategory;
  catalogCode?: string;
  colorCode?: string;
  onCatalogChange: (code: string) => void;
  onColorChange: (code: string) => void;
  disabled?: boolean;
}

interface FabricCatalog {
  code: string;
  name: string;
  category: StockCategory;
  colors: FabricColor[];
}

export default function ColorCatalogPicker({
  category = "fabric",
  catalogCode = "",
  colorCode = "",
  onCatalogChange,
  onColorChange,
  disabled = false,
}: ColorCatalogPickerProps) {
  const [catalogs, setCatalogs] = useState<FabricCatalog[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    // TODO: เปลี่ยนไปดึงจาก Firestore แทน hardcode
    const allCatalogs = getFabricCatalogs();
    setCatalogs(allCatalogs);
  }, []);

  const handleCatalogChange = (newCatalogCode: string) => {
    onCatalogChange(newCatalogCode);
    onColorChange(""); // Reset color when catalog changes
    setSearchValue(""); // Reset search when catalog changes
  };

  const handleColorChange = (newColorCode: string) => {
    onColorChange(newColorCode);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // แสดงเฉพาะเมื่อ category เป็น fabric
  if (category !== "fabric") {
    return null;
  }

  const colors = getCatalogColors(catalogCode);
  const selectedColor = colors.find((c) => c.code === colorCode);

  // Filter colors based on search value
  const filteredColors = colors.filter((color) => {
    const searchLower = searchValue.toLowerCase();
    return (
      color.code.toLowerCase().includes(searchLower) ||
      color.name.toLowerCase().includes(searchLower) ||
      color.hex.toLowerCase().includes(searchLower)
    );
  });

  // Group filtered colors by family
  const colorGroups = groupColorsByFamily(catalogCode);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          แคตตาล็อกผ้า
        </label>
        <Select value={catalogCode} onValueChange={handleCatalogChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="เลือกแคตตาล็อกผ้า (ไม่บังคับ)" />
          </SelectTrigger>
          <SelectContent>
            {catalogs.map((catalog) => (
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
          onValueChange={handleColorChange}
          disabled={!catalogCode || disabled}
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
              filteredColors.map((color) => (
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
              Object.entries(colorGroups).map(([family, { label, colors: familyColors }]) => (
                <SelectGroup key={family}>
                  <SelectLabel>{label}</SelectLabel>
                  {familyColors.map((color) => (
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
        {selectedColor && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">{selectedColor.name}</span>
              <span className="text-xs text-gray-400">Color Code: {selectedColor.hex}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
