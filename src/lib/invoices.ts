import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { issueDocumentNumber } from "./document-counter";
import type { Invoice, InvoicePayment, InvoiceStatus, AuditEntry, DocumentType } from "@/types";
import { round2 } from "./money";

export const INVOICES = "invoices";
export const INVOICE_PAYMENTS = "invoicePayments";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): Invoice {
  return {
    id,
    number: d.number as string,
    type: (d.type as Invoice["type"]) ?? "tax_invoice",
    customerId: d.customerId as string,
    customerSnapshot: d.customerSnapshot as Invoice["customerSnapshot"],
    orderId: d.orderId as string | undefined,
    quotationId: d.quotationId as string | undefined,
    items: (d.items as Invoice["items"]) ?? [],
    priceMode: (d.priceMode as Invoice["priceMode"]) ?? "exclusive",
    subtotal: (d.subtotal as number) ?? 0,
    discountAmount: (d.discountAmount as number) ?? 0,
    netAmount: (d.netAmount as number) ?? 0,
    vatRate: (d.vatRate as number) ?? 7,
    vatAmount: (d.vatAmount as number) ?? 0,
    withholdingTaxRate: d.withholdingTaxRate as number | undefined,
    withholdingTaxAmount: d.withholdingTaxAmount as number | undefined,
    grandTotal: (d.grandTotal as number) ?? 0,
    amountPaid: (d.amountPaid as number) ?? 0,
    amountDue: (d.amountDue as number) ?? 0,
    issueDate: tsToDate(d.issueDate),
    dueDate: tsToDate(d.dueDate),
    status: (d.status as InvoiceStatus) ?? "draft",
    paymentMethod: d.paymentMethod as Invoice["paymentMethod"],
    paidAt: d.paidAt ? tsToDate(d.paidAt) : undefined,
    qrCodeData: d.qrCodeData as string | undefined,
    pdfUrl: d.pdfUrl as string | undefined,
    cancelledAt: d.cancelledAt ? tsToDate(d.cancelledAt) : undefined,
    cancelledReason: d.cancelledReason as string | undefined,
    cancelledBy: d.cancelledBy as string | undefined,
    replacedByInvoiceId: d.replacedByInvoiceId as string | undefined,
    creditNoteId: d.creditNoteId as string | undefined,
    notes: d.notes as string | undefined,
    internalNotes: d.internalNotes as string | undefined,
    sentAt: d.sentAt ? tsToDate(d.sentAt) : undefined,
    sentTo: d.sentTo as string[] | undefined,
    createdBy: d.createdBy as string,
    updatedBy: d.updatedBy as string | undefined,
    auditLog: (d.auditLog as AuditEntry[] | undefined)?.map((a) => ({ ...a, at: tsToDate(a.at) })),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(db, INVOICES, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listInvoices(opts?: {
  status?: InvoiceStatus;
  customerId?: string;
  type?: Invoice["type"];
  max?: number;
}): Promise<Invoice[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.status) filters.push(where("status", "==", opts.status));
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  if (opts?.type) filters.push(where("type", "==", opts.type));
  const q = query(
    collection(db, INVOICES),
    ...filters,
    orderBy("issueDate", "desc"),
    fsLimit(opts?.max ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export interface CreateInvoiceInput
  extends Omit<Invoice, "id" | "number" | "createdAt" | "updatedAt" | "auditLog" | "amountPaid" | "amountDue"> {
  audit?: Omit<AuditEntry, "at">;
}

/**
 * Map invoice type → counter document type so each invoice type has its
 * own number sequence (tax invoices, receipts, plain invoices).
 */
function counterTypeFor(invoiceType: Invoice["type"]): DocumentType {
  switch (invoiceType) {
    case "tax_invoice":
    case "tax_invoice_receipt":
      return "tax_invoice";
    case "receipt":
      return "receipt";
    case "invoice":
    default:
      return "invoice";
  }
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({
    type: counterTypeFor(input.type),
    date: input.issueDate ?? new Date(),
  });
  const ref = doc(collection(db, INVOICES));
  const audit = input.audit ? [{ ...input.audit, at: Timestamp.now() }] : [];
  const amountPaid = 0;
  const whtAmt = input.withholdingTaxAmount ?? 0;
  const amountDue = round2(input.grandTotal - amountPaid - whtAmt);
  await setDoc(ref, {
    ...input,
    number: issued.number,
    amountPaid,
    amountDue,
    auditLog: audit,
    issueDate: Timestamp.fromDate(input.issueDate),
    dueDate: Timestamp.fromDate(input.dueDate),
    paidAt: input.paidAt ? Timestamp.fromDate(input.paidAt) : null,
    sentAt: input.sentAt ? Timestamp.fromDate(input.sentAt) : null,
    cancelledAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, number: issued.number };
}

export async function updateInvoice(
  id: string,
  patch: Partial<Omit<Invoice, "id" | "number" | "createdAt">> & { audit?: Omit<AuditEntry, "at"> },
): Promise<void> {
  const { audit, issueDate, dueDate, paidAt, sentAt, cancelledAt, ...rest } = patch;
  const data: Record<string, unknown> = {
    ...rest,
    updatedAt: serverTimestamp(),
  };
  if (issueDate) data.issueDate = Timestamp.fromDate(issueDate);
  if (dueDate) data.dueDate = Timestamp.fromDate(dueDate);
  if (paidAt) data.paidAt = Timestamp.fromDate(paidAt);
  if (sentAt) data.sentAt = Timestamp.fromDate(sentAt);
  if (cancelledAt) data.cancelledAt = Timestamp.fromDate(cancelledAt);
  if (audit) data.auditLog = arrayUnion({ ...audit, at: Timestamp.now() });
  await updateDoc(doc(db, INVOICES, id), data);
}

export async function cancelInvoice(
  id: string,
  options: { reason: string; by: string; byName?: string },
): Promise<void> {
  await updateInvoice(id, {
    status: "cancelled",
    cancelledAt: new Date(),
    cancelledReason: options.reason,
    cancelledBy: options.by,
    audit: { action: "cancel", by: options.by, byName: options.byName, reason: options.reason },
  });
}

// ── Payments ────────────────────────────────────────────────────────────────

export async function listInvoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
  const q = query(
    collection(db, INVOICE_PAYMENTS),
    where("invoiceId", "==", invoiceId),
    orderBy("paidAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      invoiceId: data.invoiceId as string,
      amount: data.amount as number,
      method: data.method as InvoicePayment["method"],
      paidAt: tsToDate(data.paidAt),
      bankName: data.bankName as string | undefined,
      bankRef: data.bankRef as string | undefined,
      slipImage: data.slipImage as string | undefined,
      withholdingTaxAmount: data.withholdingTaxAmount as number | undefined,
      withholdingTaxRate: data.withholdingTaxRate as number | undefined,
      whtCertificateNumber: data.whtCertificateNumber as string | undefined,
      verified: (data.verified as boolean) ?? false,
      verifiedBy: data.verifiedBy as string | undefined,
      verifiedAt: data.verifiedAt ? tsToDate(data.verifiedAt) : undefined,
      notes: data.notes as string | undefined,
      createdBy: data.createdBy as string,
      createdAt: tsToDate(data.createdAt),
    };
  });
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: InvoicePayment["method"];
  paidAt: Date;
  bankName?: string;
  bankRef?: string;
  slipImage?: string;
  withholdingTaxAmount?: number;
  withholdingTaxRate?: number;
  whtCertificateNumber?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
}

/**
 * Record a payment against an invoice and update invoice status accordingly.
 * NOT a transaction — for production-grade you may want to wrap in runTransaction
 * to keep amountPaid in sync atomically. For now, we re-read after write.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<string> {
  const inv = await getInvoice(input.invoiceId);
  if (!inv) throw new Error("Invoice not found");
  const ref = await addDoc(collection(db, INVOICE_PAYMENTS), {
    invoiceId: input.invoiceId,
    amount: input.amount,
    method: input.method,
    paidAt: Timestamp.fromDate(input.paidAt),
    bankName: input.bankName ?? null,
    bankRef: input.bankRef ?? null,
    slipImage: input.slipImage ?? null,
    withholdingTaxAmount: input.withholdingTaxAmount ?? 0,
    withholdingTaxRate: input.withholdingTaxRate ?? 0,
    whtCertificateNumber: input.whtCertificateNumber ?? null,
    notes: input.notes ?? null,
    verified: true,
    verifiedBy: input.createdBy,
    verifiedAt: serverTimestamp(),
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });

  const newAmountPaid = round2(inv.amountPaid + input.amount);
  const totalWHT = round2((inv.withholdingTaxAmount ?? 0) + (input.withholdingTaxAmount ?? 0));
  const newAmountDue = round2(inv.grandTotal - newAmountPaid - totalWHT);
  let newStatus: InvoiceStatus = inv.status;
  if (newAmountDue <= 0.005) newStatus = "paid";
  else if (newAmountPaid > 0) newStatus = "partial";

  await updateInvoice(input.invoiceId, {
    amountPaid: newAmountPaid,
    amountDue: Math.max(0, newAmountDue),
    withholdingTaxAmount: totalWHT,
    status: newStatus,
    paidAt: newStatus === "paid" ? input.paidAt : inv.paidAt,
    audit: {
      action: "pay",
      by: input.createdBy,
      byName: input.createdByName,
      reason: `Payment ${input.amount} (${input.method})`,
    },
  });

  return ref.id;
}
