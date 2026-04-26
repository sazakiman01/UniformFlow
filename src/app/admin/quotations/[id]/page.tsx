"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Download, Send, FileText, Receipt } from "lucide-react";
import { getQuotation, updateQuotation } from "@/lib/quotations";
import { getCompanyProfile } from "@/lib/company";
import { formatTHB } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";
import type { Quotation, CompanyProfile } from "@/types";

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user, profile } = useAuth();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getQuotation(id), getCompanyProfile()])
      .then(([q, c]) => {
        setQuotation(q);
        setCompany(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadPDF() {
    if (!quotation || !company) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: QuotationPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/QuotationPDF"),
      ]);
      const blob = await pdf(<QuotationPDF quotation={quotation} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("สร้าง PDF ไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function handleMarkSent() {
    if (!quotation || !user || !profile) return;
    await updateQuotation(quotation.id, {
      status: "sent",
      sentAt: new Date(),
      updatedBy: user.uid,
      audit: { action: "send", by: user.uid, byName: profile.displayName ?? profile.email },
    });
    setQuotation({ ...quotation, status: "sent", sentAt: new Date() });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!quotation) {
    return <div className="p-8 text-center text-gray-500">ไม่พบใบเสนอราคา</div>;
  }
  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">ยังไม่ได้ตั้งค่าข้อมูลบริษัท — กรุณาตั้งค่าก่อนพิมพ์เอกสาร</p>
        <Link href="/admin/company" className="text-blue-600 underline">
          ไปที่หน้าข้อมูลบริษัท
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="flex items-center gap-2">
          {quotation.status === "draft" && (
            <button
              onClick={handleMarkSent}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Send className="w-4 h-4" />
              บันทึกว่าส่งแล้ว
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            ดาวน์โหลด PDF
          </button>
          {quotation.status !== "converted" && (
            <Link
              href={`/admin/invoices/new?fromQuotation=${quotation.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <Receipt className="w-4 h-4" />
              ออกใบกำกับภาษี
            </Link>
          )}
          {quotation.status === "draft" && (
            <Link
              href={`/admin/quotations/${quotation.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm"
            >
              <Pencil className="w-4 h-4" />
              แก้ไข
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold font-mono">{quotation.number}</h2>
              <p className="text-sm text-gray-600">ใบเสนอราคา · {quotation.createdAt.toLocaleDateString("th-TH")}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {quotation.status}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ลูกค้า</div>
            <div className="font-medium">{quotation.customerSnapshot?.name}</div>
            {quotation.customerSnapshot?.taxId && (
              <div className="text-sm text-gray-600">TIN: {quotation.customerSnapshot.taxId}</div>
            )}
            <div className="text-sm text-gray-600">{quotation.customerSnapshot?.phone}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ยืนราคาถึง</div>
            <div>{quotation.validUntil.toLocaleDateString("th-TH")}</div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
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
              {quotation.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <div>{it.productName}</div>
                    {it.description && <div className="text-xs text-gray-500">{it.description}</div>}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {it.quantity} {it.unit ?? ""}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatTHB(it.unitPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{formatTHB(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">มูลค่าก่อน VAT</span>
                <span className="tabular-nums">{formatTHB(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT {quotation.vatRate}%</span>
                <span className="tabular-nums">{formatTHB(quotation.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>รวมทั้งสิ้น</span>
                <span className="tabular-nums text-blue-700 text-lg">{formatTHB(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {(quotation.notes || quotation.termsAndConditions) && (
          <div className="mt-5 border-t pt-4 space-y-3 text-sm text-gray-700">
            {quotation.notes && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">หมายเหตุ</div>
                {quotation.notes}
              </div>
            )}
            {quotation.termsAndConditions && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">เงื่อนไข</div>
                {quotation.termsAndConditions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
