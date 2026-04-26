"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import InvoiceForm from "@/components/admin/InvoiceForm";
import { getInvoice } from "@/lib/invoices";
import { getCustomer } from "@/lib/customers";
import type { Invoice, Customer } from "@/types";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const inv = await getInvoice(id);
      setInvoice(inv);
      if (inv?.customerId) {
        const c = await getCustomer(inv.customerId);
        setCustomer(c);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!invoice) return <div className="p-8 text-center text-gray-500">ไม่พบเอกสาร</div>;
  if (invoice.status === "cancelled" || invoice.status === "void") {
    return (
      <div className="p-8 text-center text-gray-500">
        เอกสารถูกยกเลิกแล้ว ไม่สามารถแก้ไขได้
      </div>
    );
  }

  return <InvoiceForm initial={invoice} initialCustomer={customer} />;
}
