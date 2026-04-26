"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, FileMinus } from "lucide-react";
import { getCreditNote } from "@/lib/credit-notes";
import { getCompanyProfile } from "@/lib/company";
import { formatTHB } from "@/lib/money";
import type { CreditNote, CompanyProfile } from "@/types";

export default function CreditNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [cn, setCN] = useState<CreditNote | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCreditNote(id), getCompanyProfile()])
      .then(([c, comp]) => {
        setCN(c);
        setCompany(comp);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadPDF() {
    if (!cn || !company) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: CNPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/CreditNotePDF"),
      ]);
      const blob = await pdf(<CNPDF creditNote={cn} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cn.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("สร้าง PDF ไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!cn || !company) return <div className="p-8 text-center text-gray-500">ไม่พบเอกสาร</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          ดาวน์โหลด PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileMinus className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-2xl font-bold font-mono">{cn.number}</h2>
              <p className="text-sm text-gray-600">
                ใบลดหนี้ · ออกเมื่อ {cn.issueDate.toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
          <span className="text-3xl font-bold text-red-600 tabular-nums">−{formatTHB(cn.grandTotal)}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-xs font-medium text-amber-800 mb-1">เหตุผล</div>
          <div className="text-sm">{cn.reason}</div>
        </div>

        <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase">ลูกค้า</div>
            <div className="font-medium">{cn.customerSnapshot?.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">อ้างอิงใบกำกับ</div>
            <Link
              href={`/dashboard/invoices/${cn.originalInvoiceId}`}
              className="font-mono text-blue-600 hover:underline"
            >
              {cn.originalInvoiceNumber}
            </Link>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">รายการ</div>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">รายการ</th>
                <th className="text-right py-2">จำนวน</th>
                <th className="text-right py-2">ราคา</th>
                <th className="text-right py-2">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cn.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">{it.productName}</td>
                  <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-2 text-right tabular-nums">{formatTHB(it.unitPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{formatTHB(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
