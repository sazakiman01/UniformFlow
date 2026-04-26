"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, FileText, Send, CheckCircle2 } from "lucide-react";
import {
  getBillingNote, updateBillingNote, type BillingNote, type BillingNoteStatus,
} from "@/lib/billing-notes";
import { getCompanyProfile } from "@/lib/company";
import { formatTHB } from "@/lib/money";
import type { CompanyProfile } from "@/types";

const STATUS_LABEL: Record<BillingNoteStatus, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

export default function BillingNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<BillingNote | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function refresh() {
    if (!id) return;
    const [n, c] = await Promise.all([getBillingNote(id), getCompanyProfile()]);
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
      const [{ pdf }, { default: BNPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/BillingNotePDF"),
      ]);
      const blob = await pdf(<BNPDF note={note} company={company} />).toBlob();
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

  async function markStatus(status: BillingNoteStatus) {
    if (!note) return;
    await updateBillingNote(note.id, { status });
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
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="flex items-center gap-2">
          {note.status === "draft" && (
            <button
              onClick={() => markStatus("sent")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
            >
              <Send className="w-4 h-4" />
              ทำเครื่องหมายส่งแล้ว
            </button>
          )}
          {note.status === "sent" && (
            <button
              onClick={() => markStatus("paid")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              ชำระแล้ว
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

      <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold font-mono">{note.number}</h2>
              <p className="text-sm text-gray-600">
                ใบวางบิล · ออกเมื่อ {note.issueDate.toLocaleDateString("th-TH")}
                {" · "}กำหนดชำระ {note.dueDate.toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              {STATUS_LABEL[note.status]}
            </span>
            <div className="text-3xl font-bold text-indigo-700 tabular-nums mt-1">
              {formatTHB(note.totalAmount)}
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-500 uppercase mb-1">ลูกค้า</div>
          <div className="font-medium">{note.customerSnapshot?.name}</div>
          {note.customerSnapshot?.taxId && (
            <div className="text-xs text-gray-500 font-mono">TIN: {note.customerSnapshot.taxId}</div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">
            ใบแจ้งหนี้ที่วางบิล ({note.items.length} ใบ)
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">เลขที่</th>
                <th className="text-left py-2">วันที่</th>
                <th className="text-right py-2">ยอดรวม</th>
                <th className="text-right py-2">ค้างชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {note.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2 font-mono">
                    <Link href={`/dashboard/invoices/${it.invoiceId}`} className="text-blue-600 hover:underline">
                      {it.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-2 text-xs text-gray-600">{it.issueDate.toLocaleDateString("th-TH")}</td>
                  <td className="py-2 text-right tabular-nums">{formatTHB(it.amount)}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatTHB(it.amountDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(note.collectorName || note.notes) && (
          <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {note.collectorName && (
              <div>
                <div className="text-xs text-gray-500 uppercase">ผู้เก็บเงิน</div>
                <div>{note.collectorName}</div>
                {note.collectDate && (
                  <div className="text-xs text-gray-600">
                    นัด: {note.collectDate.toLocaleDateString("th-TH")}
                  </div>
                )}
              </div>
            )}
            {note.notes && (
              <div>
                <div className="text-xs text-gray-500 uppercase">หมายเหตุ</div>
                <div>{note.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
