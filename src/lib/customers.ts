import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Customer, CustomerSnapshot, Address } from "@/types";

export const CUSTOMERS = "customers";

function fromDoc(id: string, d: Record<string, unknown>): Customer {
  return {
    id,
    name: (d.name as string) ?? "",
    phone: (d.phone as string) ?? "",
    lineUserId: d.lineUserId as string | undefined,
    email: d.email as string | undefined,
    address: (d.address as Address) ?? { street: "", district: "", subdistrict: "", province: "", postcode: "", fullAddress: "" },
    channel: (d.channel as Customer["channel"]) ?? "OTHER",
    taxId: d.taxId as string | undefined,
    customerType: d.customerType as Customer["customerType"],
    branchCode: d.branchCode as string | undefined,
    creditTerm: (d.creditTerm as number) ?? 0,
    defaultBillingAddress: d.defaultBillingAddress as Address | undefined,
    notes: d.notes as string | undefined,
    createdAt: (d.createdAt as Timestamp)?.toDate?.() ?? new Date(),
    updatedAt: (d.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
  };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const snap = await getDoc(doc(db, CUSTOMERS, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listCustomers(opts?: { search?: string; max?: number }): Promise<Customer[]> {
  const q = query(collection(db, CUSTOMERS), orderBy("name"), fsLimit(opts?.max ?? 200));
  const snap = await getDocs(q);
  let items = snap.docs.map((d) => fromDoc(d.id, d.data()));
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.taxId ?? "").includes(s),
    );
  }
  return items;
}

export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  const q = query(collection(db, CUSTOMERS), where("phone", "==", phone), fsLimit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return fromDoc(d.id, d.data());
}

export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  // Filter out undefined values before sending to Firestore
  const sanitizedData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  const ref = await addDoc(collection(db, CUSTOMERS), {
    ...sanitizedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateDoc(doc(db, CUSTOMERS, id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, CUSTOMERS, id));
}

/** Build a frozen customer snapshot for embedding in tax-bound documents. */
export function buildCustomerSnapshot(c: Customer): CustomerSnapshot {
  return {
    name: c.name,
    taxId: c.taxId,
    customerType: c.customerType,
    branchCode: c.branchCode,
    address: c.defaultBillingAddress ?? c.address,
    phone: c.phone,
    email: c.email,
  };
}
