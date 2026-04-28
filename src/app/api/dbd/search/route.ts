import { NextRequest, NextResponse } from "next/server";

const DBD_API_BASE = "https://opendata.dbd.go.th/th/api/3/action/datastore_search";
const DBD_RESOURCE_ID = "f008dbbf-ddfa-4e3a-bac4-358a1a2b9853";
const PAGE_SIZE = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedRecords: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 ชั่วโมง

/**
 * ดึงข้อมูลทั้งหมดจาก DBD API แบบ paginated แล้ว cache ไว้
 */
async function getAllRecords() {
  // ใช้ cache ถ้ายังไม่หมดอายุ
  if (cachedRecords && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRecords;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRecords: any[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = new URL(DBD_API_BASE);
    url.searchParams.append("resource_id", DBD_RESOURCE_ID);
    url.searchParams.append("limit", PAGE_SIZE.toString());
    url.searchParams.append("offset", offset.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("DBD API error:", response.status, response.statusText);
      break;
    }

    const data = await response.json();
    if (!data.success || !data.result?.records) break;

    allRecords.push(...data.result.records);
    total = data.result.total;
    offset += PAGE_SIZE;
  }

  cachedRecords = allRecords;
  cacheTimestamp = Date.now();
  return allRecords;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query || query.length < 3) {
    return NextResponse.json({ success: false, result: { records: [], total: 0 } });
  }

  try {
    const allRecords = await getAllRecords();
    const queryLower = query.toLowerCase();

    // filter ด้วย includes (partial match)
    const filtered = allRecords.filter((r) =>
      r["ชื่อนิติบุคคล"]?.toLowerCase().includes(queryLower)
    );

    // เรียงลำดับ: ชื่อที่มี query อยู่ข้างหน้ามาก่อน
    filtered.sort((a, b) => {
      const aIdx = a["ชื่อนิติบุคคล"]?.toLowerCase().indexOf(queryLower) ?? 999;
      const bIdx = b["ชื่อนิติบุคคล"]?.toLowerCase().indexOf(queryLower) ?? 999;
      return aIdx - bIdx;
    });

    const records = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      result: { records, total: filtered.length },
    });
  } catch (error) {
    console.error("Error calling DBD API:", error);
    return NextResponse.json({ success: false, result: { records: [], total: 0 } });
  }
}
