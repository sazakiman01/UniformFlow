"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import InvoiceForm from "@/components/admin/InvoiceForm";
import { getQuotation, updateQuotation } from "@/lib/quotations";
import { getCustomer } from "@/lib/customers";
import type { Customer, Invoice } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

/**
 * /admin/invoices/new
 * /admin/invoices/new?fromQuotation=<quotationId>
 */
export default function NewInvoicePage() {
  const params = useSearchParams();
  const fromQuotationId = params.get("fromQuotation");
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(!!fromQuotationId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [seedFromQuotation, setSeedFromQuotation] = useState<{
    quotationId: string;
    data: Partial<Invoice>;
  } | null>(null);

  useEffect(() => {
    if (!fromQuotationId) return;
    (async () => {
      const q = await getQuotation(fromQuotationId);
      if (!q) {
        setLoading(false);
        return;
      }
      const c = await getCustomer(q.customerId);
      setCustomer(c);
      setSeedFromQuotation({
        quotationId: q.id,
        data: {
          items: q.items,
          priceMode: q.priceMode,
          vatRate: q.vatRate,
          discountAmount: q.discountAmount,
          notes: q.notes,
        },
      });
      // Mark quotation as accepted (customer agreed → we issue invoice)
      if (user && profile && (q.status === "sent" || q.status === "draft")) {
        await updateQuotation(q.id, {
          status: "converted",
          updatedBy: user.uid,
          audit: { action: "replace", by: user.uid, byName: profile.displayName ?? profile.email, reason: "Converted to invoice" },
        }).catch(console.error);
      }
      setLoading(false);
    })();
  }, [fromQuotationId, user, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <InvoiceForm
      initialCustomer={customer}
      fromQuotation={seedFromQuotation ?? undefined}
    />
  );
}
