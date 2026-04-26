"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import QuotationForm from "@/components/admin/QuotationForm";
import { getQuotation } from "@/lib/quotations";
import { getCustomer } from "@/lib/customers";
import type { Quotation, Customer } from "@/types";

export default function EditQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const q = await getQuotation(id);
      setQuotation(q);
      if (q?.customerId) {
        const c = await getCustomer(q.customerId);
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
  if (!quotation) return <div className="p-8 text-center text-gray-500">ไม่พบ</div>;

  return <QuotationForm initial={quotation} initialCustomer={customer} />;
}
