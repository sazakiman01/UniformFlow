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
} from "firebase/firestore";
import { db } from "./firebase";
import { issueDocumentNumber } from "./document-counter";
import type { Quotation, QuotationStatus, AuditEntry } from "@/types";

export const QUOTATIONS = "quotations";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): Quotation {
  return {
    id,
    number: d.number as string,
    customerId: d.customerId as string,
    customerSnapshot: d.customerSnapshot as Quotation["customerSnapshot"],
    items: (d.items as Quotation["items"]) ?? [],
    priceMode: (d.priceMode as Quotation["priceMode"]) ?? "exclusive",
    subtotal: (d.subtotal as number) ?? 0,
    discountAmount: (d.discountAmount as number) ?? 0,
    vatRate: (d.vatRate as number) ?? 7,
    vatAmount: (d.vatAmount as number) ?? 0,
    grandTotal: (d.grandTotal as number) ?? 0,
    validUntil: tsToDate(d.validUntil),
    notes: d.notes as string | undefined,
    termsAndConditions: d.termsAndConditions as string | undefined,
    status: (d.status as QuotationStatus) ?? "draft",
    convertedToInvoiceId: d.convertedToInvoiceId as string | undefined,
    pdfUrl: d.pdfUrl as string | undefined,
    sentAt: d.sentAt ? tsToDate(d.sentAt) : undefined,
    acceptedAt: d.acceptedAt ? tsToDate(d.acceptedAt) : undefined,
    createdBy: d.createdBy as string,
    updatedBy: d.updatedBy as string | undefined,
    auditLog: (d.auditLog as AuditEntry[] | undefined)?.map((a) => ({
      ...a,
      at: tsToDate(a.at),
    })),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  const snap = await getDoc(doc(db, QUOTATIONS, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listQuotations(opts?: {
  status?: QuotationStatus;
  customerId?: string;
  max?: number;
}): Promise<Quotation[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.status) filters.push(where("status", "==", opts.status));
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  const q = query(
    collection(db, QUOTATIONS),
    ...filters,
    orderBy("createdAt", "desc"),
    fsLimit(opts?.max ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export interface CreateQuotationInput
  extends Omit<Quotation, "id" | "number" | "createdAt" | "updatedAt" | "auditLog"> {
  audit?: Omit<AuditEntry, "at">;
}

/**
 * Create a new quotation with atomically-issued number.
 * Number is reserved at the moment of creation (never preview-only).
 */
export async function createQuotation(input: CreateQuotationInput): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({
    type: "quotation",
    date: input.validUntil instanceof Date ? new Date() : new Date(),
  });
  const ref = doc(collection(db, QUOTATIONS));
  const auditEntry = input.audit
    ? [{ ...input.audit, at: Timestamp.now() }]
    : [];

  // Filter out undefined values before sending to Firestore
  const sanitizedInput = Object.fromEntries(
    Object.entries(input).filter(([_, v]) => v !== undefined)
  ) as unknown as CreateQuotationInput;

  await setDoc(ref, {
    ...sanitizedInput,
    number: issued.number,
    auditLog: auditEntry,
    validUntil: Timestamp.fromDate(input.validUntil),
    sentAt: input.sentAt ? Timestamp.fromDate(input.sentAt) : null,
    acceptedAt: input.acceptedAt ? Timestamp.fromDate(input.acceptedAt) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, number: issued.number };
}

export async function updateQuotation(
  id: string,
  patch: Partial<Omit<Quotation, "id" | "number" | "createdAt">> & { audit?: Omit<AuditEntry, "at"> },
): Promise<void> {
  const { audit, validUntil, sentAt, acceptedAt, ...rest } = patch;
  const data: Record<string, unknown> = {
    ...rest,
    updatedAt: serverTimestamp(),
  };
  if (validUntil) data.validUntil = Timestamp.fromDate(validUntil);
  if (sentAt) data.sentAt = Timestamp.fromDate(sentAt);
  if (acceptedAt) data.acceptedAt = Timestamp.fromDate(acceptedAt);
  if (audit) {
    const { arrayUnion } = await import("firebase/firestore");
    data.auditLog = arrayUnion({ ...audit, at: Timestamp.now() });
  }

  // Filter out undefined values before sending to Firestore
  const sanitizedData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  await updateDoc(doc(db, QUOTATIONS, id), sanitizedData);
}
