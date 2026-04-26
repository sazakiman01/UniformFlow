# Migration Scripts

## Setup

1. ดาวน์โหลด Firebase Admin SDK key:
   - Firebase Console → Project Settings → Service Accounts → Generate new private key
   - บันทึกเป็น `firebase-admin-key.json` (อย่า commit)

2. ตั้ง env:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = "$PWD\firebase-admin-key.json"
   ```

3. รัน script:
   ```powershell
   # ดูก่อน (ไม่เขียน)
   node scripts/migrate-customers.mjs --dry-run

   # เขียนจริง
   node scripts/migrate-customers.mjs
   ```

## Available Scripts

### `migrate-customers.mjs`
Backfill `customerType`, `branchCode`, `creditTerm`, `address` (object form) บน customers เดิม

## Required Manual Steps After Migration

1. **ตั้งค่า Company Profile** (ครั้งเดียว) — `/admin/company`
   - ชื่อบริษัท, TIN, ที่อยู่
   - PromptPay ID (ถ้าใช้)
   - ธนาคาร
2. **อัพเดต Customers ที่เป็นนิติบุคคล:**
   - เปลี่ยน `customerType` → `corporate`
   - กรอก TIN
3. **Deploy Firestore rules + indexes:**
   ```powershell
   firebase deploy --only firestore:rules,firestore:indexes
   ```
