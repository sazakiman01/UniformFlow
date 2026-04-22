# Project Context: UniformFlow

*บริบทเฉพาะของ repo นี้ — Luna + Team อ่านไฟล์นี้เพื่อเข้าใจโปรเจกต์*

## ข้อมูลพื้นฐาน
- **ชื่อโปรเจกต์:** UniformFlow
- **ประเภทธุรกิจ:** ระบบช่วยธุรกิจผลิตชุดยูนิฟอร์ม
- **สถานะ:** Development
- **เริ่มโปรเจกต์:** 2026

## Tech Stack
- **Backend:** Firebase Cloud Functions Gen 2 (Node.js 22 LTS, TypeScript 5.3+)
- **Frontend:** React 18 + Vite 5 + TypeScript + TailwindCSS + shadcn/ui + Lucide
- **State:** Zustand
- **Database:** Cloud Firestore (NoSQL)
- **Auth:** LINE Login ผ่าน LIFF
- **Hosting:** Firebase Hosting
- **3rd-party:** LINE Messaging API, PromptPay, Logistics APIs
- **Validation:** Zod
- **Package manager:** pnpm (workspaces)

## โครงสร้างโฟลเดอร์หลัก
```
UniformFlow/
├── firebase/functions/   # Cloud Functions (backend)
├── src/                  # Frontend React
├── knowledge-package/    # project-specific knowledge
├── requirements/         # business requirements
├── Luna/                 # Luna memory (daily, decisions, feedback)
├── team/                 # team daily + performance
└── .windsurf/rules/project-context.md
```

## Naming Conventions
- **Firestore collections:** ดู `knowledge-package/04-firestore-schema-design.md`
- **TypeScript:** strict mode, no `any`
- **Components:** PascalCase, hooks `use*`
- **Schemas:** Zod schema + TypeScript type inference

## Constraints / Business Rules
- ข้อมูลลูกค้าต้องไม่ log ออก console
- Payment flow ต้อง idempotent
- LINE webhook ต้อง verify signature
- Firestore operations ต้องใช้ transaction/batch เมื่อเปลี่ยนหลาย doc

## ทีมที่ใช้บ่อย
- **Nova** (Backend) — Cloud Functions, Firestore
- **Stella** (Frontend) — React, LIFF
- **Nebula** (Database) — Firestore schema
- **Aurora** (Integration) — LINE, PromptPay
- **Cosmos** (DevOps) — Firebase deploy
- **Sirius** (QA) — E2E testing

## ไฟล์อ้างอิงสำคัญ
- `knowledge-package/01-tech-stack-architecture.md`
- `knowledge-package/02-project-structure.md`
- `knowledge-package/04-firestore-schema-design.md`
- `requirements/ระบบคุณแฟน_สรุป.md`
- Generic coding standards → Global `knowledge-package-generic/03-coding-standards.md`
- Generic best practices → Global `knowledge-package-generic/05-best-practices.md`

---
*สร้าง 2026-04-22 (ตอน migrate เป็น Hybrid structure)*
