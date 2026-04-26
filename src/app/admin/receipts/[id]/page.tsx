"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, ReceiptText } from "lucide-react";
import { getReceipt, type Receipt } from "@/lib/receipts";
import { getCompanyProfile } from "@/lib/company";
import { formatTHB } from "@/lib/money";
import type { CompanyProfile } from "@/types";

export default function ReceiptDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getReceipt(id), getCompanyProfile()])
      .then(([r, c]) => {
        setReceipt(r);
        setCompany(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadPDF() {
    if (!receipt || !company) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: RCPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/ReceiptPDF"),
      ]);
      const blob = await pdf(<RCPDF receipt={receipt} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${receipt.number}.pdf`;
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
  if (!receipt || !company) return <div className="p-8 text-center text-gray-500">ไม่พบเอกสาร</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
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

      <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold font-mono">{receipt.number}</h2>
              <p className="text-sm text-gray-600">
                ใบเสร็จรับเงิน · {receipt.issueDate.toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">ยอดรับ</div>
            <div className="text-3xl font-bold text-green-700 tabular-nums">
              {formatTHB(receipt.amount)}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase mb-1">รายการ</div>
          <div>{receipt.description}</div>
        </div>

        <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase">ผู้จ่าย</div>
            <div className="font-medium">{receipt.customerSnapshot?.name ?? "Walk-in customer"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">วิธีรับชำระ</div>
            <div>{receipt.paymentMethod}</div>
            {receipt.bankRef && <div className="text-xs font-mono text-gray-600">{receipt.bankRef}</div>}
          </div>
          {receipt.invoiceNumber && (
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500 uppercase">อ้างอิงใบกำกับ</div>
              <Link
                href={`/admin/invoices/${receipt.invoiceId}`}
                className="font-mono text-blue-600 hover:underline"
              >
                {receipt.invoiceNumber}
              </Link>
            </div>
          )}
          {receipt.notes && (
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500 uppercase">หมายเหตุ</div>
              <div>{receipt.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
