# Knowledge Package - Firebase + TypeScript Monorepo Template

สรุปความรู้และ best practices จากโปรเจค UniformFlow สำหรับนำไปต่อยอดโปรเจคใหม่

## 📦 เนื้อหาใน Package นี้

- **Tech Stack & Architecture** - เทคโนโลยีและสถาปัตยกรรมที่ใช้
- **Project Structure** - โครงสร้างโปรเจคแบบ Monorepo
- **Coding Standards** - มาตรฐานการเขียนโค้ด
- **Firestore Schema Design** - การออกแบบ schema ของ Firestore
- **Best Practices** - แนวทางปฏิบัติที่ดี
- **Templates** - เทมเพลตสำหรับเริ่มโปรเจคใหม่

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js >= 22.0.0
- **Language:** TypeScript 5.3+ (strict mode)
- **Platform:** Firebase Cloud Functions (2nd Gen)
- **Database:** Cloud Firestore
- **SDK:** Firebase Admin SDK 13.8+
- **Validation:** Zod 3.22+
- **Package Manager:** pnpm >= 8.0.0

### Frontend
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+
- **UI Components:** shadcn/ui
- **State Management:** Zustand 4.5+
- **Data Fetching:** TanStack Query 5.17+
- **Routing:** React Router DOM 6.21+
- **PWA:** vite-plugin-pwa 0.17+
- **Testing:** Playwright 1.48+

### Development Tools
- **Linting:** ESLint 8.56+ + @typescript-eslint
- **Formatting:** Prettier 3.2+
- **Git Hooks:** Husky 9.1+ + lint-staged 15.2+
- **Type Checking:** TypeScript 5.3+
- **Testing:** Jest 29.5+ (backend), Playwright (e2e)

## 🏗️ Architecture

### Monorepo Structure
```
project-root/
├── packages/
│   ├── functions/      # Firebase Cloud Functions (Gen 2)
│   ├── web/            # React + Vite Frontend
│   └── shared/         # Shared types & utilities
├── .windsurf/           # Workflows & rules
├── docs/                # Documentation
└── firebase.json        # Firebase configuration
```

### Modular Architecture
แต่ละ package แบ่งเป็น:
- **services/** - Firestore DB operations / business logic
- **models/** - TypeScript interfaces ของ data model
- **utils/** - Helper functions ที่ไม่มี side-effect
- **functions/** - Cloud Function entry points (HTTP / Firestore trigger / scheduled)

### Key Principles
- **TypeScript Strict Mode** - ห้ามเขียน raw JavaScript
- **Interface-First** - กำหนด interface ชัดเจนสำหรับทุก Firestore document model
- **Service Layer Pattern** - แยก business logic ออกจาก function entry points
- **Transactions** - การอัปเดตสต็อกวิกฤตต้องใช้ `db.runTransaction`

## 📚 การใช้งาน

### 1. อ่าน Tech Stack & Architecture
เปิดไฟล์ `01-tech-stack-architecture.md`

### 2. ดู Project Structure
เปิดไฟล์ `02-project-structure.md`

### 3. ศึกษา Coding Standards
เปิดไฟล์ `03-coding-standards.md`

### 4. เรียนรู้ Firestore Schema Design
เปิดไฟล์ `04-firestore-schema-design.md`

### 5. ดู Best Practices
เปิดไฟล์ `05-best-practices.md`

### 6. ใช้ Templates
เปิดไฟล์ในโฟลเดอร์ `templates/`

## 🎯 เหมาะสำหรับโปรเจคประเภท

- ระบบจัดการ Stock / Inventory
- ระบบ ERP ขนาดเล็ก-กลาง
- ระบบ B2B / B2C ที่ต้องการ Real-time sync
- แอปพลิเคชันที่ใช้ Firebase เป็น Backend
- โปรเจคที่ต้องการ Monorepo architecture

## 📝 License

Knowledge package นี้สร้างขึ้นจากประสบการณ์จริงในการพัฒนาโปรเจค UniformFlow สามารถนำไปใช้และดัดแปลงได้ตามต้องการ

---
*สร้างเมื่อ: 2026-04-21*
*อัปเดตเมื่อ: 2026-04-21*
