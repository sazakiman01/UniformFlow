/**
 * DBD Open Data API Integration
 * สำหรับค้นหาข้อมูลนิติบุคคลจากกรมพัฒนาธุรกิจการค้า
 */

import Fuse from "fuse.js";

export interface DBDCompany {
  เลขทะเบียน: string;
  ชื่อนิติบุคคล: string;
  ที่ตั้งสำนักงานใหญ่: string;
  ตำบล: string;
  อำเภอ: string;
  จังหวัด: string;
  รหัสไปรษณีย์: string;
}

export interface DBDSearchResponse {
  success: boolean;
  result: {
    records: DBDCompany[];
    total: number;
  };
}

const DBD_API_ROUTE = "/api/dbd/search";

/**
 * ค้นหาข้อมูลนิติบุคคลจาก DBD API (ผ่าน Next.js API Route proxy เพื่อ bypass CORS)
 * @param query ชื่อบริษัทที่ต้องการค้นหา (ถ้าไม่ระบุจะดึงข้อมูลทั้งหมด)
 * @param limit จำนวนผลลัพธ์สูงสุด (default: 100)
 * @returns Array ของข้อมูลนิติบุคคลที่ตรงกับการค้นหา
 */
export async function searchDBDCompany(
  query: string,
  limit: number = 20
): Promise<DBDCompany[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const url = new URL(DBD_API_ROUTE, window.location.origin);
    url.searchParams.append("q", query.trim());
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("DBD API error:", response.status, response.statusText);
      return [];
    }

    const data: DBDSearchResponse = await response.json();

    if (!data.success || !data.result?.records) {
      return [];
    }

    return data.result.records;
  } catch (error) {
    console.error("Error calling DBD API:", error);
    return [];
  }
}

/**
 * ค้นหาข้อมูลนิติบุคคลจาก DBD API (รองรับ partial match เช่น "ไลอ" → "ไลออน")
 * ใช้ SQL LIKE ฝั่ง server ผ่าน API route
 * @param query ชื่อบริษัทที่ต้องการค้นหา (ต้องมีอย่างน้อย 3 ตัวอักษร)
 * @param limit จำนวนผลลัพธ์สูงสุด (default: 10)
 * @returns Array ของข้อมูลนิติบุคคลที่ตรงกับการค้นหา
 */
export async function searchDBDCompanyFuzzy(
  query: string,
  limit: number = 10
): Promise<DBDCompany[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  // ใช้ searchDBDCompany ตรงๆ — API route จะจัดการ SQL LIKE ให้
  return searchDBDCompany(query.trim(), limit);
}

/**
 * Map ข้อมูลจาก DBD API ไปยัง format ของ UniformFlow
 * @param dbdCompany ข้อมูลจาก DBD API
 * @returns Object ที่ map แล้วสำหรับใช้ใน UniformFlow
 */
export function mapDBDCompanyToUniformFlow(dbdCompany: DBDCompany) {
  return {
    name: dbdCompany.ชื่อนิติบุคคล,
    taxId: dbdCompany.เลขทะเบียน,
    address: {
      street: dbdCompany.ที่ตั้งสำนักงานใหญ่,
      district: dbdCompany.ตำบล,
      subdistrict: dbdCompany.อำเภอ,
      province: dbdCompany.จังหวัด,
      postcode: dbdCompany.รหัสไปรษณีย์,
      fullAddress: [
        dbdCompany.ที่ตั้งสำนักงานใหญ่,
        dbdCompany.ตำบล,
        dbdCompany.อำเภอ,
        dbdCompany.จังหวัด,
        dbdCompany.รหัสไปรษณีย์,
      ]
        .filter(Boolean)
        .join(" "),
    },
  };
}
