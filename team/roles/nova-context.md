# Nova — Context สำหรับ UniformFlow

*ไฟล์นี้ extend global role `Nova` ด้วย knowledge เฉพาะของ UniformFlow*
*Global definition อยู่ที่: `$env:USERPROFILE\.windsurf\team\roles\nova.md`*

## 🎯 บริบทเฉพาะ UniformFlow

Nova รับผิดชอบ Backend ของ UniformFlow ซึ่งรันบน Firebase Cloud Functions Gen 2 (Node.js 22 LTS) — จัดการ orders, production workflow, customer data, LINE webhook

## 📚 Knowledge เฉพาะ

### Tech / Schema / API

**Runtime:**
- Firebase Cloud Functions Gen 2
- Node.js 22 LTS + TypeScript 5.3+
- pnpm workspaces

**Firestore Collections หลัก:**
- `customers` — ข้อมูลลูกค้า (LINE userId, phone, address)
- `orders` — order หลัก (status: draft → confirmed → in-production → shipped → done)
- `production` — รายละเอียดการผลิต (cuts, sewing, QC)
- `products` — catalog ชุดยูนิฟอร์ม
- `payments` — PromptPay transactions

**API Endpoints หลัก:**
- `/api/orders` — CRUD orders
- `/api/line-webhook` — รับ event จาก LINE
- `/api/liff-session` — ยืนยัน session จาก LIFF
- `/api/payments/promptpay` — generate QR

**Validation:**
- ใช้ Zod ที่ `firebase/functions/src/schemas/`
- ทุก API input ต้อง parse ผ่าน Zod schema ก่อน

### Business Rules
- Order flow: `draft → confirmed → in-production → shipped → done` (reversible แค่ draft ↔ confirmed)
- ข้อมูล phone/address ของลูกค้าต้องไม่ log ออก console
- Payment flow ต้อง idempotent (ใช้ `orderId` เป็น key)

### Patterns / Conventions
- Repository pattern: ทุก Firestore access ผ่าน `src/repositories/`
- Error handling: ทุก API return `{ ok: boolean, data?, error? }`
- ใช้ `functions.https.onCall` สำหรับ endpoint ที่ต้อง auth
- ใช้ `functions.https.onRequest` สำหรับ webhook

## 🔗 ไฟล์อ้างอิง

- `firebase/functions/src/orders/index.ts`
- `firebase/functions/src/schemas/`
- `firebase/functions/src/repositories/`
- `knowledge-package/04-firestore-schema-design.md`

## 📝 Note ล่าสุด

- 2026-04-22: เริ่มใช้ 2-tier team model — Nova มี context file เฉพาะ UniformFlow
