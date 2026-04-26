import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  setDoc,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { issueDocumentNumber } from "./document-counter";
import type { CustomerSnapshot, PaymentMethod } from "@/types";

/**
 * Standalone Receipt — ใบเสร็จรับเงิน (ไม่ใช่ใบกำกับ)
 * ออกตอนรับเงินจากลูกค้า (อาจเป็น payment on invoice, or advance payment, or cash sale)
 *
 * Different from Invoice type `receipt`:
 *  - Standalone Receipt = เอกสารยืนยันการรับเงิน (ไม่มี VAT breakdown บังคับ)
 *  - Invoice type `tax_invoice_receipt` = ใบกำกับ+เสร็จรวม (ต้องมี VAT + TIN ลูกค้าถ้าเป็นนิติบุคคล)
 */
export interface Receipt {
  id: string;
  number: string;                 // RC-2026-04-0001
  issueDate: Date;
  // Customer
  customerId?: string;            // optional (walk-in customer)
  customerSnapshot?: CustomerSnapshot;
  // Payment
  amount: number;                 // ยอดรับ
  paymentMethod: PaymentMethod;
  bankRef?: string;
  // Linkage
  invoiceId?: string;             // ถ้า payment on invoice
  invoiceNumber?: string;
  paymentId?: string;             // link to InvoicePayment doc
  // Description
  description: string;            // รายการที่รับเงิน (e.g., "ค่ามัดจำ", "ชำระบางส่วนใบ INV-...")
  notes?: string;
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RECEIPTS = "receipts";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): Receipt {
  return {
    id,
    number: d.number as string,
    issueDate: tsToDate(d.issueDate),
    customerId: d.customerId as string | undefined,
    customerSnapshot: d.customerSnapshot as CustomerSnapshot | undefined,
    amount: (d.amount as number) ?? 0,
    paymentMethod: (d.paymentMethod as PaymentMethod) ?? "cash",
    bankRef: d.bankRef as string | undefined,
    invoiceId: d.invoiceId as string | undefined,
    invoiceNumber: d.invoiceNumber as string | undefined,
    paymentId: d.paymentId as string | undefined,
    description: (d.description as string) ?? "",
    notes: d.notes as string | undefined,
    createdBy: d.createdBy as string,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const snap = await getDoc(doc(db, RECEIPTS, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listReceipts(opts?: {
  customerId?: string;
  invoiceId?: string;
  max?: number;
}): Promise<Receipt[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  if (opts?.invoiceId) filters.push(where("invoiceId", "==", opts.invoiceId));
  const q = query(
    collection(db, RECEIPTS),
    ...filters,
    orderBy("issueDate", "desc"),
    fsLimit(opts?.max ?? 200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function createReceipt(
  data: Omit<Receipt, "id" | "number" | "createdAt" | "updatedAt">,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({ type: "receipt", date: data.issueDate });
  const ref = doc(collection(db, RECEIPTS));
  const payload: Record<string, unknown> = {
    ...data,
    number: issued.number,
    issueDate: Timestamp.fromDate(data.issueDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  await setDoc(ref, payload);
  return { id: ref.id, number: issued.number };
}
