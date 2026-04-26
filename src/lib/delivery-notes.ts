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
import type { DeliveryNote } from "@/types";

export type DeliveryStatus = DeliveryNote["status"];

export const DELIVERY_NOTES = "deliveryNotes";

function tsToDate(v: unknown): Date {
  return (v as Timestamp)?.toDate?.() ?? new Date();
}

function fromDoc(id: string, d: Record<string, unknown>): DeliveryNote {
  return {
    id,
    number: d.number as string,
    invoiceId: d.invoiceId as string | undefined,
    orderId: d.orderId as string | undefined,
    customerId: d.customerId as string,
    customerSnapshot: d.customerSnapshot as DeliveryNote["customerSnapshot"],
    items: (d.items as DeliveryNote["items"]) ?? [],
    deliveryDate: tsToDate(d.deliveryDate),
    deliveryAddress: d.deliveryAddress as DeliveryNote["deliveryAddress"],
    receivedBy: d.receivedBy as string | undefined,
    carrier: d.carrier as string | undefined,
    trackingNo: d.trackingNo as string | undefined,
    notes: d.notes as string | undefined,
    status: (d.status as DeliveryStatus) ?? "draft",
    receivedAt: d.receivedAt ? tsToDate(d.receivedAt) : undefined,
    signatureUrl: d.signatureUrl as string | undefined,
    pdfUrl: d.pdfUrl as string | undefined,
    createdBy: d.createdBy as string,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  };
}

export async function getDeliveryNote(id: string): Promise<DeliveryNote | null> {
  const snap = await getDoc(doc(db, DELIVERY_NOTES, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listDeliveryNotes(opts?: {
  status?: DeliveryStatus;
  customerId?: string;
  max?: number;
}): Promise<DeliveryNote[]> {
  const filters = [] as ReturnType<typeof where>[];
  if (opts?.status) filters.push(where("status", "==", opts.status));
  if (opts?.customerId) filters.push(where("customerId", "==", opts.customerId));
  const q = query(
    collection(db, DELIVERY_NOTES),
    ...filters,
    orderBy("deliveryDate", "desc"),
    fsLimit(opts?.max ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function createDeliveryNote(
  data: Omit<DeliveryNote, "id" | "number" | "createdAt" | "updatedAt">,
): Promise<{ id: string; number: string }> {
  const issued = await issueDocumentNumber({ type: "delivery_note", date: data.deliveryDate });
  const ref = doc(collection(db, DELIVERY_NOTES));
  await setDoc(ref, {
    ...data,
    number: issued.number,
    deliveryDate: Timestamp.fromDate(data.deliveryDate),
    receivedAt: data.receivedAt ? Timestamp.fromDate(data.receivedAt) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, number: issued.number };
}

export async function updateDeliveryNote(
  id: string,
  patch: Partial<Omit<DeliveryNote, "id" | "number" | "createdAt">>,
): Promise<void> {
  const { deliveryDate, receivedAt, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest, updatedAt: serverTimestamp() };
  if (deliveryDate) data.deliveryDate = Timestamp.fromDate(deliveryDate);
  if (receivedAt) data.receivedAt = Timestamp.fromDate(receivedAt);
  await updateDoc(doc(db, DELIVERY_NOTES, id), data);
}
