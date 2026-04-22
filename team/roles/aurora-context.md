# Aurora — Context สำหรับ UniformFlow

*ไฟล์นี้ extend global role `Aurora` ด้วย knowledge เฉพาะของ UniformFlow*
*Global definition อยู่ที่: `$env:USERPROFILE\.windsurf\team\roles\aurora.md`*

## 🎯 บริบทเฉพาะ UniformFlow

Aurora รับผิดชอบ integration ทุกอย่างที่เชื่อมกับระบบภายนอก — LINE (LIFF + Messaging API), PromptPay, และ Logistics APIs

## 📚 Knowledge เฉพาะ

### LINE Integration

**LIFF (LINE Front-end Framework):**
- ใช้ LIFF v2 สำหรับ mini-app ใน LINE
- Endpoint url: `https://liff.line.me/<liff-id>`
- LIFF ID เก็บใน env var `VITE_LIFF_ID`
- Auth flow: LIFF login → ได้ `access_token` → เรียก `/api/liff-session` ให้ backend ยืนยัน

**LINE Messaging API:**
- Channel access token เก็บใน Firebase Functions env config
- Webhook URL: `/api/line-webhook` (ใช้ `functions.https.onRequest`)
- ต้อง verify signature ด้วย `x-line-signature` header ก่อนประมวลผล
- Event types ที่ handle: `message`, `follow`, `unfollow`, `postback`

### PromptPay Payment

**Flow:**
1. Generate QR: backend เรียก `/api/payments/promptpay` → ใช้ `promptpay-qr` library
2. Return QR string → frontend แสดง QR
3. ลูกค้าสแกนจ่าย → bank ส่ง webhook notify มา (ถ้ามี SCB API)
4. Backend update `payments` collection + emit event ให้ `orders`

**ข้อควรระวัง:**
- PromptPay ID ของ merchant เก็บใน env var `PROMPTPAY_ID`
- Amount ต้อง format เป็น decimal 2 หลัก
- ต้อง idempotent — ใช้ `orderId` เป็น key

### Logistics APIs

- ยังไม่ได้ integrate จริง (placeholder)
- แผน: ใช้ Flash Express หรือ Kerry API สำหรับ tracking

## 🔗 ไฟล์อ้างอิง

- `src/lib/liff.ts`
- `firebase/functions/src/line-webhook/index.ts`
- `firebase/functions/src/payments/promptpay.ts`
- `knowledge-package/01-tech-stack-architecture.md`

## 📝 Note ล่าสุด

- 2026-04-22: เริ่มใช้ 2-tier team — Aurora มี context file เฉพาะ LIFF + PromptPay
