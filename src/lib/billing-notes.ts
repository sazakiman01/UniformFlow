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
import type { CustomerSnapshot } from "@/types";

/**
 * Billing Note (ใบวางบิล) — เอกสารสำหรับไปเก็บเงินจากลูกค้าที่มี invoice ค้างหลายใบ
 * ไม่มี VAT breakdown เพราะ invoice ต้นฉบับมีอยู่แล้ว
 * Status: draft → sent → paid → cancelled
 */
export type BillingNoteStatus = "draft" | "sent" | "paid" | "cancelled";

export interface BillingNoteItem {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  description: string;
  amount: number;        // grandTotal of the invoice
  amountDue: number;     // ยอดค้างจริง (grandTotal - amountPaid)
}

export interface BillingNote {
  id: string;
  number: string;                 // BN-2026-04-0001
  issueDate: Date;
  dueDate: Date;
  customerId: string;
  customerSnapshot?: CustomerSnapshot;
  items: BillingNoteItem[];
  totalAmount: number;            // sum of amountDue
  status: BillingNoteStatus;
  // ผู้ไปเก็บเงิน
  collectorName?: string;
  collectDate?: Date;
  notes?: string;
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BILLING_NOTES = "billingNotes";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): BillingNote {
  const items = ((d.items as Record<string, unknown>[]) ?? []).map((it) => ({
    invoiceId: it.invoiceId as string,
    invoiceNumber: it.invoiceNumber as string,
    issueDate: tsToDate(it.issueDate),
    description: (it.description as string) ?? "",
    amount: (it.amount as number) ?? 0,
    amountDue: (it.amountDue as number) ?? 0,
  }));

  return {
    id,
    number: d.number as string,
    issueDate: tsToDate(d.issueDate),
    dueDate: tsToDate(d.dueDate),
    customerId: d.customerId as string,
    customerSnapshot: d.customerSnapshot as CustomerSnapshot | undefined,
    items,
    totalAmount: (d.totalAmount as number) ?? 0,
    status: (d.status as BillingNoteStatus) ?? "draft",
    collectorName: d.collectorName as string | undefined,
    collectDate: d.collectDate ? tsToDate(d.collectDate) : undefined,
    notes: d.notes as string | undefined,
    createdBy: d.createdBy as string,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getBillingNote(id: string): Promise<BillingNote | null> {
  const snap = await getDoc(doc(db, BILLING_NOTES, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listBillingNotes(opts?: {
  customerId?: string;
  status?: BillingNoteStatus;
  max?: number;
}): Promise<BillingNote[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  if (opts?.status) filters.push(where("status", "==", opts.status));
  const q = query(
    collection(db, BILLING_NOTES),
    ...filters,
    orderBy("issueDate", "desc"),
    fsLimit(opts?.max ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

function serializeItems(items: BillingNoteItem[]) {
  return items.map((it) => ({
    ...it,
    issueDate: Timestamp.fromDate(it.issueDate),
  }));
}

export async function createBillingNote(
  data: Omit<BillingNote, "id" | "number" | "createdAt" | "updatedAt">,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({ type: "delivery_note", date: data.issueDate });
  // Note: We use delivery_note's counter prefix pattern but switch to 'BN'.
  // TODO: Consider adding 'billing_note' to DocumentType if heavy usage.
  const number = issued.number.replace(/^DN-/, "BN-");

  const ref = doc(collection(db, BILLING_NOTES));
  const payload: Record<string, unknown> = {
    ...data,
    number,
    issueDate: Timestamp.fromDate(data.issueDate),
    dueDate: Timestamp.fromDate(data.dueDate),
    items: serializeItems(data.items),
    collectDate: data.collectDate ? Timestamp.fromDate(data.collectDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  await setDoc(ref, payload);
  return { id: ref.id, number };
}

export async function updateBillingNote(
  id: string,
  patch: Partial<Omit<BillingNote, "id" | "number" | "createdAt">>,
): Promise<void> {
  const { issueDate, dueDate, collectDate, items, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest, updatedAt: serverTimestamp() };
  if (issueDate) data.issueDate = Timestamp.fromDate(issueDate);
  if (dueDate) data.dueDate = Timestamp.fromDate(dueDate);
  if (collectDate) data.collectDate = Timestamp.fromDate(collectDate);
  if (items) data.items = serializeItems(items);
  await updateDoc(doc(db, BILLING_NOTES, id), data);
}
