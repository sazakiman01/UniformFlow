import { arrayUnion, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { AuditEntry } from '@/types';

/**
 * Append an audit entry to a tax-bound document (invoice, credit note, etc.).
 *
 * Usage:
 *   await appendAudit('invoices', invoiceId, {
 *     action: 'cancel',
 *     by: user.uid,
 *     byName: profile.displayName,
 *     reason: 'ลูกค้ายกเลิกออเดอร์',
 *   });
 */
export async function appendAudit(
  collection: string,
  docId: string,
  entry: Omit<AuditEntry, 'at'> & { at?: Date },
): Promise<void> {
  const ref = doc(db, collection, docId);
  await updateDoc(ref, {
    auditLog: arrayUnion({
      ...entry,
      at: entry.at ? Timestamp.fromDate(entry.at) : Timestamp.now(),
    }),
  });
}

/**
 * Build an audit entry without writing — useful for inline inclusion in a
 * batch/transaction that creates the document with its first audit entry.
 */
export function buildAuditEntry(
  entry: Omit<AuditEntry, 'at'> & { at?: Date },
): AuditEntry {
  return {
    ...entry,
    at: entry.at ?? new Date(),
  };
}
