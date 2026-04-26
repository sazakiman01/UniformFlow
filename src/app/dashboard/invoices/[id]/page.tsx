"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Download,
  Send,
  Receipt,
  CreditCard,
  Ban,
  ScrollText,
  Mail,
  FileMinus,
} from "lucide-react";
import { getInvoice, listInvoicePayments, updateInvoice, cancelInvoice } from "@/lib/invoices";
import { getCompanyProfile } from "@/lib/company";
import { formatTHB } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";
import PaymentDialog from "@/components/admin/PaymentDialog";
import type { Invoice, CompanyProfile, InvoicePayment } from "@/types";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user, profile, canManageFinance } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [inv, c, pays] = await Promise.all([
      getInvoice(id),
      getCompanyProfile(),
      listInvoicePayments(id),
    ]);
    setInvoice(inv);
    setCompany(c);
    setPayments(pays);
  }, [id]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function handleDownloadPDF() {
    if (!invoice || !company) return;
    setDownloading(true);
    try {
      const [{ pdf }, { default: InvoicePDF }, qrcodeMod] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/InvoicePDF"),
        import("qrcode"),
      ]);
      let qrImageDataUrl: string | undefined;
      if (invoice.qrCodeData) {
        try {
          qrImageDataUrl = await qrcodeMod.toDataURL(invoice.qrCodeData, { margin: 1, width: 220 });
        } catch (e) {
          console.error("QR render error:", e);
        }
      }
      const blob = await pdf(
        <InvoicePDF invoice={invoice} company={company} qrImageDataUrl={qrImageDataUrl} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("สร้าง PDF ไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!invoice || !company || !user || !profile) return;
    const recipient = invoice.customerSnapshot?.email;
    if (!recipient) {
      alert("ลูกค้าไม่มีอีเมล — โปรดเพิ่มในข้อมูลลูกค้า");
      return;
    }
    if (!confirm(`ส่งใบกำกับ ${invoice.number} ไปยัง ${recipient}?`)) return;

    setDownloading(true);
    try {
      // Generate PDF blob (with QR if exists)
      const [{ pdf }, { default: InvoicePDF }, qrcodeMod] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/InvoicePDF"),
        import("qrcode"),
      ]);
      let qrImageDataUrl: string | undefined;
      if (invoice.qrCodeData) {
        try {
          qrImageDataUrl = await qrcodeMod.toDataURL(invoice.qrCodeData, { margin: 1, width: 220 });
        } catch (e) {
          console.error("QR error:", e);
        }
      }
      const blob = await pdf(
        <InvoicePDF invoice={invoice} company={company} qrImageDataUrl={qrImageDataUrl} />,
      ).toBlob();
      const buf = await blob.arrayBuffer();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

      const res = await fetch("/api/email/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoice.number,
          customerName: invoice.customerSnapshot?.name ?? "",
          customerEmail: recipient,
          grandTotal: invoice.grandTotal,
          amountDue: invoice.amountDue,
          dueDate: invoice.dueDate.toISOString(),
          companyName: company.name,
          hasPromptPay: !!invoice.qrCodeData,
          pdfBase64,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`ส่งไม่สำเร็จ: ${data.error ?? "unknown"}`);
        return;
      }
      // Mark as sent + add to sentTo array
      await updateInvoice(invoice.id, {
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sentAt: new Date(),
        sentTo: [...(invoice.sentTo ?? []), recipient],
        updatedBy: user.uid,
        audit: {
          action: "send",
          by: user.uid,
          byName: profile.displayName ?? profile.email,
          reason: `Email to ${recipient}`,
        },
      });
      await refresh();
      alert(`ส่งไปยัง ${recipient} เรียบร้อยแล้ว ✓`);
    } catch (e) {
      console.error(e);
      alert("ส่งอีเมลไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function handleMarkSent() {
    if (!invoice || !user || !profile) return;
    await updateInvoice(invoice.id, {
      status: "sent",
      sentAt: new Date(),
      updatedBy: user.uid,
      audit: { action: "send", by: user.uid, byName: profile.displayName ?? profile.email },
    });
    await refresh();
  }

  async function handleCancel() {
    if (!invoice || !user || !profile) return;
    const reason = prompt("เหตุผลในการยกเลิก (จำเป็นสำหรับ audit log):");
    if (!reason || !reason.trim()) return;
    if (!confirm(`ยกเลิก ${invoice.number}?\nหมายเหตุ: เอกสารภาษียกเลิกแล้วต้องออกใบลดหนี้`)) return;
    await cancelInvoice(invoice.id, {
      reason: reason.trim(),
      by: user.uid,
      byName: profile.displayName ?? profile.email,
    });
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!invoice) return <div className="p-8 text-center text-gray-500">ไม่พบเอกสาร</div>;
  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">ยังไม่ได้ตั้งค่าข้อมูลบริษัท</p>
        <Link href="/dashboard/company" className="text-blue-600 underline">ไปที่หน้าข้อมูลบริษัท</Link>
      </div>
    );
  }

  const canEdit = invoice.status === "draft";
  const canPay = invoice.amountDue > 0 && invoice.status !== "cancelled" && invoice.status !== "void";

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
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status === "draft" && canManageFinance && (
            <button
              onClick={handleMarkSent}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Send className="w-4 h-4" />
              บันทึกว่าส่งแล้ว
            </button>
          )}
          {canPay && canManageFinance && (
            <button
              onClick={() => setShowPay(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <CreditCard className="w-4 h-4" />
              บันทึกการชำระ
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
          {invoice.customerSnapshot?.email && canManageFinance && (
            <button
              onClick={handleSendEmail}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm disabled:opacity-50"
              title={`ส่งไปยัง ${invoice.customerSnapshot.email}`}
            >
              <Mail className="w-4 h-4" />
              ส่งอีเมล
            </button>
          )}
          {canEdit && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm"
            >
              <Pencil className="w-4 h-4" />
              แก้ไข
            </Link>
          )}
          {(invoice.type === "tax_invoice" || invoice.type === "tax_invoice_receipt") &&
            invoice.status !== "draft" &&
            invoice.status !== "cancelled" &&
            !invoice.creditNoteId &&
            canManageFinance && (
              <Link
                href={`/dashboard/credit-notes/new?invoiceId=${invoice.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg text-sm"
              >
                <FileMinus className="w-4 h-4" />
                ออกใบลดหนี้
              </Link>
            )}
          {invoice.creditNoteId && (
            <Link
              href={`/dashboard/credit-notes/${invoice.creditNoteId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm"
            >
              <FileMinus className="w-4 h-4" />
              ดูใบลดหนี้
            </Link>
          )}
          {invoice.status !== "cancelled" && invoice.status !== "void" && canManageFinance && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm"
            >
              <Ban className="w-4 h-4" />
              ยกเลิก
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold font-mono">{invoice.number}</h2>
              <p className="text-sm text-gray-600">
                {invoice.type} · {invoice.issueDate.toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
          <span
            className={
              "px-3 py-1 rounded-full text-xs font-medium " +
              (invoice.status === "paid"
                ? "bg-green-100 text-green-700"
                : invoice.status === "partial"
                ? "bg-amber-100 text-amber-700"
                : invoice.status === "cancelled" || invoice.status === "void"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700")
            }
          >
            {invoice.status}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ลูกค้า</div>
            <div className="font-medium">{invoice.customerSnapshot?.name}</div>
            {invoice.customerSnapshot?.taxId && (
              <div className="text-sm text-gray-600">TIN: {invoice.customerSnapshot.taxId}</div>
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ครบกำหนด</div>
            <div>{invoice.dueDate.toLocaleDateString("th-TH")}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">ยอดค้างชำระ</div>
            <div className={"font-bold text-lg " + (invoice.amountDue > 0 ? "text-red-600" : "text-green-600")}>
              {formatTHB(invoice.amountDue)}
            </div>
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
              {invoice.items.map((it, i) => (
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
                <span className="tabular-nums">{formatTHB(invoice.netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT {invoice.vatRate}%</span>
                <span className="tabular-nums">{formatTHB(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>รวมทั้งสิ้น</span>
                <span className="tabular-nums text-blue-700 text-lg">{formatTHB(invoice.grandTotal)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>จ่ายแล้ว</span>
                  <span className="tabular-nums">−{formatTHB(invoice.amountPaid)}</span>
                </div>
              )}
              {(invoice.withholdingTaxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-orange-700">
                  <span>หัก ณ ที่จ่าย</span>
                  <span className="tabular-nums">−{formatTHB(invoice.withholdingTaxAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>ค้างชำระ</span>
                <span className={"tabular-nums " + (invoice.amountDue > 0 ? "text-red-600" : "text-green-600")}>
                  {formatTHB(invoice.amountDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">ประวัติการชำระ</div>
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded"
                >
                  <div>
                    <span className="font-medium">{formatTHB(p.amount)}</span>{" "}
                    <span className="text-gray-500">· {p.method}</span>
                    {p.bankRef && <span className="text-gray-500"> · {p.bankRef}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{p.paidAt.toLocaleDateString("th-TH")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {invoice.cancelledReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <strong>ยกเลิก:</strong> {invoice.cancelledReason}{" "}
            <span className="text-xs text-red-600">
              ({invoice.cancelledAt?.toLocaleString("th-TH")})
            </span>
          </div>
        )}

        {invoice.auditLog && invoice.auditLog.length > 0 && (
          <details className="mt-4 border-t pt-3">
            <summary className="text-xs font-medium text-gray-500 cursor-pointer flex items-center gap-1">
              <ScrollText className="w-3 h-3" />
              Audit log ({invoice.auditLog.length})
            </summary>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              {invoice.auditLog.map((a, i) => (
                <div key={i} className="font-mono">
                  [{a.at.toLocaleString("th-TH")}] {a.action} by {a.byName ?? a.by}
                  {a.reason ? ` — ${a.reason}` : ""}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {showPay && (
        <PaymentDialog
          invoice={invoice}
          onClose={() => setShowPay(false)}
          onRecorded={async () => {
            setShowPay(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
