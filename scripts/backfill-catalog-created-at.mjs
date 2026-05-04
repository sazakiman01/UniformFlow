/**
 * Migration script — backfill createdAt for fabric catalogs that don't have it.
 *
 * Uses updatedAt as fallback if available, otherwise uses current server timestamp.
 *
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS env to firebase admin SDK json file
 *   2. node scripts/backfill-catalog-created-at.mjs --dry-run    (preview)
 *   3. node scripts/backfill-catalog-created-at.mjs              (apply)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);

const snap = await db.collection("fabricCatalogs").get();
console.log(`Found ${snap.size} fabric catalogs`);

let updated = 0, skipped = 0;
for (const doc of snap.docs) {
  const d = doc.data();
  const patch = {};

  // Check if createdAt is missing or invalid
  if (!d.createdAt) {
    // Use updatedAt as fallback if available
    if (d.updatedAt) {
      patch.createdAt = d.updatedAt;
      console.log(`[${doc.id}] ${d.code ?? "?"}: Using updatedAt as createdAt`);
    } else {
      // Use current server timestamp
      patch.createdAt = FieldValue.serverTimestamp();
      console.log(`[${doc.id}] ${d.code ?? "?"}: Using serverTimestamp as createdAt`);
    }
  } else {
    skipped++;
    continue;
  }

  if (Object.keys(patch).length === 0) {
    skipped++;
    continue;
  }

  if (!DRY_RUN) await doc.ref.update(patch);
  updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
