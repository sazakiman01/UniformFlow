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
import { updateInvoice } from "./invoices";
import type { CreditNote } from "@/types";

export const CREDIT_NOTES = "creditNotes";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): CreditNote {
  return {
    id,
    number: d.number as string,
    originalInvoiceId: d.originalInvoiceId as string,
    originalInvoiceNumber: d.originalInvoiceNumber as string,
    customerId: d.customerId as string,
    customerSnapshot: d.customerSnapshot as CreditNote["customerSnapshot"],
    reason: (d.reason as string) ?? "",
    reasonCategory: (d.reasonCategory as CreditNote["reasonCategory"]) ?? "other",
    items: (d.items as CreditNote["items"]) ?? [],
    priceMode: (d.priceMode as CreditNote["priceMode"]) ?? "exclusive",
    subtotal: (d.subtotal as number) ?? 0,
    vatRate: (d.vatRate as number) ?? 7,
    vatAmount: (d.vatAmount as number) ?? 0,
    grandTotal: (d.grandTotal as number) ?? 0,
    issueDate: tsToDate(d.issueDate),
    pdfUrl: d.pdfUrl as string | undefined,
    status: (d.status as CreditNote["status"]) ?? "draft",
    createdBy: d.createdBy as string,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getCreditNote(id: string): Promise<CreditNote | null> {
  const snap = await getDoc(doc(db, CREDIT_NOTES, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listCreditNotes(opts?: {
  customerId?: string;
  originalInvoiceId?: string;
  max?: number;
}): Promise<CreditNote[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  if (opts?.originalInvoiceId)
    filters.push(where("originalInvoiceId", "==", opts.originalInvoiceId));
  const q = query(
    collection(db, CREDIT_NOTES),
    ...filters,
    orderBy("issueDate", "desc"),
    fsLimit(opts?.max ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function createCreditNote(
  data: Omit<CreditNote, "id" | "number" | "createdAt" | "updatedAt">,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({ type: "credit_note", date: data.issueDate });
  const ref = doc(collection(db, CREDIT_NOTES));
  await setDoc(ref, {
    ...data,
    number: issued.number,
    issueDate: Timestamp.fromDate(data.issueDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Link credit note back to original invoice
  await updateInvoice(data.originalInvoiceId, {
    creditNoteId: ref.id,
    audit: {
      action: "replace",
      by: data.createdBy,
      reason: `Credit note ${issued.number} issued: ${data.reason}`,
    },
  }).catch((e) => console.error("Failed to link credit note:", e));

  return { id: ref.id, number: issued.number };
}

export async function updateCreditNote(
  id: string,
  patch: Partial<Omit<CreditNote, "id" | "number" | "createdAt">>,
): Promise<void> {
  const { issueDate, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest, updatedAt: serverTimestamp() };
  if (issueDate) data.issueDate = Timestamp.fromDate(issueDate);
  await updateDoc(doc(db, CREDIT_NOTES, id), data);
}
