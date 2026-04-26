"use client";

import { useSearchParams } from "next/navigation";
import CreditNoteForm from "@/components/admin/CreditNoteForm";
import Link from "next/link";

export default function NewCreditNotePage() {
  const params = useSearchParams();
  const invoiceId = params.get("invoiceId");
  if (!invoiceId) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="mb-3">ใบลดหนี้ต้องอ้างอิงใบกำกับภาษีต้นฉบับ</p>
        <Link href="/admin/invoices" className="text-blue-600 underline">
          เลือกใบกำกับ
        </Link>
      </div>
    );
  }
  return <CreditNoteForm invoiceId={invoiceId} />;
}
