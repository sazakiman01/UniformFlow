import { NextRequest, NextResponse } from "next/server";

const DBD_API_BASE = "https://opendata.dbd.go.th/th/api/3/action/datastore_search";
const DBD_RESOURCE_ID = "f008dbbf-ddfa-4e3a-bac4-358a1a2b9853";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") || "5";

  if (!query || query.length < 3) {
    return NextResponse.json({ success: false, result: { records: [], total: 0 } });
  }

  try {
    const url = new URL(DBD_API_BASE);
    url.searchParams.append("resource_id", DBD_RESOURCE_ID);
    url.searchParams.append("q", query);
    url.searchParams.append("limit", limit);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("DBD API error:", response.status, response.statusText);
      return NextResponse.json({ success: false, result: { records: [], total: 0 } });
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling DBD API:", error);
    return NextResponse.json({ success: false, result: { records: [], total: 0 } });
  }
}
