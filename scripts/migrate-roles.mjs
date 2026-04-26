/**
 * Migration script — convert legacy roles to 4-role model.
 *
 * Maps:
 *  - role 'admin' → 'owner'
 *  - role 'user'  → 'staff'
 *
 * Affects:
 *  - users collection
 *  - invites collection (pending only)
 *
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS env to firebase admin SDK json file
 *   2. node scripts/migrate-roles.mjs --dry-run    (preview)
 *   3. node scripts/migrate-roles.mjs              (apply)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);

const ROLE_MAP = {
  admin: "owner",
  user: "staff",
};

async function migrateCollection(collectionName, options = {}) {
  const { onlyPending = false } = options;
  const snap = await db.collection(collectionName).get();
  console.log(`\n[${collectionName}] Found ${snap.size} documents`);

  let updated = 0,
    skipped = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const oldRole = d.role;

    if (onlyPending && d.status !== "pending") {
      skipped++;
      continue;
    }

    const newRole = ROLE_MAP[oldRole];
    if (!newRole) {
      // already valid (owner/accountant/staff/viewer) or unknown — leave alone
      skipped++;
      continue;
    }

    const patch = {
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    };
    console.log(
      `  [${doc.id}] ${d.email ?? "?"}: ${oldRole} → ${newRole}`
    );
    if (!DRY_RUN) await doc.ref.update(patch);
    updated++;
  }
  console.log(`[${collectionName}] Updated: ${updated}, Skipped: ${skipped}`);
}

await migrateCollection("users");
await migrateCollection("invites", { onlyPending: true });

console.log("\nDone.");
