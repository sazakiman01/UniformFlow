"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Download, Truck, CheckCircle2 } from "lucide-react";
import { getDeliveryNote, updateDeliveryNote } from "@/lib/delivery-notes";
import { getCompanyProfile } from "@/lib/company";
import type { DeliveryNote, CompanyProfile } from "@/types";

export default function DeliveryNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function refresh() {
    if (!id) return;
    const [n, c] = await Promise.all([getDeliveryNote(id), getCompanyProfile()]);
    setNote(n);
    setCompany(c);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadPDF() {
    if (!note || !company) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: DNPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/DeliveryNotePDF"),
      ]);
      const blob = await pdf(<DNPDF note={note} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("สร้าง PDF ไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function markStatus(status: DeliveryNote["status"]) {
    if (!note) return;
    const patch: Partial<DeliveryNote> = { status };
    if (status === "delivered") patch.receivedAt = new Date();
    await updateDeliveryNote(note.id, patch);
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!note || !company) return <div className="p-8 text-center text-gray-500">ไม่พบเอกสาร</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="flex items-center gap-2">
          {note.status === "draft" && (
            <button
              onClick={() => markStatus("shipped")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Truck className="w-4 h-4" />
              จัดส่งแล้ว
            </button>
          )}
          {note.status === "shipped" && (
            <button
              onClick={() => markStatus("delivered")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              ส่งถึงแล้ว
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold font-mono">{note.number}</h2>
            <p className="text-sm text-gray-600">ใบส่งของ · {note.deliveryDate.toLocaleDateString("th-TH")}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {note.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ผู้รับ</div>
            <div className="font-medium">{note.customerSnapshot?.name}</div>
            <div className="text-sm text-gray-600">{note.customerSnapshot?.phone}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ขนส่ง</div>
            <div>{note.carrier ?? "-"}</div>
            {note.trackingNo && <div className="text-sm font-mono text-gray-600">{note.trackingNo}</div>}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">รายการ</div>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">รายการ</th>
                <th className="text-right py-2">จำนวน</th>
                <th className="text-left py-2 pl-3">หน่วย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {note.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">{it.productName}</td>
                  <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-2 pl-3">{it.unit ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
