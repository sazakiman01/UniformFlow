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
  deleteDoc,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { issueDocumentNumber } from "./document-counter";
import type { Expense, ExpenseCategory } from "@/types";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

export const EXPENSES = "expenses";
export { EXPENSE_CATEGORY_LABELS };

export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = (
  Object.entries(EXPENSE_CATEGORY_LABELS) as Array<[ExpenseCategory, string]>
).map(([value, label]) => ({ value, label }));

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): Expense {
  return {
    id,
    number: (d.number as string) ?? "",
    category: (d.category as ExpenseCategory) ?? "other",
    description: (d.description as string) ?? "",
    supplier: d.supplier as string | undefined,
    supplierTaxId: d.supplierTaxId as string | undefined,
    supplierAddress: d.supplierAddress as string | undefined,
    amount: (d.amount as number) ?? 0,
    vatRate: d.vatRate as number | undefined,
    vatAmount: d.vatAmount as number | undefined,
    totalAmount: (d.totalAmount as number) ?? 0,
    withholdingTaxRate: d.withholdingTaxRate as number | undefined,
    withholdingTaxAmount: d.withholdingTaxAmount as number | undefined,
    whtCertificateId: d.whtCertificateId as string | undefined,
    isPurchaseTaxClaim: (d.isPurchaseTaxClaim as boolean) ?? false,
    supplierTaxInvoiceNumber: d.supplierTaxInvoiceNumber as string | undefined,
    supplierTaxInvoiceDate: d.supplierTaxInvoiceDate ? tsToDate(d.supplierTaxInvoiceDate) : undefined,
    paymentMethod: (d.paymentMethod as Expense["paymentMethod"]) ?? "transfer",
    paidAt: tsToDate(d.paidAt),
    bankRef: d.bankRef as string | undefined,
    receiptImage: d.receiptImage as string | undefined,
    attachments: d.attachments as string[] | undefined,
    relatedOrderId: d.relatedOrderId as string | undefined,
    isCOGS: (d.isCOGS as boolean) ?? false,
    createdBy: d.createdBy as string,
    updatedBy: d.updatedBy as string | undefined,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function listExpenses(opts?: {
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
  isPurchaseTaxClaim?: boolean;
  max?: number;
}): Promise<Expense[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.category) filters.push(where("category", "==", opts.category));
  if (opts?.isPurchaseTaxClaim !== undefined)
    filters.push(where("isPurchaseTaxClaim", "==", opts.isPurchaseTaxClaim));
  if (opts?.from) filters.push(where("paidAt", ">=", Timestamp.fromDate(opts.from)));
  if (opts?.to) filters.push(where("paidAt", "<=", Timestamp.fromDate(opts.to)));
  const q = query(
    collection(db, EXPENSES),
    ...filters,
    orderBy("paidAt", "desc"),
    fsLimit(opts?.max ?? 200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function getExpense(id: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, EXPENSES, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function createExpense(
  data: Omit<Expense, "id" | "number" | "createdAt" | "updatedAt">,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({ type: "expense", date: data.paidAt });
  const ref = doc(collection(db, EXPENSES));
  await setDoc(ref, {
    ...data,
    number: issued.number,
    paidAt: Timestamp.fromDate(data.paidAt),
    supplierTaxInvoiceDate: data.supplierTaxInvoiceDate
      ? Timestamp.fromDate(data.supplierTaxInvoiceDate)
      : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, number: issued.number };
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<Expense, "id" | "number" | "createdAt">>,
): Promise<void> {
  const { paidAt, supplierTaxInvoiceDate, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest, updatedAt: serverTimestamp() };
  if (paidAt) data.paidAt = Timestamp.fromDate(paidAt);
  if (supplierTaxInvoiceDate) data.supplierTaxInvoiceDate = Timestamp.fromDate(supplierTaxInvoiceDate);
  await updateDoc(doc(db, EXPENSES, id), data);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, EXPENSES, id));
}
