# 🚀 UniformFlow — Go-Live Checklist

> เอกสารนี้สำหรับการ migrate จาก FlowAccount → UniformFlow และเริ่มใช้งานจริงบน production

---

## Phase 0 — Pre-Deploy (ตรวจสอบก่อน deploy)

### ✅ Code Quality
- [x] `npx tsc --noEmit` — ผ่าน 0 errors
- [x] `npm run build` — ผ่าน 34 routes
- [x] Firestore rules มี `receipts` + `billingNotes`
- [x] Firestore indexes มี `receipts` + `billingNotes` queries

### ⚠️ ก่อน deploy ทำให้ครบ
- [ ] กรอก `.env.local` ครบทุก key ตาม `.env.example`
- [ ] ทดสอบ `npm run dev` แบบ end-to-end (ดู Phase 1)
- [ ] Backup Firestore production ก่อน deploy rules
  ```powershell
  gcloud firestore export gs://YOUR_BUCKET/backup-$(Get-Date -Format yyyyMMdd) --project=uniformflow-ee6df
  ```

---

## Phase 1 — Smoke Test (ทดสอบบน dev ก่อน deploy)

### A. Setup
- [ ] `npm run dev` → เปิด `http://localhost:3000`
- [ ] เข้า `/admin/company` → กรอก: TIN, ที่อยู่, PromptPay ID, บัญชีธนาคาร, logo
- [ ] เข้า `/admin/users` → ตั้ง role `owner` ให้ตัวเอง

### B. Customer & Migration
- [ ] `/admin/tools/import-customers` — ดาวน์โหลด template, ลอง import 5 รายชื่อทดสอบ
- [ ] `/admin/tools/opening-balance` — ตั้งยอดยกมาทดสอบ → save → reload ดูว่าค่าคงเดิม

### C. Document Flow (ทดสอบครบทุกประเภท)
- [ ] **ใบเสนอราคา** — สร้าง quotation → download PDF → ตรวจ font ไทยแสดงถูก
- [ ] **ใบกำกับภาษี** — convert จาก quotation → record payment → PDF
  - [ ] PromptPay QR ใน PDF → ใช้แอปธนาคาร scan → จำนวนเงินตรง
- [ ] **ใบเสร็จรับเงิน** — ออกใบเสร็จแยก (link จาก invoice หรือ standalone) → PDF
- [ ] **ใบลดหนี้** — ออกจาก invoice ที่ออกแล้ว → PDF
- [ ] **ใบส่งของ** — สร้าง → mark delivered → PDF
- [ ] **ใบวางบิล** — เลือก customer ที่มี invoice ค้าง 2-3 ใบ → สร้าง → PDF

### D. Reports
- [ ] `/admin/reports/dashboard` — KPI cards แสดงตัวเลขถูกต้อง
- [ ] `/admin/reports/ar-aging` — bucket แบ่งถูก, CSV export ได้
- [ ] `/admin/reports/pnl` — เลือก date range → ตัวเลขสมเหตุสมผล
- [ ] `/admin/reports/vat` — รายงาน ภพ.30 → CSV export ตรง format
- [ ] `/admin/reports/cash-flow` — inflow/outflow ตรง

### E. Notifications (ถ้าตั้งค่า)
- [ ] ส่งอีเมลใบกำกับ → ลูกค้าได้รับ + แนบ PDF
- [ ] LINE notify (ถ้าตั้ง LINE_CHANNEL_ACCESS_TOKEN)

### F. Permissions
- [ ] สร้าง user ใหม่ role = `viewer` → login → กดปุ่ม "ออกใบกำกับ" → ถูก block
- [ ] role = `staff` → ดูรายงานได้แต่ออกเอกสารทางการเงินไม่ได้
- [ ] role = `accountant` → ออกเอกสารได้ทุกประเภท ยกเว้น user mgmt

---

## Phase 2 — Deploy to Production

### 1. Deploy Firestore Rules + Indexes
```powershell
firebase deploy --only firestore:rules --project uniformflow-ee6df
firebase deploy --only firestore:indexes --project uniformflow-ee6df
```
- [ ] รอ indexes build เสร็จ (เช็คที่ Firebase Console → Firestore → Indexes)

### 2. Deploy App
```powershell
# ตัวอย่าง — แก้ตาม hosting ที่ใช้ (Vercel/Firebase/Netlify)
npm run build
# Vercel:
vercel --prod
# หรือ Firebase Hosting:
firebase deploy --only hosting --project uniformflow-ee6df
```
- [ ] ตั้ง env vars บน hosting (ทุก key ใน `.env.example`)

### 3. Migrate Existing Customers (ถ้ามี)
```powershell
# ตั้ง GOOGLE_APPLICATION_CREDENTIALS ก่อน
node scripts/migrate-customers.mjs --dry-run
# ตรวจ output → ถ้าโอเค
node scripts/migrate-customers.mjs
```

### 4. ทำ Opening Balance บน Production
- [ ] เข้า `/admin/tools/opening-balance` บน production
- [ ] กรอกตัวเลข ณ วันตัดยอดจาก FlowAccount

---

## Phase 3 — Parallel Run (1 เดือน — สำคัญมาก)

ใช้ทั้ง 2 ระบบพร้อมกันเพื่อทวนตัวเลข

| สัปดาห์ | กิจกรรม |
|--------|---------|
| W1 | บันทึกเอกสารใหม่ทั้งใน FA + UF → เปรียบเทียบยอดทุกวัน |
| W2 | ส่งใบกำกับให้ลูกค้าจาก UF → ลูกค้า feedback |
| W3 | ทดสอบ ภพ.30 จาก UF เทียบกับ FA → ตัวเลขต้องตรง |
| W4 | สรุป go/no-go decision |

### Daily Reconciliation Items
- [ ] รายได้รวม (UF revenue report = FA)
- [ ] ลูกหนี้คงค้าง (UF AR aging total = FA)
- [ ] ยอด VAT (UF vat report = FA ภพ.30)
- [ ] ยอดเงินสด/ธนาคาร (manual count)

---

## Phase 4 — Cut-Over (ปิด FlowAccount)

- [ ] วันที่ตัดสินใจ go-live: __________
- [ ] Export ข้อมูลทั้งหมดจาก FA เก็บ archive (CSV + PDF ย้อนหลัง 5 ปี — ตามกฎหมายภาษี)
- [ ] แจ้งยกเลิก FA subscription
- [ ] Update เอกสารให้ทีมว่าระบบใหม่อยู่ที่ไหน

---

## 🔥 Known Limitations / Roadmap

ฟีเจอร์ที่ยังไม่มี — เพิ่มได้ภายหลังตามต้องการ

- ❌ **e-Tax Invoice (ETDA)** — ใบกำกับภาษีอิเล็กทรอนิกส์ส่งกรมสรรพากร (ยังออก PDF ปกติได้)
- ❌ **Bank reconciliation** — match รายการธนาคารกับ payment
- ❌ **Multi-currency** — รองรับเฉพาะ THB
- ❌ **Multi-tenant** — 1 deployment = 1 บริษัท
- ❌ **Mobile app native** — มีแค่ responsive web

---

## 🆘 Emergency Rollback

ถ้า production พัง:

1. **App rollback**: redeploy เวอร์ชันก่อนหน้าจาก hosting
2. **Firestore rules rollback**:
   ```powershell
   git checkout HEAD~1 firebase/firestore.rules
   firebase deploy --only firestore:rules
   ```
3. **Firestore data rollback** (worst case):
   ```powershell
   gcloud firestore import gs://YOUR_BUCKET/backup-YYYYMMDD --project=uniformflow-ee6df
   ```
4. แจ้งทีมและลูกค้า — ใช้ FlowAccount ชั่วคราวจนกว่าจะแก้ได้

---

## 📞 Support Contacts (เติมเอง)

- Firebase Console: https://console.firebase.google.com/project/uniformflow-ee6df
- Resend: https://resend.com/dashboard
- LINE Developer: https://developers.line.biz/console
- กรมสรรพากร e-Tax helpdesk: 1161

---

_Last updated: 2026-04-26 by Luna 🌙_
