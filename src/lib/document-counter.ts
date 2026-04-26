import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { DocumentType } from '@/types';

/**
 * Document number prefixes (กำหนดมาตรฐาน — ห้ามเปลี่ยนหลัง go-live)
 */
export const DOC_PREFIXES: Record<DocumentType, string> = {
  quotation: 'QT',
  invoice: 'INV',
  tax_invoice: 'TAX',
  receipt: 'RC',
  credit_note: 'CN',
  delivery_note: 'DN',
  expense: 'EX',
  wht_certificate: 'WHT',
};

export type NumberingMode = 'monthly' | 'yearly';

/**
 * Format a document number from its parts.
 * Monthly: PREFIX-YYYY-MM-NNNN  (e.g., INV-2026-04-0001)
 * Yearly:  PREFIX-YYYY-NNNNN    (e.g., INV-2026-00001)
 */
export function formatDocumentNumber(
  prefix: string,
  year: number,
  month: number | undefined,
  sequence: number,
  mode: NumberingMode = 'monthly',
): string {
  const yyyy = year.toString().padStart(4, '0');
  if (mode === 'monthly' && month !== undefined) {
    const mm = month.toString().padStart(2, '0');
    const seq = sequence.toString().padStart(4, '0');
    return `${prefix}-${yyyy}-${mm}-${seq}`;
  }
  const seq = sequence.toString().padStart(5, '0');
  return `${prefix}-${yyyy}-${seq}`;
}

/**
 * Build counter document ID for Firestore.
 */
export function buildCounterId(
  type: DocumentType,
  year: number,
  month: number | undefined,
  mode: NumberingMode,
): string {
  if (mode === 'monthly' && month !== undefined) {
    return `${type}-${year}-${month.toString().padStart(2, '0')}`;
  }
  return `${type}-${year}`;
}

export interface IssueNumberOptions {
  type: DocumentType;
  /** Override prefix (default: from DOC_PREFIXES) */
  prefix?: string;
  /** Override numbering mode (default: monthly) */
  mode?: NumberingMode;
  /** Override issue date (default: now) */
  date?: Date;
}

export interface IssuedNumber {
  number: string;
  sequence: number;
  year: number;
  month?: number;
  counterId: string;
}

/**
 * Atomically issue the next document number using a Firestore transaction.
 * Guarantees no duplicate numbers even under concurrent writes.
 *
 * IMPORTANT: This function MUST be called inside (or before) the transaction
 * that creates the document. If you only need the number reservation, call
 * this directly. To bind it atomically with the document creation, pass the
 * transaction into a custom variant (see issueDocumentNumberInTx).
 */
export async function issueDocumentNumber(
  options: IssueNumberOptions,
): Promise<IssuedNumber> {
  const { type } = options;
  const prefix = options.prefix ?? DOC_PREFIXES[type];
  const mode: NumberingMode = options.mode ?? 'monthly';
  const date = options.date ?? new Date();
  const year = date.getFullYear();
  const month = mode === 'monthly' ? date.getMonth() + 1 : undefined;
  const counterId = buildCounterId(type, year, month, mode);
  const counterRef = doc(db, 'documentCounters', counterId);

  const issued = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const lastNumber = snap.exists() ? (snap.data().lastNumber as number) ?? 0 : 0;
    const nextNumber = lastNumber + 1;
    tx.set(
      counterRef,
      {
        type,
        year,
        month: month ?? null,
        lastNumber: nextNumber,
        prefix,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return nextNumber;
  });

  return {
    number: formatDocumentNumber(prefix, year, month, issued, mode),
    sequence: issued,
    year,
    month,
    counterId,
  };
}

/**
 * Peek at the next number without incrementing. Useful for previewing in UI.
 * NOT safe to use as the actual issued number — always call issueDocumentNumber
 * at the moment of saving the document.
 */
export async function peekNextNumber(
  options: IssueNumberOptions,
): Promise<string> {
  const { getDoc } = await import('firebase/firestore');
  const { type } = options;
  const prefix = options.prefix ?? DOC_PREFIXES[type];
  const mode: NumberingMode = options.mode ?? 'monthly';
  const date = options.date ?? new Date();
  const year = date.getFullYear();
  const month = mode === 'monthly' ? date.getMonth() + 1 : undefined;
  const counterId = buildCounterId(type, year, month, mode);
  const counterRef = doc(db, 'documentCounters', counterId);
  const snap = await getDoc(counterRef);
  const lastNumber = snap.exists() ? (snap.data().lastNumber as number) ?? 0 : 0;
  return formatDocumentNumber(prefix, year, month, lastNumber + 1, mode);
}
