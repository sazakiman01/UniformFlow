"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { parseCSV, toCSV } from "@/lib/csv";
import { mapRowsToImport, importCustomers, type ImportRow, type ImportResult } from "@/lib/customer-import";
import { useAuth } from "@/contexts/AuthContext";

export default function ImportCustomersPage() {
  const { user, canManageFinance } = useAuth();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = parseCSV(text);
        if (parsed.headers.length === 0) {
          alert("ไฟล์ CSV ว่างเปล่า หรืออ่านไม่ได้");
          return;
        }
        const mapped = mapRowsToImport(parsed.rows);
        setRows(mapped);
      } catch (err) {
        console.error(err);
        alert("อ่านไฟล์ไม่สำเร็จ: " + (err as Error).message);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!rows || !user) return;
    if (!confirm(`จะเพิ่มลูกค้า ${rows.filter((r) => r.willImport).length} ราย ดำเนินการต่อ?`)) return;
    setImporting(true);
    try {
      const res = await importCustomers(rows, user.uid);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Import ล้มเหลว: " + (e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = toCSV(
      ["ชื่อลูกค้า", "ประเภท", "เลขประจำตัวผู้เสียภาษี", "สาขา", "เบอร์โทร", "อีเมล", "ที่อยู่", "เครดิต (วัน)", "ยอดยกมา"],
      [
        ["บริษัท ตัวอย่าง จำกัด", "นิติบุคคล", "0123456789012", "00000", "02-123-4567", "info@example.com", "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110", 30, 0],
        ["คุณสมชาย ใจดี", "บุคคลธรรมดา", "", "", "081-234-5678", "", "456 ม.1 ต.บางเขน อ.เมือง จ.นนทบุรี 11000", 0, 5000],
      ],
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = rows?.filter((r) => r.willImport).length ?? 0;
  const invalidCount = rows ? rows.length - validCount : 0;

  if (!canManageFinance) {
    return (
      <div className="p-8 text-center text-gray-500">
        เฉพาะ Admin / Finance Manager เท่านั้นที่ import ได้
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Upload className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import ลูกค้าจาก CSV</h2>
          <p className="text-sm text-gray-600">รองรับไฟล์ export จาก FlowAccount หรือ format ของเรา</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-1">
        <div className="font-medium">📝 คอลัมน์ที่รองรับ (ชื่อ header ภาษาไทยหรืออังกฤษก็ได้):</div>
        <div className="text-xs">
          ชื่อลูกค้า* · ประเภท (นิติบุคคล/บุคคลธรรมดา) · เลขประจำตัวผู้เสียภาษี · สาขา · เบอร์โทร · อีเมล · ที่อยู่ · เครดิต (วัน) · ยอดยกมา · ผู้ติดต่อ · หมายเหตุ
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline mt-1"
        >
          <Download className="w-3 h-3" />
          ดาวน์โหลดไฟล์ template ตัวอย่าง
        </button>
      </div>

      {!rows && !result && (
        <label
          className="block border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 cursor-pointer bg-white"
        >
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <div className="text-gray-700 font-medium">คลิกเลือกไฟล์ CSV</div>
          <div className="text-xs text-gray-500 mt-1">ต้องเป็น UTF-8, มี header ในแถวแรก</div>
        </label>
      )}

      {rows && !result && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-sm font-medium">
                  <FileText className="w-4 h-4 inline mr-1" />
                  {fileName}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  รวม {rows.length} แถว · พร้อม import {validCount} · ข้าม {invalidCount}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setRows(null); setFileName(""); }}
                  className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {validCount} รายการ
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-center px-2 py-2">OK</th>
                  <th className="text-left px-3 py-2">ชื่อ</th>
                  <th className="text-left px-3 py-2">ประเภท</th>
                  <th className="text-left px-3 py-2">TIN</th>
                  <th className="text-left px-3 py-2">โทร</th>
                  <th className="text-right px-3 py-2">ยอดยกมา</th>
                  <th className="text-left px-3 py-2">ปัญหา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 100).map((r) => (
                  <tr key={r.rowNumber} className={r.willImport ? "" : "bg-red-50"}>
                    <td className="px-3 py-2 text-xs text-gray-500">{r.rowNumber}</td>
                    <td className="px-2 py-2 text-center">
                      {r.willImport ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 inline" />
                      )}
                    </td>
                    <td className="px-3 py-2">{r.name || <span className="text-red-500">—</span>}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.customerType === "corporate" ? "นิติบุคคล" : "บุคคลธรรมดา"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.taxId ?? "-"}</td>
                    <td className="px-3 py-2 text-xs">{r.phone ?? "-"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">
                      {r.openingBalance ? r.openingBalance.toLocaleString("th-TH") : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-red-600">{r.issues.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="p-3 text-xs text-gray-500 text-center border-t">
                แสดง 100 แถวแรก (ทั้งหมด {rows.length} แถว)
              </div>
            )}
          </div>
        </>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold">Import สำเร็จ!</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="เพิ่มสำเร็จ" value={result.imported} color="text-green-700" />
            <Stat label="ข้าม" value={result.skipped} color="text-gray-500" />
            <Stat label="ผิดพลาด" value={result.errors.length} color="text-red-700" />
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-red-800 mb-1">รายการผิดพลาด:</div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>แถว {e.rowNumber}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => { setRows(null); setResult(null); setFileName(""); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Import ไฟล์อื่น
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
