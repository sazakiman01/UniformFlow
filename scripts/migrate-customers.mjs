/**
 * Migration script — backfill new fields on existing `customers` documents.
 *
 * Adds:
 *  - customerType: "individual" (default for legacy customers)
 *  - branchCode: "00000"
 *  - creditTerm: 0
 *  - taxId/email: undefined (admin can fill later)
 *  - address: convert flat string to Address object if needed
 *
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS env to firebase admin SDK json file
 *   2. node scripts/migrate-customers.mjs --dry-run    (preview)
 *   3. node scripts/migrate-customers.mjs              (apply)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);

const snap = await db.collection("customers").get();
console.log(`Found ${snap.size} customers`);

let updated = 0, skipped = 0;
for (const doc of snap.docs) {
  const d = doc.data();
  const patch = {};

  if (d.customerType === undefined) patch.customerType = "individual";
  if (d.branchCode === undefined) patch.branchCode = "00000";
  if (d.creditTerm === undefined) patch.creditTerm = 0;

  // Convert string address → object
  if (typeof d.address === "string") {
    patch.address = {
      street: "",
      district: "",
      province: "",
      postcode: "",
      fullAddress: d.address,
    };
  } else if (!d.address) {
    patch.address = {
      street: "",
      district: "",
      province: "",
      postcode: "",
      fullAddress: "",
    };
  }

  if (Object.keys(patch).length === 0) {
    skipped++;
    continue;
  }
  patch.updatedAt = FieldValue.serverTimestamp();
  console.log(`[${doc.id}] ${d.name ?? "?"}: + ${Object.keys(patch).join(", ")}`);
  if (!DRY_RUN) await doc.ref.update(patch);
  updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
