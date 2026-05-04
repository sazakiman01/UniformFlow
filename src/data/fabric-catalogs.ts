import { FabricCatalog, StockCategory } from "@/types";

export const FABRIC_CATALOGS: FabricCatalog[] = [
  {
    id: "mock-80000",
    code: "80000",
    name: "ผ้าโทเรบิสคอบ",
    category: "fabric" as StockCategory,
    colors: [
      { code: "G", name: "จี", hex: "#5C636A", colorFamily: "gray" },
      { code: "Q", name: "คิว", hex: "#4A5D5E", colorFamily: "gray" },
      { code: "V", name: "วี", hex: "#4A80B4", colorFamily: "blue" },
      { code: "75", name: "-", hex: "#E2D9C8", colorFamily: "light" },
      { code: "76", name: "-", hex: "#A09F9C", colorFamily: "gray" },
      { code: "78", name: "-", hex: "#C21460", colorFamily: "red" },
      { code: "79", name: "-", hex: "#2F3E4F", colorFamily: "gray" },
      { code: "80", name: "-", hex: "#0E5935", colorFamily: "green" },
      { code: "81", name: "-", hex: "#C95A1E", colorFamily: "orange" },
      { code: "82", name: "-", hex: "#B31B1B", colorFamily: "red" },
      { code: "83", name: "-", hex: "#1A1F3B", colorFamily: "gray" },
      { code: "84", name: "ตำรวจ", hex: "#4A403E", colorFamily: "brown" },
      { code: "44", name: "-", hex: "#005F4B", colorFamily: "green" },
      { code: "33", name: "-", hex: "#3EB489", colorFamily: "green" },
      { code: "22", name: "-", hex: "#65B35C", colorFamily: "green" },
      { code: "25", name: "-", hex: "#6B94B6", colorFamily: "blue" },
      { code: "144", name: "-", hex: "#92B4D2", colorFamily: "blue" },
      { code: "50", name: "-", hex: "#88A5D4", colorFamily: "blue" },
      { code: "28", name: "-", hex: "#6188C0", colorFamily: "blue" },
      { code: "28A", name: "-", hex: "#5C78B7", colorFamily: "blue" },
      { code: "34", name: "-", hex: "#007BB2", colorFamily: "blue" },
      { code: "47", name: "-", hex: "#341852", colorFamily: "purple" },
      { code: "48", name: "-", hex: "#474B92", colorFamily: "purple" },
      { code: "49", name: "-", hex: "#8972A5", colorFamily: "purple" },
      { code: "11", name: "-", hex: "#1B65A6", colorFamily: "blue" },
      { code: "11A", name: "-", hex: "#134E8A", colorFamily: "blue" },
      { code: "85A", name: "-", hex: "#005696", colorFamily: "blue" },
      { code: "35A", name: "-", hex: "#133261", colorFamily: "blue" },
      { code: "I", name: "ไอ", hex: "#464646", colorFamily: "gray" },
      { code: "J", name: "เจ", hex: "#2C2C2C", colorFamily: "gray" },
      { code: "53", name: "-", hex: "#C24A3B", colorFamily: "red" },
      { code: "56", name: "-", hex: "#9A3F23", colorFamily: "orange" },
      { code: "59", name: "-", hex: "#AC945D", colorFamily: "yellow" },
      { code: "57", name: "พระราช", hex: "#B0741A", colorFamily: "yellow" },
      { code: "8", name: "แก่นขนุน", hex: "#855325", colorFamily: "yellow" },
      { code: "74", name: "-", hex: "#851221", colorFamily: "red" },
      { code: "19", name: "-", hex: "#302624", colorFamily: "gray" },
      { code: "60", name: "-", hex: "#3E4240", colorFamily: "gray" },
      { code: "9", name: "-", hex: "#8F1221", colorFamily: "red" },
      { code: "63", name: "แก่นในวัง", hex: "#855E24", colorFamily: "yellow" },
      { code: "29", name: "-", hex: "#BA1A23", colorFamily: "red" },
      { code: "10", name: "-", hex: "#5C1523", colorFamily: "red" },
      { code: "145", name: "-", hex: "#DDA2B8", colorFamily: "pink" },
      { code: "62", name: "-", hex: "#D8829D", colorFamily: "pink" },
      { code: "125", name: "-", hex: "#A8488E", colorFamily: "purple" },
      { code: "16", name: "-", hex: "#0A3D31", colorFamily: "green" },
      { code: "40", name: "-", hex: "#66AFA6", colorFamily: "green" },
      { code: "40A", name: "-", hex: "#6EB2A9", colorFamily: "green" },
      { code: "S1T", name: "-", hex: "#A3A6C4", colorFamily: "light" },
      { code: "26", name: "-", hex: "#667B8A", colorFamily: "light" },
      { code: "43", name: "-", hex: "#8C9CA8", colorFamily: "light" },
      { code: "30", name: "-", hex: "#81839C", colorFamily: "light" },
      { code: "L", name: "แอล", hex: "#748B9E", colorFamily: "light" },
      { code: "17", name: "-", hex: "#75867A", colorFamily: "green" },
      { code: "120", name: "-", hex: "#889C91", colorFamily: "green" },
      { code: "12", name: "-", hex: "#16406D", colorFamily: "blue" },
      { code: "12A", name: "-", hex: "#123257", colorFamily: "blue" },
      { code: "7", name: "-", hex: "#4F443D", colorFamily: "gray" },
      { code: "14", name: "-", hex: "#726661", colorFamily: "gray" },
      { code: "130", name: "-", hex: "#828282", colorFamily: "gray" },
      { code: "58", name: "-", hex: "#888086", colorFamily: "gray" },
      { code: "54", name: "-", hex: "#C4C6C8", colorFamily: "light" },
      { code: "18", name: "-", hex: "#D8D6C9", colorFamily: "light" },
      { code: "37A", name: "-", hex: "#B67D6F", colorFamily: "orange" },
      { code: "52", name: "-", hex: "#B3C126", colorFamily: "yellow" },
      { code: "23", name: "-", hex: "#C2A732", colorFamily: "yellow" },
      { code: "37", name: "-", hex: "#B87317", colorFamily: "yellow" },
      { code: "888", name: "-", hex: "#ADCFF2", colorFamily: "blue" },
      { code: "1", name: "-", hex: "#BBD2F6", colorFamily: "blue" },
      { code: "2", name: "ดำ", hex: "#111111", colorFamily: "gray" },
      { code: "3", name: "กรมเข้ม", hex: "#131A2A", colorFamily: "gray" },
      { code: "4", name: "กรม", hex: "#15223A", colorFamily: "gray" },
      { code: "24", name: "เทาเข้ม", hex: "#212B38", colorFamily: "gray" },
      { code: "5", name: "-", hex: "#1C234F", colorFamily: "gray" },
      { code: "61", name: "-", hex: "#1B459B", colorFamily: "blue" },
      { code: "6", name: "-", hex: "#3A606A", colorFamily: "green" },
      { code: "21", name: "-", hex: "#2E4B65", colorFamily: "blue" },
      { code: "27", name: "-", hex: "#3E5B6D", colorFamily: "gray" },
      { code: "20", name: "-", hex: "#6B8789", colorFamily: "green" },
      { code: "35", name: "-", hex: "#657D84", colorFamily: "light" },
      { code: "31", name: "-", hex: "#6B7B87", colorFamily: "light" },
    ],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getFabricCatalogs(): FabricCatalog[] {
  return FABRIC_CATALOGS;
}

export function getCatalogColors(catalogCode: string) {
  const catalog = FABRIC_CATALOGS.find(c => c.code === catalogCode);
  return catalog?.colors || [];
}

export function generateSKU(catalogCode: string, colorCode: string): string {
  return `${catalogCode}-${colorCode}`;
}

export function groupColorsByFamily(catalogCode: string) {
  const colors = getCatalogColors(catalogCode);
  const groups: Record<string, typeof colors> = {
    blue: [],
    gray: [],
    green: [],
    red: [],
    purple: [],
    yellow: [],
    orange: [],
    pink: [],
    brown: [],
    light: [],
  };

  colors.forEach((color) => {
    const family = color.colorFamily || 'light';
    if (groups[family]) {
      groups[family].push(color);
    } else {
      groups.light.push(color);
    }
  });

  // Filter out empty groups
  const result: Record<string, { label: string; colors: typeof colors }> = {};
  const labels: Record<string, string> = {
    blue: '🔵 สีน้ำเงิน/ฟ้า',
    gray: '⚫ สีเทา/ดำ/เนื้อ',
    green: '🟢 สีเขียว',
    red: '🔴 สีแดง/ส้ม',
    purple: '🟣 สีม่วง/บานเย็น',
    yellow: '🟡 สีเหลือง/ทอง',
    orange: '🟠 สีส้ม/น้ำตาล',
    pink: '🩷 สีชมพู',
    brown: '🟤 สีน้ำตาล',
    light: '🩶 สีฟ้าอ่อน/เทาอ่อน',
  };

  Object.keys(groups).forEach((family) => {
    if (groups[family].length > 0) {
      result[family] = {
        label: labels[family] || family,
        colors: groups[family],
      };
    }
  });

  return result;
}
