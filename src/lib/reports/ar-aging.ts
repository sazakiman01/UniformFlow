import { listInvoices } from "@/lib/invoices";
import type { ARAgingReport, ARAgingBucket, ARAgingItem, Invoice } from "@/types";
import { round2 } from "@/lib/money";

const MS_PER_DAY = 86400000;

export function classifyAgeBucket(days: number): ARAgingBucket {
  if (days <= 0) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export interface AgingOptions {
  /** Reference date (default = today) */
  asOf?: Date;
  /** Only this customer */
  customerId?: string;
}

/**
 * Build AR aging report — invoices with amountDue > 0, not cancelled.
 */
export async function buildARAgingReport(opts: AgingOptions = {}): Promise<ARAgingReport> {
  const asOf = opts.asOf ?? new Date();
  const all = await listInvoices({ customerId: opts.customerId, max: 1000 });
  const open = all.filter(
    (inv) => inv.amountDue > 0 && inv.status !== "cancelled" && inv.status !== "void",
  );

  const items: ARAgingItem[] = open.map((inv) => {
    const overdueDays = Math.floor(
      (asOf.getTime() - inv.dueDate.getTime()) / MS_PER_DAY,
    );
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.number,
      customerId: inv.customerId,
      customerName: inv.customerSnapshot?.name ?? "-",
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      overdueDays,
      amountDue: inv.amountDue,
      bucket: classifyAgeBucket(overdueDays),
    };
  });

  const buckets: Record<ARAgingBucket, number> = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };
  for (const it of items) buckets[it.bucket] = round2(buckets[it.bucket] + it.amountDue);

  const totalDue = round2(items.reduce((s, it) => s + it.amountDue, 0));

  return { asOf, items, buckets, totalDue };
}

/** Mark invoices as overdue if past due date (used by a cron / on-demand). */
export function isOverdue(inv: Invoice, asOf: Date = new Date()): boolean {
  return (
    inv.amountDue > 0 &&
    inv.status !== "cancelled" &&
    inv.status !== "void" &&
    inv.status !== "paid" &&
    inv.dueDate.getTime() < asOf.getTime()
  );
}
