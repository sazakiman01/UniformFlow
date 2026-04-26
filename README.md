# UniformFlow

**ระบบบัญชี การเงิน และภาษีครบวงจร** สำหรับธุรกิจยูนิฟอร์ม — ทดแทน FlowAccount

## Tech Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Styling:** Tailwind CSS + Lucide icons
- **Backend:** Firebase (Firestore, Storage, Auth, Functions)
- **PDF:** `@react-pdf/renderer` (Sarabun font — ไทยถูกต้อง 100%)
- **Email:** Resend
- **Notify:** LINE Messaging API
- **Hosting:** Firebase Hosting / Vercel

## Features

### 💰 Accounting / Finance (ทดแทน FlowAccount)
- **ใบเสนอราคา** (Quotation) → convert เป็น invoice ได้
- **ใบกำกับภาษี** (Tax Invoice) — 4 ประเภท: ใบกำกับเต็ม, ใบกำกับ+เสร็จ, ใบแจ้งหนี้, ใบเสร็จ
- **ใบเสร็จรับเงิน** (Receipt) — standalone, แยกจาก invoice
- **ใบลดหนี้** (Credit Note) — immutable after issue
- **ใบวางบิล** (Billing Note) — รวมหลาย invoice ในเอกสารเดียว
- **ใบส่งของ** (Delivery Note)
- **ค่าใช้จ่าย** (Expense) + แนบใบเสร็จ + claim VAT
- **PromptPay QR** ใน PDF (EMVCo + CRC16)
- **หัก ณ ที่จ่าย** (Withholding Tax) 1/2/3/5% + ออกใบ 50 ทวิ

### 📊 Reports
- Dashboard KPIs (revenue, profit, AR, cash flow)
- **ภพ.30** (VAT Report) — รายเดือน + CSV export
- **P&L** (กำไรขาดทุน) — customizable date range
- **Cash Flow** — inflow/outflow
- **AR Aging** — current / 1-30 / 31-60 / 61-90 / 90+
- **WHT Report** — สำหรับ ภงด.3/53

### 🔐 Security & Roles (4-tier)
- `owner` — เจ้าของกิจการ (full access)
- `accountant` — ฝ่ายบัญชี (ออกเอกสารการเงินได้)
- `staff` — พนักงาน (operations เท่านั้น)
- `viewer` — read-only

### 🔄 FlowAccount Migration Tools (`/admin/tools`)
- **CSV Importer** — import ลูกค้าจาก FA export (ไทย/อังกฤษ column names)
- **Opening Balance** — ตั้งยอดต้นงวด (เงินสด, ธนาคาร, ลูกหนี้คงค้าง)
- **Company Profile** — TIN, PromptPay, bank accounts

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Firebase project (Firestore + Auth + Storage enabled)

### Installation

```bash
git clone <repository-url>
cd UniformFlow
npm install
```

### Configure

```bash
cp .env.example .env.local
# กรอก Firebase + (optional) Resend + LINE credentials
```

ดู `.env.example` สำหรับรายการ env vars ทั้งหมด

### Run Dev
```bash
npm run dev
```
เปิด [http://localhost:3000](http://localhost:3000)

## Project Structure

```
UniformFlow/
├── src/
│   ├── app/
│   │   ├── admin/                 # Admin dashboard
│   │   │   ├── quotations/        # ใบเสนอราคา
│   │   │   ├── invoices/          # ใบกำกับภาษี
│   │   │   ├── receipts/          # ใบเสร็จรับเงิน
│   │   │   ├── credit-notes/      # ใบลดหนี้
│   │   │   ├── billing-notes/     # ใบวางบิล
│   │   │   ├── delivery-notes/    # ใบส่งของ
│   │   │   ├── expenses/          # ค่าใช้จ่าย
│   │   │   ├── reports/           # รายงานทั้งหมด
│   │   │   ├── tools/             # Migration tools
│   │   │   └── company/           # Company profile
│   │   ├── mobile/                # Mobile-first views (ช่าง)
│   │   └── api/                   # API routes (send-invoice email)
│   ├── components/
│   │   ├── admin/                 # Admin forms & pickers
│   │   └── mobile/                # Mobile components
│   ├── lib/
│   │   ├── pdf/                   # @react-pdf templates
│   │   ├── reports/               # Report builders
│   │   ├── email/                 # Resend integration
│   │   ├── notify/                # LINE integration
│   │   ├── money.ts               # VAT, baht-text, TIN validation
│   │   ├── promptpay.ts           # PromptPay QR generator
│   │   ├── document-counter.ts    # Transaction-safe numbering
│   │   ├── invoices.ts, receipts.ts, billing-notes.ts, ...
│   │   └── customer-import.ts     # CSV import
│   ├── contexts/                  # React contexts (Auth)
│   └── types/                     # TypeScript types
├── firebase/
│   ├── firestore.rules            # 4-role security rules
│   ├── firestore.indexes.json
│   └── functions/                 # Cloud Functions
├── scripts/
│   └── migrate-customers.mjs      # Backfill migration script
├── GO_LIVE_CHECKLIST.md           # 🚀 Go-live runbook
└── requirements/                  # Business analysis docs
```

## Development

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check (no output) |
| `npm run firebase:deploy` | Deploy to Firebase |

## Deployment

### 1. Deploy Firestore rules + indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 2. Deploy app
```bash
npm run build
# Firebase Hosting:
firebase deploy --only hosting
# or Vercel:
vercel --prod
```

> 📘 **Full deployment + migration runbook:** see [`GO_LIVE_CHECKLIST.md`](./GO_LIVE_CHECKLIST.md)
> — 4-phase plan (pre-deploy → smoke test → deploy → parallel run → cut-over) พร้อม rollback plan

### Backup before deploy
```bash
gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
```

## Migration from FlowAccount

1. Setup `/admin/company` — TIN, PromptPay, bank accounts
2. Export customers จาก FA เป็น CSV → `/admin/tools/import-customers`
3. `/admin/tools/opening-balance` — ตั้งยอดต้นงวด ณ วันย้าย
4. เริ่มออกเอกสารใน UF ขนาน FA 1 เดือน → เทียบยอด
5. Cut-over → ปิด FA

ดูรายละเอียดใน `GO_LIVE_CHECKLIST.md` Phase 3-4

## First-time Firebase Setup

```bash
npm install -g firebase-tools
firebase login
firebase init   # (ถ้ายังไม่ได้ init — เลือก Firestore + Hosting + Functions)
```

## Documentation

- [`GO_LIVE_CHECKLIST.md`](./GO_LIVE_CHECKLIST.md) — Go-live runbook (4 phases + rollback)
- [`scripts/README.md`](./scripts/README.md) — Migration scripts
- [`requirements/`](./requirements/) — Business analysis + spec ภาษาไทย

## License

Copyright © 2026 — Private / Internal use
